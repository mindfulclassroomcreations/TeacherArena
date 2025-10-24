-- MIGRATION: Add user authentication and tracking
-- This migration adds user_id columns and updates RLS policies

-- Add user_id column to lessons table
ALTER TABLE lessons 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to subjects table
ALTER TABLE subjects 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to frameworks table
ALTER TABLE frameworks 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to grades table
ALTER TABLE grades 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to strands table
ALTER TABLE strands 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS lessons_user_id_idx ON lessons(user_id);
CREATE INDEX IF NOT EXISTS subjects_user_id_idx ON subjects(user_id);
CREATE INDEX IF NOT EXISTS frameworks_user_id_idx ON frameworks(user_id);
CREATE INDEX IF NOT EXISTS grades_user_id_idx ON grades(user_id);
CREATE INDEX IF NOT EXISTS strands_user_id_idx ON strands(user_id);

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Allow public read access" ON subjects;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON subjects;
DROP POLICY IF EXISTS "Allow public read access" ON frameworks;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON frameworks;
DROP POLICY IF EXISTS "Allow public read access" ON grades;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON grades;
DROP POLICY IF EXISTS "Allow public read access" ON strands;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON strands;
DROP POLICY IF EXISTS "Allow public read access" ON lessons;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON lessons;

-- Create new RLS policies for subjects table
CREATE POLICY "Users can view all subjects"
  ON subjects FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own subjects"
  ON subjects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subjects"
  ON subjects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subjects"
  ON subjects FOR DELETE
  USING (auth.uid() = user_id);

-- Create new RLS policies for frameworks table
CREATE POLICY "Users can view all frameworks"
  ON frameworks FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own frameworks"
  ON frameworks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own frameworks"
  ON frameworks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own frameworks"
  ON frameworks FOR DELETE
  USING (auth.uid() = user_id);

-- Create new RLS policies for grades table
CREATE POLICY "Users can view all grades"
  ON grades FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own grades"
  ON grades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grades"
  ON grades FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own grades"
  ON grades FOR DELETE
  USING (auth.uid() = user_id);

-- Create new RLS policies for strands table
CREATE POLICY "Users can view all strands"
  ON strands FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own strands"
  ON strands FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own strands"
  ON strands FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own strands"
  ON strands FOR DELETE
  USING (auth.uid() = user_id);

-- Create new RLS policies for lessons table
CREATE POLICY "Users can view all lessons"
  ON lessons FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own lessons"
  ON lessons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lessons"
  ON lessons FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lessons"
  ON lessons FOR DELETE
  USING (auth.uid() = user_id);

-- Create a user profiles table (optional but recommended)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  school TEXT,
  grade_level TEXT,
  subjects_taught TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_profiles
CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create function to handle user profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger for user_profiles
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();
