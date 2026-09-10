'use server';

import { generateQuizWithGemini, proofreadHomeworkWithGemini } from '@/lib/ai/gemini';
import { createClient } from '@/lib/supabase/server';
import { CEFRLevel } from '@/types/database';

export async function generateQuizAction(batchId: string, cefrLevel: CEFRLevel, topic: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized. Please log in.' };
    }

    // Check if user is a teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'TEACHER') {
      return { success: false, error: 'Only teachers can generate AI quizzes.' };
    }

    const quizData = await generateQuizWithGemini(topic, cefrLevel);

    // Save quiz to database
    const { data: insertedQuiz, error: insertError } = await supabase
      .from('quizzes')
      .insert({
        batch_id: batchId,
        title: quizData.title,
        cefr_level: cefrLevel,
        topic: topic,
        questions: quizData.questions,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return { success: true, quiz: insertedQuiz };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to generate quiz.' };
  }
}

export async function proofreadHomeworkAction(text: string, assignmentTitle: string) {
  try {
    if (!text || text.trim().length < 10) {
      return { success: false, error: 'Please enter at least 10 characters to proofread.' };
    }

    const report = await proofreadHomeworkWithGemini(text, assignmentTitle);
    return { success: true, report };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to proofread assignment.' };
  }
}
