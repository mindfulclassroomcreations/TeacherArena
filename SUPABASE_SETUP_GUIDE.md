# 🚀 Supabase Setup - Step by Step Guide

## Overview
This guide will walk you through setting up Supabase for your AI Lesson Generator application.

---

## 📋 Step 1: Create Supabase Account & Project

### 1.1 Create Account
1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign In"**
3. Sign in with **GitHub** (recommended) or email

### 1.2 Create New Project
1. Click **"New Project"**
2. Fill in project details:
   - **Name**: `ai-lesson-generator` (or your preferred name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Free tier is perfect to start
3. Click **"Create new project"**
4. ⏳ Wait 2-3 minutes for setup to complete

---

## 🔑 Step 2: Get Your API Keys

### 2.1 Navigate to Project Settings
1. In your Supabase dashboard, click **"Project Settings"** (gear icon)
2. Click **"API"** in the left sidebar

### 2.2 Copy Your Keys
You'll see three important values:

| Key | Environment Variable | Description |
|-----|---------------------|-------------|
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` | Your project's API endpoint |
| **anon public** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public key for frontend |
| **service_role** | `SUPABASE_SERVICE_ROLE_KEY` | Secret key for backend |

### 2.3 Update .env.local
Open your `.env.local` file and update it:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI Configuration (if not already set)
OPENAI_API_KEY=sk-...
```

⚠️ **Important**: Never commit `.env.local` to Git! It's already in `.gitignore`.

---

## 🗄️ Step 3: Create Database Schema

### 3.1 Open SQL Editor
1. In Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**

### 3.2 Copy & Run Schema
1. Open the file `supabase/schema.sql` in your project
2. Copy **ALL** the SQL code
3. Paste it into the Supabase SQL Editor
4. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)

### 3.3 Verify Success
You should see:
```
Success. No rows returned
```

This means your database is created! ✅

---

## ✅ Step 4: Verify Database Setup

### 4.1 Check Tables
1. In Supabase, go to **"Table Editor"**
2. You should see these tables:
   - ✅ subjects
   - ✅ frameworks
   - ✅ grades
   - ✅ strands
   - ✅ lessons

### 4.2 Run Verification Query
In SQL Editor, run:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see 5 tables listed.

### 4.3 Check Sample Data
Run this query:

```sql
SELECT * FROM subjects;
```

You should see 3 sample subjects (Science, Mathematics, English Language Arts).

---

## 🧪 Step 5: Test the Connection

### 5.1 Start Your Development Server
```bash
npm run dev
```

### 5.2 Test API Endpoint
Open your browser or use curl to test:

```bash
# Test subjects endpoint
curl http://localhost:3000/api/subjects
```

You should get a JSON response with the sample subjects.

### 5.3 Test from Frontend
1. Open http://localhost:3000
2. Click **"Set Context"**
3. Enter some context and generate subjects
4. The generated subjects should save to Supabase

---

## 📊 Step 6: Explore Your Data

### 6.1 Table Editor
- Go to **Table Editor** in Supabase
- Click on any table to view/edit data
- You can manually add/edit/delete rows here

### 6.2 SQL Editor
- Write custom queries
- Useful for debugging
- Example queries:

```sql
-- Count all records
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

-- Get complete curriculum hierarchy
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
GROUP BY s.name, f.name, g.name, st.strand_name
ORDER BY s.name, f.name, g.name, st.strand_name;
```

---

## 🔐 Step 7: Understanding Row Level Security (RLS)

### What is RLS?
Row Level Security controls who can access what data in your database.

### Our Setup
- **Public Read**: Anyone can read data (good for browsing lessons)
- **Authenticated Write**: Only authenticated users can create/update/delete

### Current Policies
All tables have these policies enabled:
- ✅ `Allow public read` - Anyone can SELECT
- ✅ `Allow authenticated insert` - Auth users can INSERT
- ✅ `Allow authenticated update` - Auth users can UPDATE
- ✅ `Allow authenticated delete` - Auth users can DELETE

### To View Policies
```sql
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## 🎯 Step 8: API Endpoints Reference

Your app now has these API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/subjects` | GET | Get all subjects |
| `/api/subjects` | POST | Create subject |
| `/api/frameworks?subject_id=xxx` | GET | Get frameworks for subject |
| `/api/frameworks` | POST | Create framework |
| `/api/grades?framework_id=xxx` | GET | Get grades for framework |
| `/api/grades` | POST | Create grade |
| `/api/strands?grade_id=xxx` | GET | Get strands for grade |
| `/api/strands` | POST | Create strands (batch) |
| `/api/lessons?strand_id=xxx` | GET | Get lessons for strand |
| `/api/lessons` | POST | Create lessons (batch) |
| `/api/generate-with-ai` | POST | Generate with OpenAI |

---

## 🔧 Troubleshooting

### Issue: "Failed to connect to Supabase"
**Solution**: 
1. Check your `.env.local` has correct URLs and keys
2. Restart your dev server: `npm run dev`
3. Verify keys in Supabase dashboard haven't changed

### Issue: "Row Level Security policy violation"
**Solution**:
1. Verify RLS policies are created (run schema.sql again)
2. Check if you need authentication for certain operations

### Issue: "Table does not exist"
**Solution**:
1. Go to SQL Editor in Supabase
2. Run the schema.sql file again
3. Check Table Editor to verify tables exist

### Issue: "Cannot insert data"
**Solution**:
1. Check foreign key constraints (subject_id, framework_id, etc.)
2. Make sure parent records exist before creating children
3. Verify unique constraints aren't violated

---

## 📈 Next Steps

### 1. Add Authentication (Optional)
If you want user accounts:
```bash
# Supabase has built-in auth
# Enable in: Authentication > Providers
```

### 2. Set Up Realtime (Optional)
For live updates when data changes:
```javascript
// In your frontend
const subscription = supabase
  .channel('lessons')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, 
    payload => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
```

### 3. Backup Your Data
Supabase provides automatic backups, but you can also:
- Export data from Table Editor
- Use `pg_dump` for full backups
- Set up scheduled backups in Project Settings

### 4. Monitor Performance
- Check **Database > Performance** in Supabase
- Review slow queries
- Add indexes as needed

---

## ✨ You're All Set!

Your Supabase database is now:
- ✅ Created and configured
- ✅ Schema deployed
- ✅ Sample data inserted
- ✅ RLS policies enabled
- ✅ Connected to your app
- ✅ Ready for production!

**Start generating lessons!** 🎓

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL Tutorial](https://www.postgresql.org/docs/current/tutorial.html)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🆘 Need Help?

- [Supabase Discord](https://discord.supabase.com/)
- [GitHub Issues](https://github.com/supabase/supabase/issues)
- Project documentation in this repository
