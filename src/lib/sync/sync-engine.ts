import { offlineDb } from '../db/offline-db';
import { createClient } from '../supabase/client';
import { PendingHomeworkPayload, PendingQuizPayload } from '@/types/lms';
import { toast } from 'sonner';

export async function processOfflineQueue() {
  if (typeof window === 'undefined' || !navigator.onLine) return;

  const pendingActions = await offlineDb.offlineQueue
    .where('synced')
    .equals(0) // 0 means false in Dexie indexed search
    .toArray();

  if (pendingActions.length === 0) return;

  const supabase = createClient();
  let syncCount = 0;

  for (const action of pendingActions) {
    try {
      if (action.type === 'SUBMIT_HOMEWORK') {
        const payload = action.payload as PendingHomeworkPayload;
        const { error } = await supabase.from('homework_submissions').insert({
          assignment_id: payload.assignment_id,
          student_id: payload.student_id,
          submission_text: payload.submission_text || null,
          file_url: payload.file_url || null,
          ai_proofread_report: payload.ai_proofread_report || null,
        });

        if (!error && action.id) {
          await offlineDb.offlineQueue.delete(action.id);
          syncCount++;
        }
      } else if (action.type === 'SUBMIT_QUIZ') {
        const payload = action.payload as PendingQuizPayload;
        const { error } = await supabase.from('quiz_submissions').insert({
          quiz_id: payload.quiz_id,
          student_id: payload.student_id,
          score: payload.score,
          total_questions: payload.total_questions,
          answers_submitted: payload.answers_submitted,
        });

        if (!error) {
          // Also update student points in profiles
          const { error: rpcError } = await supabase.rpc('increment_student_points', {
            p_student_id: payload.student_id,
            p_points: payload.score * 10,
          });

          if (rpcError) {
            // Fallback manual update if RPC function not present in DB
            const { data: profileData } = await supabase
              .from('profiles')
              .select('points')
              .eq('id', payload.student_id)
              .single();

            if (profileData) {
              await supabase
                .from('profiles')
                .update({ points: (profileData.points || 0) + payload.score * 10 })
                .eq('id', payload.student_id);
            }
          }

          if (action.id) {
            await offlineDb.offlineQueue.delete(action.id);
            syncCount++;
          }
        }
      }
    } catch (err) {
      console.error('Failed to sync offline item:', err);
    }
  }

  if (syncCount > 0) {
    toast.success(`Synced ${syncCount} offline submission(s) to server!`, {
      description: 'Your progress is now updated on the online cloud database.',
    });
  }
}

export function registerOnlineSyncListener() {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', () => {
    toast.info('Back online! Reconciling offline queue...', { id: 'online-toast' });
    processOfflineQueue();
  });
}
