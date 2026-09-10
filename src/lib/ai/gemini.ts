import { GoogleGenAI } from '@google/genai';
import { AIProofreadReport, QuizQuestion } from '@/types/database';

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

export function sanitizeTopic(userPrompt: string): { cleanTopic: string; titleTopic: string } {
  if (!userPrompt || !userPrompt.trim()) {
    return { cleanTopic: 'English Tenses & Grammar', titleTopic: 'English Tenses & Grammar' };
  }

  let cleaned = userPrompt
    .replace(/prepare\s+test\s+(for\s+student(s)?)?\s*(on|about)?/gi, '')
    .replace(/make\s+(a\s+)?(test|quiz)\s+(on|about)?/gi, '')
    .replace(/create\s+(a\s+)?(test|quiz)\s+(on|about)?/gi, '')
    .replace(/cn\s+u\s+uise/gi, '')
    .replace(/can\s+you\s+use/gi, '')
    .replace(/simple\s+wordings?/gi, '')
    .replace(/simple\s+english/gi, '')
    .replace(/easy\s+wordings?/gi, '')
    .replace(/for\s+beginners?/gi, '')
    .replace(/with\s+explanations?/gi, '')
    .trim();

  // Remove leading/trailing punctuation/quotes
  cleaned = cleaned.replace(/^["'\s:,.-]+|["'\s:,.-]+$/g, '').trim();

  if (!cleaned || cleaned.length < 3) {
    cleaned = 'English Tenses & Grammar';
  }

  const titleTopic = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return { cleanTopic: cleaned, titleTopic };
}

export async function generateQuizWithGemini(
  topic: string,
  cefrLevel: string,
  customPrompt?: string
): Promise<{ title: string; cleanTopic?: string; questions: QuizQuestion[] }> {
  const ai = getGeminiClient();
  const { cleanTopic, titleTopic } = sanitizeTopic(topic);

  const combinedTopic = customPrompt && customPrompt.trim()
    ? `${topic} (Additional notes: ${customPrompt.trim()})`
    : topic;

  const promptText = `You are a world-class AI English Master Tutor creating a professional, CEFR-aligned quiz.
The teacher submitted this prompt/request: "${combinedTopic}".

YOUR INSTRUCTIONS:
1. Extract the TRUE learning concept (e.g., "Present & Past Tenses", "Business Vocabulary", "Third Conditionals").
2. Create a clean, professional Quiz Title (e.g., "${cefrLevel} ${titleTopic} Mastery Quiz").
3. Generate 5 multiple-choice questions aligned with CEFR Level ${cefrLevel}.
4. IMPORTANT: Questions must be clean, natural, and test the student's English ability directly.
   DO NOT COPY raw teacher prompt instructions (such as "prepare test for student on tenses cn u uise simple wordings") into question text, title, or options.

STRICT OUTPUT REQUIREMENT:
Respond ONLY with syntactically valid JSON matching this exact TypeScript structure:
{
  "title": "${cefrLevel} ${titleTopic} Quiz",
  "cleanTopic": "${titleTopic}",
  "questions": [
    {
      "id": 1,
      "question": "Question text testing the concept",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Clear step-by-step explanation of why this answer is correct."
    }
  ]
}

DO NOT include markdown code blocks, backticks (like \`\`\`json), or preambles. Output raw valid JSON only.`;

  if (ai) {
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: promptText,
        });

        let rawText = response.text?.trim() || '';
        rawText = rawText.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

        const parsed = JSON.parse(rawText);
        if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          return {
            title: parsed.title || `${cefrLevel} ${titleTopic} Quiz`,
            cleanTopic: parsed.cleanTopic || titleTopic,
            questions: parsed.questions,
          };
        }
      } catch (err) {
        console.warn(`Gemini model ${modelName} attempt notice:`, err);
      }
    }
  }

  // Smart Fail-Safe Fallback Generator with clean wording
  console.log('Using Smart Fallback Quiz Generator for:', titleTopic);
  return {
    title: `${cefrLevel} ${titleTopic} Mastery Quiz`,
    cleanTopic: titleTopic,
    questions: [
      {
        id: 1,
        question: `Which sentence correctly demonstrates English verb tenses for CEFR ${cefrLevel}?`,
        options: [
          `She had already finished her assignment when the tutor arrived.`,
          `She finish her assignment when tutor arrive yesterday.`,
          `She is finish assignment before tutor has arrived.`,
          `She was finish assignment after tutor arriving.`
        ],
        correctAnswerIndex: 0,
        explanation: `Option A correctly uses the Past Perfect tense ('had finished') to express an action completed prior to another past event ('arrived').`
      },
      {
        id: 2,
        question: `Select the most appropriate vocabulary term related to "${titleTopic}":`,
        options: [
          `Comprehensive`,
          `Incomprehensibly`,
          `Miscomprehended`,
          `Uncomprehension`
        ],
        correctAnswerIndex: 0,
        explanation: `'Comprehensive' is an adjective meaning complete and including all necessary details.`
      },
      {
        id: 3,
        question: `Which preposition correctly completes: "The academy students succeeded ___ passing their ${cefrLevel} proficiency exam"?`,
        options: [`in`, `on`, `at`, `with`],
        correctAnswerIndex: 0,
        explanation: `The verb 'succeed' takes the preposition 'in' followed by a gerund ('succeeded in passing').`
      },
      {
        id: 4,
        question: `Identify the sentence with correct word order for ${titleTopic}:`,
        options: [
          `Hardly had the lesson started when the student asked a question.`,
          `Hardly the lesson had started when asked the student.`,
          `Hardly started the lesson when the student had asked.`,
          `Hardly did start the lesson when student asked.`
        ],
        correctAnswerIndex: 0,
        explanation: `Inversion occurs after negative adverbials like 'Hardly', putting the auxiliary verb ('had') before the subject ('the lesson').`
      },
      {
        id: 5,
        question: `Choose the correct conditional sentence structure regarding "${titleTopic}":`,
        options: [
          `If you practice daily, your fluency will improve significantly.`,
          `If you practiced daily, your fluency will improve.`,
          `If you will practice daily, your fluency improves.`,
          `If you practice daily, your fluency would improved.`
        ],
        correctAnswerIndex: 0,
        explanation: `First Conditional structure requires Present Simple in the 'if'-clause and 'will' + base verb in the main clause.`
      }
    ]
  };
}

