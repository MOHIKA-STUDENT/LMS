'use server';

import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { generateQuizWithGemini, proofreadHomeworkWithGemini } from '@/lib/ai/gemini';
import { CEFRLevel } from '@prisma/client';

export async function generateQuizAction(
  userPrompt: string,
  cefrLevel: CEFRLevel = 'B1'
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

    const quizData = await generateQuizWithGemini(userPrompt, cefrLevel as any);

    return {
      success: true,
      quizDraft: {
        title: quizData.title,
        topic: userPrompt,
        cefrLevel,
        questions: quizData.questions,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to generate quiz.' };
  }
}

export async function parseRawQuizTextAction(rawText: string, cefrLevel: CEFRLevel = 'B1') {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    if (!rawText || rawText.trim().length < 15) {
      return { success: false, error: 'Please paste at least one full question with options.' };
    }

    // Call Gemini to parse raw quiz text / Google Forms into JSON questions
    const quizData = await generateQuizWithGemini(`Parse this quiz text into 5 structured multiple choice questions with options and explanations: "${rawText.slice(0, 2000)}"`, cefrLevel);

    return {
      success: true,
      quizDraft: {
        title: quizData.title || 'Pasted Google Forms Quiz',
        topic: 'Custom Upload',
        cefrLevel,
        questions: quizData.questions,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to parse raw quiz text.' };
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
