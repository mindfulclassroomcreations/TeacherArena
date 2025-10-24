# Supabase Setup Guide

## Getting Started with Supabase

### 1. Create a Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click "Sign In" and authenticate with GitHub
3. Click "New Project"

### 2. Create a Project

1. Enter project name (e.g., "ai-lesson-generator")
2. Create a strong database password
3. Select region closest to your users
4. Click "Create new project"
5. Wait for project initialization (2-3 minutes)

### 3. Get Your API Keys

1. Go to "Project Settings" → "API"
2. Copy the following to your `.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon (public)** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role (secret)** → `SUPABASE_SERVICE_ROLE_KEY`

## Database Schema Setup

### Method 1: Using SQL Editor (Recommended)

1. Go to "SQL Editor" in Supabase dashboard
2. Click "New Query"
3. Copy and paste the schema SQL below
4. Click "Run"

### Method 2: Using Migrations

Create a migrations directory and run SQL files incrementally.

## Database Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Subjects table
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Frameworks table
CREATE TABLE frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(subject_id, name)
);

-- Grades table
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(framework_id, name)
);

-- Strands table
CREATE TABLE strands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id UUID NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
  strand_code TEXT NOT NULL,
  strand_name TEXT NOT NULL,
  num_standards INTEGER DEFAULT 0,
  key_topics TEXT[] DEFAULT '{}',
  target_lesson_count INTEGER DEFAULT 0,
  performance_expectations TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(grade_id, strand_code)
);

-- Lessons table
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strand_id UUID NOT NULL REFERENCES strands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  performance_expectation TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_frameworks_subject_id ON frameworks(subject_id);
CREATE INDEX idx_grades_framework_id ON grades(framework_id);
CREATE INDEX idx_strands_grade_id ON strands(grade_id);
CREATE INDEX idx_lessons_strand_id ON lessons(strand_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_frameworks_updated_at BEFORE UPDATE ON frameworks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strands_updated_at BEFORE UPDATE ON strands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Row Level Security (RLS)

### Enable RLS on All Tables

```sql
-- Enable RLS
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE strands ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Create policies (allow public read, authenticated write)
CREATE POLICY "Allow public read" ON subjects
  FOR SELECT USING (true);

CREATE POLICY "Allow public read" ON frameworks
  FOR SELECT USING (true);

CREATE POLICY "Allow public read" ON grades
  FOR SELECT USING (true);

CREATE POLICY "Allow public read" ON strands
  FOR SELECT USING (true);

CREATE POLICY "Allow public read" ON lessons
  FOR SELECT USING (true);

-- For writes, you can restrict to authenticated users
-- This is just an example - customize based on your needs
CREATE POLICY "Allow authenticated insert" ON subjects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

## API Documentation

### List Subjects
```javascript
const { data, error } = await supabase
  .from('subjects')
  .select('*')
```

### Get Subject with Frameworks
```javascript
const { data, error } = await supabase
  .from('subjects')
  .select('*, frameworks(*)')
  .eq('id', subjectId)
  .single()
```

### Create Subject
```javascript
const { data, error } = await supabase
  .from('subjects')
  .insert([{
    name: 'Mathematics',
    description: 'Math curriculum'
  }])
```

### Delete with Cascading
```javascript
// Supabase handles CASCADE automatically
const { error } = await supabase
  .from('subjects')
  .delete()
  .eq('id', subjectId)
```

## Real-time Subscriptions

Monitor changes in real-time:

```javascript
const subscription = supabase
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'lessons'
  }, (payload) => {
    console.log('Change received!', payload)
  })
  .subscribe()
```

## Backups

### Automatic Backups
- Supabase keeps daily backups (Pro plan)
- Free tier has point-in-time recovery (7 days)

### Manual Backups
1. Go to "Database" → "Backups"
2. Click "Create Backup" (Pro plan)
3. Download as needed

## Performance Optimization

### Add Indexes
Already included in the schema above. Check them:
```sql
SELECT * FROM pg_indexes WHERE schemaname = 'public';
```

### Query Optimization
- Use select() to limit columns
- Use filters (where clauses) on indexed columns
- Use pagination for large datasets

### Monitor Usage
1. Go to "Reports"
2. Check "Storage" and "Egress" usage
3. View API call metrics

## Authentication (Optional)

To add user authentication later:

1. Enable Auth in Supabase dashboard
2. Configure providers (Google, GitHub, etc.)
3. Add auth policies to RLS

```sql
-- Example: Scope lessons to users
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lessons" ON lessons
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own lessons" ON lessons
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Troubleshooting

### Connection Issues
- Check if database is running (Status page)
- Verify API keys are correct
- Check network connectivity
- Try resetting API keys

### Query Errors
- Check table/column names (case-sensitive in some cases)
- Verify RLS policies
- Check if fields exist
- View logs in "Database" → "Query Analysis"

### Rate Limiting
- Vercel free tier has limits
- Optimize queries
- Implement caching
- Consider upgrade

## References

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Client Library](https://supabase.com/docs/reference/javascript/introduction)