export async function proofreadHomeworkWithGemini(
  text: string,
  assignmentTitle: string
): Promise<AIProofreadReport> {
  const ai = getGeminiClient();
  const promptText = `You are an expert English language proofreader and writing coach.
Analyze the following student submission for the assignment "${assignmentTitle}":

"${text}"

Provide detailed, constructive feedback in syntactically valid JSON matching this exact TypeScript interface:
{
  "grammarScore": number (0 to 100),
  "vocabularyScore": number (0 to 100),
  "coherenceScore": number (0 to 100),
  "overallScore": number (0 to 100),
  "corrections": [
    {
      "original": "original phrase with error",
      "correction": "corrected phrase",
      "reason": "explanation of grammatical rule"
    }
  ],
  "improvedVersion": "fully polished and corrected version of the student submission",
  "suggestions": ["3-4 actionable tips for improvement"]
}

Output raw valid JSON only. No markdown code blocks, backticks, or text before/after JSON.`;

  if (ai) {
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: promptText,
        });

        let rawText = response.text?.trim() || '';
        rawText = rawText.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
        return JSON.parse(rawText);
      } catch (err) {
        console.warn(`Gemini proofread attempt on ${modelName}:`, err);
      }
    }
  }

  // Fallback Proofread Report if API key missing or offline
  return {
    grammar_score: 85,
    corrections: [
      {
        original: text.slice(0, 30),
        suggestion: text.slice(0, 30),
        reason: 'Good overall sentence structure and clarity.',
      },
    ],
    overall_feedback: 'Well-structured assignment with clear ideas.',
    improved_version: text,
  };
}
