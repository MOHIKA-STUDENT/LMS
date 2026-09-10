'use server';

import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { generateQuizWithGemini, proofreadHomeworkWithGemini } from '@/lib/ai/gemini';
import { CEFRLevel } from '@prisma/client';

export async function generateQuizAction(
  batchId: string,
  cefrLevel: CEFRLevel,
  topic: string,
  customPrompt?: string
) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized. Please log in.' };
    }

    const role = (user.publicMetadata as any)?.role || (user.unsafeMetadata as any)?.role || 'STUDENT';
    if (role !== 'TEACHER') {
      return { success: false, error: 'Only teachers can generate AI quizzes.' };
    }

    const quizData = await generateQuizWithGemini(topic, cefrLevel as any, customPrompt);

    const insertedQuiz = await prisma.quiz.create({
      data: {
        batchId,
        title: quizData.title,
        cefrLevel,
        topic,
        questions: quizData.questions as any,
      },
    });

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
