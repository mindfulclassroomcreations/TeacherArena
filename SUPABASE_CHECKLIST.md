# ✅ Supabase Setup Checklist

Follow this checklist to set up Supabase for your AI Lesson Generator.

---

## 🎯 Phase 1: Supabase Account Setup

- [ ] Go to https://supabase.com
- [ ] Click "Sign In" or "Start your project"
- [ ] Authenticate with GitHub
- [ ] Click "New Project"
- [ ] Enter project details:
  - [ ] Project name: `ai-lesson-generator`
  - [ ] Database password: (create & save strong password)
  - [ ] Region: (select closest to you)
  - [ ] Plan: Free tier
- [ ] Click "Create new project"
- [ ] Wait 2-3 minutes for setup ⏳

---

## 🔑 Phase 2: Get API Keys

- [ ] In Supabase dashboard, click "Project Settings" (⚙️ icon)
- [ ] Click "API" in left sidebar
- [ ] Copy **Project URL** → will be `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Copy **anon public key** → will be `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Copy **service_role key** → will be `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Keep these keys safe!

---

## 📝 Phase 3: Update Environment Variables

Option A: Use Interactive Script (Recommended)
```bash
- [ ] Run: bash scripts/setup-supabase.sh
- [ ] Follow the prompts
- [ ] Enter Supabase URL
- [ ] Enter anon key
- [ ] Enter service role key
- [ ] Enter OpenAI API key
```

Option B: Manual Setup
```bash
- [ ] Open `.env.local` in your project
- [ ] Add/update these variables:
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-...
```

- [ ] Save the file
- [ ] Verify `.env.local` is in `.gitignore`

---

## 🗄️ Phase 4: Create Database Schema

- [ ] In Supabase dashboard, click "SQL Editor"
- [ ] Click "+ New query"
- [ ] Open file: `supabase/schema.sql` in your code editor
- [ ] Copy **ALL** SQL code (Cmd+A / Ctrl+A)
- [ ] Paste into Supabase SQL Editor
- [ ] Click "Run" (or Cmd+Enter / Ctrl+Enter)
- [ ] Wait for execution to complete
- [ ] Verify success message: "Success. No rows returned"

---

## ✅ Phase 5: Verify Database Setup

### Check Tables Created
- [ ] In Supabase, go to "Table Editor"
- [ ] Verify these 5 tables exist:
  - [ ] ✅ subjects
  - [ ] ✅ frameworks
  - [ ] ✅ grades
  - [ ] ✅ strands
  - [ ] ✅ lessons

### Check Sample Data
- [ ] Click on "subjects" table
- [ ] Verify 3 rows exist:
  - [ ] Science
  - [ ] Mathematics
  - [ ] English Language Arts

### Check RLS Policies
- [ ] Go to "Authentication" → "Policies"
- [ ] Verify policies exist for all 5 tables
- [ ] Each table should have 4 policies:
  - [ ] Allow public read
  - [ ] Allow authenticated insert
  - [ ] Allow authenticated update
  - [ ] Allow authenticated delete

---

## 🧪 Phase 6: Test Connection

### Automated Testing
```bash
- [ ] Run: bash scripts/test-supabase.sh
- [ ] Wait for tests to complete
- [ ] Verify all tests pass ✅
```

### Manual Testing
```bash
- [ ] Start dev server: npm run dev
- [ ] Open browser: http://localhost:3000
- [ ] Open browser console (F12)
- [ ] Check for errors (should be none)
```

### API Endpoint Testing
```bash
- [ ] Open: http://localhost:3000/api/subjects
- [ ] Should see JSON response with 3 subjects
- [ ] Or use curl:
      curl http://localhost:3000/api/subjects
