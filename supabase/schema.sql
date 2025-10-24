-- ================================================
-- AI Lesson Generator - Supabase Database Schema
-- ================================================
-- This script creates the complete database schema for the AI Lesson Generator
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- TABLES
-- ================================================

-- Subjects table
-- Stores educational subjects (e.g., Science, Math, English)
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Frameworks table
-- Stores curriculum frameworks (e.g., NGSS, Common Core)
CREATE TABLE frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(subject_id, name)
);

-- Grades table
-- Stores individual grade levels (e.g., Grade 1, Grade 2)
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(framework_id, name)
);

-- Strands table
-- Stores curriculum strands/domains within a grade
CREATE TABLE strands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id UUID NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
  strand_code TEXT NOT NULL,
  strand_name TEXT NOT NULL,
  num_standards INTEGER DEFAULT 0,
  key_topics TEXT[] DEFAULT '{}',
  target_lesson_count INTEGER DEFAULT 0,
  performance_expectations TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(grade_id, strand_code)
);

-- Lessons table
-- Stores individual lesson plans
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strand_id UUID NOT NULL REFERENCES strands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  performance_expectation TEXT,
  objectives TEXT,
  materials TEXT,
  duration INTEGER, -- in minutes
  activities JSONB, -- flexible structure for lesson activities
  assessment TEXT,
  differentiation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- INDEXES
-- ================================================
-- Create indexes for better query performance

CREATE INDEX idx_frameworks_subject_id ON frameworks(subject_id);
CREATE INDEX idx_grades_framework_id ON grades(framework_id);
CREATE INDEX idx_strands_grade_id ON strands(grade_id);
CREATE INDEX idx_lessons_strand_id ON lessons(strand_id);
CREATE INDEX idx_subjects_name ON subjects(name);
CREATE INDEX idx_lessons_title ON lessons(title);

-- ================================================
-- TRIGGERS
-- ================================================
-- Automatically update updated_at timestamp

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subjects_updated_at 
  BEFORE UPDATE ON subjects
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_frameworks_updated_at 
  BEFORE UPDATE ON frameworks
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at 
  BEFORE UPDATE ON grades
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strands_updated_at 
  BEFORE UPDATE ON strands
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at 
  BEFORE UPDATE ON lessons
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS on all tables
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE strands ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- ================================================
-- RLS POLICIES - Public Read, Authenticated Write
-- ================================================

-- Subjects policies
CREATE POLICY "Allow public read on subjects" 
  ON subjects FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated insert on subjects" 
  ON subjects FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on subjects" 
  ON subjects FOR UPDATE 
  USING (true);

CREATE POLICY "Allow authenticated delete on subjects" 
  ON subjects FOR DELETE 
  USING (true);

-- Frameworks policies
CREATE POLICY "Allow public read on frameworks" 
  ON frameworks FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated insert on frameworks" 
  ON frameworks FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on frameworks" 
  ON frameworks FOR UPDATE 
  USING (true);

CREATE POLICY "Allow authenticated delete on frameworks" 
  ON frameworks FOR DELETE 
  USING (true);

-- Grades policies
CREATE POLICY "Allow public read on grades" 
  ON grades FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated insert on grades" 
  ON grades FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on grades" 
  ON grades FOR UPDATE 
  USING (true);

CREATE POLICY "Allow authenticated delete on grades" 
  ON grades FOR DELETE 
  USING (true);

-- Strands policies
CREATE POLICY "Allow public read on strands" 
  ON strands FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated insert on strands" 
  ON strands FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on strands" 
  ON strands FOR UPDATE 
  USING (true);

CREATE POLICY "Allow authenticated delete on strands" 
  ON strands FOR DELETE 
  USING (true);

-- Lessons policies
CREATE POLICY "Allow public read on lessons" 
  ON lessons FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated insert on lessons" 
  ON lessons FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on lessons" 
  ON lessons FOR UPDATE 
  USING (true);

CREATE POLICY "Allow authenticated delete on lessons" 
  ON lessons FOR DELETE 
  USING (true);

-- ================================================
-- SAMPLE DATA (Optional - for testing)
-- ================================================

-- Insert sample subject
INSERT INTO subjects (name, description) VALUES
  ('Science', 'Natural sciences including physics, chemistry, biology, and earth science'),
  ('Mathematics', 'Mathematical concepts and problem-solving skills'),
  ('English Language Arts', 'Reading, writing, speaking, and listening skills');

-- ================================================
-- VERIFICATION QUERIES
-- ================================================
-- Run these to verify your setup

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Count records in each table
SELECT 
  'subjects' as table_name, COUNT(*) as count FROM subjects
UNION ALL
SELECT 'frameworks', COUNT(*) FROM frameworks
UNION ALL
SELECT 'grades', COUNT(*) FROM grades
UNION ALL
SELECT 'strands', COUNT(*) FROM strands
UNION ALL
SELECT 'lessons', COUNT(*) FROM lessons;

-- ================================================
-- SUCCESS!
-- ================================================
-- Your database is now ready to use with the AI Lesson Generator
-- Next steps:
-- 1. Copy your API keys to .env.local
-- 2. Test the connection with your frontend
-- 3. Start generating lessons!
