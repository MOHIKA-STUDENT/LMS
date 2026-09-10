import { GoogleGenAI } from '@google/genai';
import { AIProofreadReport, QuizQuestion } from '@/types/database';

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in server environment variables.');
  }
  return new GoogleGenAI({ apiKey });
}

export async function generateQuizWithGemini(topic: string, cefrLevel: string): Promise<{ title: string; questions: QuizQuestion[] }> {
  const ai = getGeminiClient();
  const prompt = `You are an expert English language tutor creating a CEFR-aligned quiz.
Generate a 5-question multiple-choice English quiz for CEFR Level ${cefrLevel} on the topic: "${topic}".

STRICT OUTPUT REQUIREMENT:
Respond ONLY with syntactically valid JSON matching this exact TypeScript structure:
{
  "title": "${cefrLevel} Quiz: ${topic}",
  "questions": [
    {
      "id": 1,
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Clear explanation of why this answer is correct."
    }
  ]
}

DO NOT include markdown code blocks, backticks (like \`\`\`json), or preambles. Output raw valid JSON only.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let rawText = response.text?.trim() || '';
    // Strip markdown code fences if model accidentally includes them
    rawText = rawText.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    const parsed = JSON.parse(rawText);
    return parsed;
  } catch (error: any) {
    console.error('Gemini Quiz Generation Error:', error);
    throw new Error(`Failed to generate AI quiz: ${error.message || 'Invalid response format'}`);
  }
}

export async function proofreadHomeworkWithGemini(text: string, assignmentTitle: string): Promise<AIProofreadReport> {
  const ai = getGeminiClient();
  const prompt = `You are a friendly, encouraging English Tutor proofreading a student's homework submission for the assignment: "${assignmentTitle}".

Student Submission Text:
"""
${text}
"""

STRICT OUTPUT REQUIREMENT:
Respond ONLY with syntactically valid JSON matching this exact TypeScript structure:
{
  "grammar_score": 85,
  "corrections": [
    {
      "original": "Text snippet with error",
      "suggestion": "Corrected text snippet",
      "reason": "Grammatical or stylistic explanation"
    }
  ],
  "overall_feedback": "Encouraging summary paragraph highlighting strengths and areas for improvement.",
  "improved_version": "A complete, beautifully polished version of the student's text."
}

DO NOT include markdown code blocks, backticks, or extra commentary. Output raw valid JSON only.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let rawText = response.text?.trim() || '';
    rawText = rawText.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    const parsed: AIProofreadReport = JSON.parse(rawText);
    return parsed;
  } catch (error: any) {
    console.error('Gemini Proofread Error:', error);
    throw new Error(`Failed to proofread homework: ${error.message || 'Invalid response format'}`);
  }
}