```

---

## 🎨 Phase 7: Test Frontend Integration

- [ ] Open http://localhost:3000
- [ ] Click "Set Context" button
- [ ] Enter context: "Elementary STEM education"
- [ ] Click "Save Context"
- [ ] Click "Generate Subjects"
- [ ] Wait for AI generation ⏳
- [ ] Verify subjects appear in grid
- [ ] Select a subject (should highlight)
- [ ] Generate frameworks
- [ ] Continue through workflow
- [ ] Generate complete lesson plans!

---

## 🔐 Phase 8: Security Check

- [ ] Verify `.env.local` is NOT committed to Git:
  ```bash
  git status
  # .env.local should NOT appear in changes
  ```
- [ ] Verify `.env.local` is in `.gitignore`:
  ```bash
  cat .gitignore | grep .env.local
  # Should see: .env.local
  ```
- [ ] Never share your API keys publicly
- [ ] Keep service role key server-side only
- [ ] Anon key is safe for client-side

---

## 📊 Phase 9: Explore Features

### Table Editor
- [ ] Go to Supabase "Table Editor"
- [ ] Click on each table
- [ ] Try adding a manual record
- [ ] Try editing a record
- [ ] Try deleting a test record

### SQL Editor
- [ ] Run test queries:

```sql
-- Count all records
- [ ] SELECT COUNT(*) FROM subjects;
- [ ] SELECT COUNT(*) FROM frameworks;
- [ ] SELECT COUNT(*) FROM lessons;
```

### API Logs
- [ ] Go to "Logs" in Supabase
- [ ] See API requests in real-time
- [ ] Monitor for errors

---

## 🎉 Phase 10: Final Verification

- [ ] ✅ Supabase project created
- [ ] ✅ API keys configured
- [ ] ✅ Environment variables set
- [ ] ✅ Database schema deployed
- [ ] ✅ Tables created (5 total)
- [ ] ✅ Sample data inserted
- [ ] ✅ RLS policies enabled
- [ ] ✅ Connection tested
- [ ] ✅ API endpoints working
- [ ] ✅ Frontend integration working
- [ ] ✅ Security verified
- [ ] ✅ Ready to generate lessons!

---

## 🚀 You're Done!

**Congratulations!** Your Supabase setup is complete! 🎊

### What You Have Now:
- ✅ PostgreSQL database with 5 tables
- ✅ RESTful API with 10+ endpoints
- ✅ Row Level Security policies
- ✅ AI-powered lesson generation
- ✅ Complete frontend integration
- ✅ Production-ready setup

### Next Steps:
1. Start generating curriculum: http://localhost:3000
2. Read documentation: `SUPABASE_SETUP_GUIDE.md`
3. Quick reference: `SUPABASE_QUICK_REFERENCE.md`
4. Deploy to Vercel: `VERCEL_DEPLOYMENT.md`

---

## 🆘 Having Issues?

### Common Problems & Solutions

**Problem**: Can't connect to Supabase
- [ ] Check `.env.local` has correct keys
- [ ] Restart dev server
- [ ] Verify Supabase project is active

**Problem**: Tables don't exist
- [ ] Re-run `schema.sql` in SQL Editor
- [ ] Check for SQL errors in console
- [ ] Verify you clicked "Run"

**Problem**: API returns errors
- [ ] Check browser console (F12)
- [ ] Check Supabase Logs
- [ ] Verify RLS policies exist

**Problem**: Frontend not working
- [ ] Clear browser cache
- [ ] Restart dev server
- [ ] Check console for errors

**Still stuck?**
- Read: `SUPABASE_SETUP_GUIDE.md` (detailed instructions)
- Read: `SUPABASE_QUICK_REFERENCE.md` (quick help)
- Check: https://supabase.com/docs

---

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| `SUPABASE_COMPLETE.md` | Complete overview |
| `SUPABASE_SETUP_GUIDE.md` | Step-by-step guide |
| `SUPABASE_QUICK_REFERENCE.md` | Quick reference |
| `SUPABASE_CHECKLIST.md` | This checklist |
| `supabase/schema.sql` | Database schema |

---

**Happy Lesson Generating! 🎓✨**

Print this checklist and check items off as you complete them!
