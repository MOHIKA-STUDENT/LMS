import { offlineDb } from '../db/offline-db';
import { submitQuizAction, submitHomeworkAction } from '@/app/actions/lms-actions';
import { toast } from 'sonner';

export async function processOfflineQueue() {
  if (typeof window === 'undefined' || !navigator.onLine) return;

  const pendingActions = await offlineDb.offlineQueue
    .where('synced')
    .equals(0) // 0 means false in Dexie indexed search
    .toArray();

  if (pendingActions.length === 0) return;

  let syncCount = 0;

  for (const action of pendingActions) {
    try {
      if (action.type === 'SUBMIT_HOMEWORK') {
        const payload = action.payload as any;
        const formData = new FormData();
        if (payload.assignmentId) formData.append('assignmentId', payload.assignmentId);
        if (payload.writtenResponse) formData.append('writtenResponse', payload.writtenResponse);

        const res = await submitHomeworkAction(formData);
        if (res.success && action.id) {
          await offlineDb.offlineQueue.delete(action.id);
          syncCount++;
        }
      } else if (action.type === 'SUBMIT_QUIZ') {
        const payload = action.payload as any;
        const res = await submitQuizAction(payload.quizId, payload.scoreAwarded || 0);

        if (res.success && action.id) {
          await offlineDb.offlineQueue.delete(action.id);
          syncCount++;
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
