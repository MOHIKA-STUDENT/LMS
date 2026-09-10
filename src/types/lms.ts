import { AIProofreadReport, QuizQuestion } from './database';

export type OfflineActionType = 'SUBMIT_HOMEWORK' | 'SUBMIT_QUIZ';

export interface PendingHomeworkPayload {
  assignment_id: string;
  student_id: string;
  submission_text?: string | null;
  file_url?: string | null;
  ai_proofread_report?: AIProofreadReport | null;
}

export interface PendingQuizPayload {
  quiz_id: string;
  student_id: string;
  score: number;
  total_questions: number;
  answers_submitted: Record<number, number>;
}

export interface OfflineAction {
  id?: number;
  type: OfflineActionType;
  payload: PendingHomeworkPayload | PendingQuizPayload;
  timestamp: number;
  synced: boolean;
}

export interface GenerateQuizRequest {
  batch_id: string;
  cefr_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  topic: string;
}

export interface ProofreadHomeworkRequest {
  text: string;
  assignment_title: string;
}

export interface QuizGenerationResult {
  title: string;
  questions: QuizQuestion[];
}
