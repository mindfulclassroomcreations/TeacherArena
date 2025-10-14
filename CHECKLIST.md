# 📋 Setup Checklist

Use this checklist to track your setup progress:

## Prerequisites
 - [x] Node.js installed (run `node --version` to verify) — v24.10.0
 - [x] npm installed (run `npm --version` to verify) — v11.6.0
 - [x] Git installed (optional, for version control)

> Note: Homebrew-installed Git 2.51.0 is available at `/opt/homebrew/bin/git`. The system Git (`/usr/bin/git`) remains available (Apple Git 2.39.5).

## Accounts Setup
- [ ] Supabase account created at https://supabase.com
- [ ] Supabase project created
- [ ] OpenAI account created at https://platform.openai.com
- [ ] OpenAI API key generated
- [ ] OpenAI account has credits added

## Database Setup
- [ ] Opened Supabase SQL Editor
- [ ] Ran the SQL from `supabase-schema.sql`
- [ ] Verified `product_ideas` table exists
- [ ] Copied Supabase Project URL
- [ ] Copied Supabase Anon Key

## Project Configuration
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` file created
- [ ] Supabase URL added to `.env.local`
- [ ] Supabase Anon Key added to `.env.local`
- [ ] OpenAI API Key added to `.env.local`

## Testing
- [ ] Development server started (`npm run dev`)
- [ ] Accessed http://localhost:3000 successfully
- [ ] Generated test product ideas
- [ ] Ideas saved to database
- [ ] Ideas visible in dashboard
- [ ] Delete function works

## Deployment (Optional)
- [ ] GitHub account created
- [ ] Git repository initialized
- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] Environment variables added in Vercel
- [ ] Deployment successful
- [ ] Production site tested

---

## Quick Reference

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Run Production Build Locally
```bash
npm run build
npm start
```

### Run Setup Script
```bash
./setup.sh
```

---

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-proj-...
```

---

## Getting Help

If you encounter issues:

1. Check INSTALLATION-GUIDE.md for detailed instructions
2. Review the Troubleshooting section in README.md
3. Verify all environment variables are correct
4. Check Supabase dashboard for RLS policies
5. Check OpenAI dashboard for API usage and credits

---

**Once all items are checked, you're ready to go! 🎉**
