-- ==========================================
-- ENGLISH TUTORS ACADEMY LMS - SUPABASE SCHEMA
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BATCHES TABLE
CREATE TABLE IF NOT EXISTS batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cefr_level TEXT CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')) DEFAULT 'B1',
  schedule_info TEXT,
  zoom_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROFILES TABLE (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('TEACHER', 'STUDENT')) NOT NULL DEFAULT 'STUDENT',
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  points INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. COURSE MATERIALS TABLE
CREATE TABLE IF NOT EXISTS course_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. HOMEWORK SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS homework_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  submission_text TEXT,
  file_url TEXT,
  ai_proofread_report JSONB,
  teacher_feedback TEXT,
  score_awarded INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. QUIZZES TABLE (Gemini AI Generated)
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  cefr_level TEXT NOT NULL,
  topic TEXT NOT NULL,
  questions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. QUIZ SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS quiz_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  score INT NOT NULL,
  total_questions INT DEFAULT 5,
  answers_submitted JSONB NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check if current user is a Teacher
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'TEACHER'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper Function: Get current student batch_id
CREATE OR REPLACE FUNCTION public.get_user_batch_id()
RETURNS UUID AS $$
DECLARE
  v_batch_id UUID;
BEGIN
  SELECT batch_id INTO v_batch_id
  FROM public.profiles
  WHERE id = auth.uid();
  RETURN v_batch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------
-- 1. BATCHES POLICIES
-- ------------------------------------------
CREATE POLICY "Teachers can manage all batches"
  ON batches FOR ALL
  USING (is_teacher());

CREATE POLICY "Students can view their assigned batch"
  ON batches FOR SELECT
  USING (id = get_user_batch_id());

-- ------------------------------------------
-- 2. PROFILES POLICIES
-- ------------------------------------------
CREATE POLICY "Teachers can view and manage all profiles"
  ON profiles FOR ALL
  USING (is_teacher());

CREATE POLICY "Users can view profile names and points (for Leaderboard)"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile on signup"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ------------------------------------------
-- 3. COURSE MATERIALS POLICIES
-- ------------------------------------------
CREATE POLICY "Teachers can manage course materials"
  ON course_materials FOR ALL
  USING (is_teacher());

CREATE POLICY "Students can view materials for their batch"
  ON course_materials FOR SELECT
  USING (batch_id = get_user_batch_id());

-- ------------------------------------------
-- 4. ASSIGNMENTS POLICIES
-- ------------------------------------------
CREATE POLICY "Teachers can manage assignments"
  ON assignments FOR ALL
  USING (is_teacher());

CREATE POLICY "Students can view assignments for their batch"
  ON assignments FOR SELECT
  USING (batch_id = get_user_batch_id());

-- ------------------------------------------
-- 5. HOMEWORK SUBMISSIONS POLICIES
-- ------------------------------------------
CREATE POLICY "Teachers can view and update all submissions"
  ON homework_submissions FOR ALL
  USING (is_teacher());

CREATE POLICY "Students can view their own submissions"
  ON homework_submissions FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own submissions"
  ON homework_submissions FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- ------------------------------------------
-- 6. QUIZZES POLICIES
-- ------------------------------------------
CREATE POLICY "Teachers can manage quizzes"
  ON quizzes FOR ALL
  USING (is_teacher());

CREATE POLICY "Students can view quizzes for their batch"
  ON quizzes FOR SELECT
  USING (batch_id = get_user_batch_id());

-- ------------------------------------------
-- 7. QUIZ SUBMISSIONS POLICIES
-- ------------------------------------------
CREATE POLICY "Teachers can view all quiz submissions"
  ON quiz_submissions FOR SELECT
  USING (is_teacher());

CREATE POLICY "Students can view their own quiz submissions"
  ON quiz_submissions FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can submit quiz results"
  ON quiz_submissions FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Trigger to auto-create profile row on Supabase Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, batch_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'STUDENT'),
    NULLIF(new.raw_user_meta_data->>'batch_id', '')::UUID
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
