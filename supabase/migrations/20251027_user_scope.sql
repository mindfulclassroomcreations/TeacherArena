-- Add user scoping to user-generated tables and tighten RLS

-- 1) Add user_id columns
ALTER TABLE IF EXISTS grades ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS strands ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2) Drop permissive public read policies if they exist
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='grades' AND policyname='Allow public read on grades';
  IF FOUND THEN EXECUTE 'DROP POLICY "Allow public read on grades" ON grades'; END IF;
END $$;

DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='strands' AND policyname='Allow public read on strands';
  IF FOUND THEN EXECUTE 'DROP POLICY "Allow public read on strands" ON strands'; END IF;
END $$;

DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='lessons' AND policyname='Allow public read on lessons';
  IF FOUND THEN EXECUTE 'DROP POLICY "Allow public read on lessons" ON lessons'; END IF;
END $$;

-- 3) Create owner-only RLS policies
-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE strands ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Grades policies (owner only)
CREATE POLICY IF NOT EXISTS "grades_select_own" ON grades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "grades_insert_own" ON grades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "grades_update_own" ON grades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "grades_delete_own" ON grades FOR DELETE USING (auth.uid() = user_id);

-- Strands policies (owner only)
CREATE POLICY IF NOT EXISTS "strands_select_own" ON strands FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "strands_insert_own" ON strands FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "strands_update_own" ON strands FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "strands_delete_own" ON strands FOR DELETE USING (auth.uid() = user_id);

-- Lessons policies (owner only)
CREATE POLICY IF NOT EXISTS "lessons_select_own" ON lessons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "lessons_insert_own" ON lessons FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "lessons_update_own" ON lessons FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "lessons_delete_own" ON lessons FOR DELETE USING (auth.uid() = user_id);

-- Optional: backfill existing rows to a placeholder (admin must run a separate script to assign ownership)
-- UPDATE grades SET user_id = NULL WHERE user_id IS NULL;
-- UPDATE strands SET user_id = NULL WHERE user_id IS NULL;
-- UPDATE lessons SET user_id = NULL WHERE user_id IS NULL;
