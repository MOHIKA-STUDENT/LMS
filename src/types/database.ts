export type UserRole = 'TEACHER' | 'STUDENT';
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface Batch {
  id: string;
  name: string;
  description: string | null;
  cefr_level: CEFRLevel;
  schedule_info: string | null;
  zoom_link: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  batch_id: string | null;
  points: number;
  is_active: boolean;
  created_at: string;
  batches?: Batch | null;
}

export interface CourseMaterial {
  id: string;
  batch_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  file_size_bytes: number;
  created_at: string;
}

export interface Assignment {
  id: string;
  batch_id: string;
  title: string;
  description: string;
  due_date: string;
  created_at: string;
}

export interface AIProofreadReport {
  grammar_score: number;
  corrections: Array<{
    original: string;
    suggestion: string;
    reason: string;
  }>;
  overall_feedback: string;
  improved_version: string;
}

export interface HomeworkSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_text: string | null;
  file_url: string | null;
  ai_proofread_report: AIProofreadReport | null;
  teacher_feedback: string | null;
  score_awarded: number;
  created_at: string;
  profiles?: Profile | null;
  assignments?: Assignment | null;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  batch_id: string;
  title: string;
  cefr_level: CEFRLevel;
  topic: string;
  questions: QuizQuestion[];
  created_at: string;
}

export interface QuizSubmission {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number;
  total_questions: number;
  answers_submitted: Record<number, number>;
  completed_at: string;
}
