import { AIProofreadReport, QuizQuestion } from './database';

export type OfflineActionType = 'SUBMIT_HOMEWORK' | 'SUBMIT_QUIZ';

export interface PendingHomeworkPayload {
  assignmentId?: string;
  assignment_id?: string;
  studentId?: string;
  student_id?: string;
  writtenResponse?: string | null;
  submission_text?: string | null;
  file_url?: string | null;
  ai_proofread_report?: AIProofreadReport | null;
}

export interface PendingQuizPayload {
  quizId?: string;
  quiz_id?: string;
  studentId?: string;
  student_id?: string;
  scoreAwarded?: number;
  score?: number;
  total_questions?: number;
  answers_submitted?: Record<number, number>;
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
