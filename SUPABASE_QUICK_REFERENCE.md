# 🚀 Supabase Quick Reference

## 🔑 API Keys Location
**Supabase Dashboard → Project Settings → API**

## 📋 Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

## 🗄️ Database Tables

### Hierarchy
```
subjects
  └── frameworks
       └── grades
            └── strands
                 └── lessons
```

### Tables & Columns

**subjects**
- `id` (UUID)
- `name` (TEXT) - Unique
- `description` (TEXT)
- `created_at`, `updated_at`

**frameworks**
- `id` (UUID)
- `subject_id` (UUID) → subjects.id
- `name` (TEXT)
- `description` (TEXT)
- `created_at`, `updated_at`

**grades**
- `id` (UUID)
- `framework_id` (UUID) → frameworks.id
- `name` (TEXT)
- `description` (TEXT)
- `created_at`, `updated_at`

**strands**
- `id` (UUID)
- `grade_id` (UUID) → grades.id
- `strand_code` (TEXT)
- `strand_name` (TEXT)
- `num_standards` (INTEGER)
- `key_topics` (TEXT[])
- `target_lesson_count` (INTEGER)
- `performance_expectations` (TEXT[])
- `created_at`, `updated_at`

**lessons**
- `id` (UUID)
- `strand_id` (UUID) → strands.id
- `title` (TEXT)
- `description` (TEXT)
- `performance_expectation` (TEXT)
- `objectives` (TEXT)
- `materials` (TEXT)
- `duration` (INTEGER)
- `activities` (JSONB)
- `assessment` (TEXT)
- `differentiation` (TEXT)
- `created_at`, `updated_at`

## 🔌 API Endpoints

### Subjects
```bash
GET  /api/subjects              # Get all subjects
POST /api/subjects              # Create subject
  Body: { name, description }
```

### Frameworks
```bash
GET  /api/frameworks?subject_id={id}    # Get frameworks for subject
POST /api/frameworks                     # Create framework
  Body: { subject_id, name, description }
```

### Grades
```bash
GET  /api/grades?framework_id={id}    # Get grades for framework
POST /api/grades                       # Create grade
  Body: { framework_id, name, description }
```

### Strands
```bash
GET  /api/strands?grade_id={id}    # Get strands for grade
POST /api/strands                   # Create strands (batch)
  Body: { grade_id, strands: [...] }
```

### Lessons
```bash
GET  /api/lessons?strand_id={id}    # Get lessons for strand
POST /api/lessons                    # Create lessons (batch)
  Body: { strand_id, lessons: [...] }
```

### AI Generation
```bash
POST /api/generate-with-ai
  Body: {
    type: 'subjects' | 'frameworks' | 'grades' | 'lesson-discovery' | 'lessons',
    subject?: string,
    framework?: string,
    grade?: string,
    context?: string,
    totalLessonCount?: number
  }
```

## 📝 Useful SQL Queries

### View All Data
```sql
-- Get complete curriculum tree
SELECT 
  s.name as subject,
  f.name as framework,
  g.name as grade,
  st.strand_name,
  COUNT(l.id) as lesson_count
FROM subjects s
LEFT JOIN frameworks f ON f.subject_id = s.id
LEFT JOIN grades g ON g.framework_id = f.id
LEFT JOIN strands st ON st.grade_id = g.id
LEFT JOIN lessons l ON l.strand_id = st.id
GROUP BY s.name, f.name, g.name, st.strand_name;
```

### Count Records
```sql
SELECT 
  (SELECT COUNT(*) FROM subjects) as subjects,
  (SELECT COUNT(*) FROM frameworks) as frameworks,
  (SELECT COUNT(*) FROM grades) as grades,
  (SELECT COUNT(*) FROM strands) as strands,
  (SELECT COUNT(*) FROM lessons) as lessons;
```

### Recent Lessons
```sql
SELECT 
  l.title,
  l.description,
  st.strand_name,
  g.name as grade,
  f.name as framework,
  s.name as subject,
  l.created_at
FROM lessons l
JOIN strands st ON l.strand_id = st.id
JOIN grades g ON st.grade_id = g.id
JOIN frameworks f ON g.framework_id = f.id
JOIN subjects s ON f.subject_id = s.id
ORDER BY l.created_at DESC
LIMIT 10;
```

### Delete All Data (CAREFUL!)
```sql
-- Deletes everything in order
TRUNCATE lessons, strands, grades, frameworks, subjects CASCADE;
```

## 🛠️ Scripts

### Interactive Setup
```bash
bash scripts/setup-supabase.sh
```

### Test Connection
```bash
bash scripts/test-supabase.sh
```

### Full Project Setup
```bash
bash scripts/setup.sh
```

## 🔐 Row Level Security (RLS)

### Current Policies
- ✅ **Public Read** - Anyone can SELECT
- ✅ **Authenticated Write** - Authenticated users can INSERT/UPDATE/DELETE

### Disable RLS (Dev Only)
```sql
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE frameworks DISABLE ROW LEVEL SECURITY;
ALTER TABLE grades DISABLE ROW LEVEL SECURITY;
ALTER TABLE strands DISABLE ROW LEVEL SECURITY;
ALTER TABLE lessons DISABLE ROW LEVEL SECURITY;
```

### Re-enable RLS
```sql
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE strands ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
```

## 🐛 Troubleshooting

### Can't connect?
1. Check `.env.local` has correct URLs/keys
2. Restart dev server: `npm run dev`
3. Verify Supabase project is active

### Tables don't exist?
1. Run `supabase/schema.sql` in SQL Editor
2. Check Table Editor to verify tables

### RLS blocking requests?
1. Check policies in SQL Editor:
   ```sql
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```
2. Temporarily disable RLS for testing (see above)

### Foreign key errors?
1. Ensure parent records exist first
2. Check the correct ID is being used
3. Verify cascade delete settings

## 📚 Resources

- **Supabase Docs**: https://supabase.com/docs
- **JavaScript Client**: https://supabase.com/docs/reference/javascript
- **SQL Reference**: https://www.postgresql.org/docs/
- **Dashboard**: https://supabase.com/dashboard

## 🎯 Quick Start Checklist

- [ ] Create Supabase project
- [ ] Get API keys
- [ ] Update `.env.local`
- [ ] Run `schema.sql`
- [ ] Test with `bash scripts/test-supabase.sh`
- [ ] Start dev server: `npm run dev`
- [ ] Generate your first lesson! 🎓
