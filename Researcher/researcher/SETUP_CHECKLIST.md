# 🎯 Setup Checklist: AI Lesson Generator

Use this checklist to track your setup progress. Check off items as you complete them.

## Phase 1: Initial Project Setup ✨

- [ ] Clone or navigate to project directory
- [ ] Install dependencies: `npm install`
- [ ] Copy `.env.local.example` to `.env.local`
- [ ] Create initial Git commit: `git commit -m "Initial commit"`

**Time Required:** 5-10 minutes

---

## Phase 2: GitHub Setup 🔗

- [ ] Create GitHub repository
- [ ] Add remote: `git remote add origin https://github.com/YOUR_USERNAME/ai-lesson-generator.git`
- [ ] Push to GitHub: `git push -u origin main`
- [ ] Enable branch protection for `main` (optional but recommended)
- [ ] Add collaborators if needed
- [ ] Set up GitHub secrets for CI/CD (if using Actions)

**Time Required:** 10 minutes

**Resources:** [GitHub Setup Guide](https://docs.github.com/en/repositories/creating-and-managing-repositories)

---

## Phase 3: Supabase Setup 🗄️

### Create Project
- [ ] Create account at [supabase.com](https://supabase.com)
- [ ] Create new project
- [ ] Wait for database initialization (2-3 minutes)
- [ ] Save database password securely

### Get Credentials
- [ ] Go to Settings → API
- [ ] Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Copy `anon key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Copy `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Paste all three into `.env.local`

### Create Database Schema
- [ ] Go to SQL Editor
- [ ] Create new query
- [ ] Copy SQL from `SUPABASE_SETUP.md`
- [ ] Run the query
- [ ] Verify tables appear in the sidebar:
  - [ ] subjects
  - [ ] frameworks
  - [ ] grades
  - [ ] strands
  - [ ] lessons

### Optional: Set Up Authentication
- [ ] Enable Auth providers (Google, GitHub, etc.)
- [ ] Add provider credentials if needed

**Time Required:** 20-30 minutes

**Resource File:** `SUPABASE_SETUP.md`

---

## Phase 4: OpenAI Setup 🤖

- [ ] Create account at [platform.openai.com](https://platform.openai.com)
- [ ] Go to API Keys
- [ ] Create new secret key
- [ ] Copy key → `OPENAI_API_KEY` in `.env.local`
- [ ] Save key securely (can't view again)
- [ ] Set up billing/usage limits
- [ ] Optionally create custom prompts

**Time Required:** 5-10 minutes

**Cost:** Starting from ~$0.01 per request (varies by model)

---

## Phase 5: Local Development 💻

- [ ] Run development server: `npm run dev`
- [ ] Visit [http://localhost:3000](http://localhost:3000)
- [ ] Verify home page loads
- [ ] Test API endpoint with cURL or Postman:
  ```bash
  curl -X POST http://localhost:3000/api/generate-with-ai \
    -H "Content-Type: application/json" \
    -d '{"type":"subjects","context":"K-12 Education"}'
  ```
- [ ] Check browser console for errors
- [ ] Verify database connection works
- [ ] Test Supabase queries if possible

**Time Required:** 10-15 minutes

---

## Phase 6: Vercel Deployment 🚀

### Pre-Deployment Checks
- [ ] All dependencies installed
- [ ] No console errors in development
- [ ] All environment variables configured locally
- [ ] Type checking passes: `npm run type-check`
- [ ] Linting passes: `npm run lint`
- [ ] Build succeeds: `npm run build`

### Deploy to Vercel
- [ ] Create account at [vercel.com](https://vercel.com)
- [ ] Create new project
- [ ] Select GitHub repository
- [ ] Configure build settings (Next.js should auto-detect)
- [ ] Add environment variables:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `OPENAI_API_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Click "Deploy"
- [ ] Wait for build completion (2-5 minutes)
- [ ] Verify production site works
- [ ] Test API endpoints work in production

### Optional: Custom Domain
- [ ] Purchase domain (GoDaddy, Namecheap, etc.)
- [ ] Go to Vercel Settings → Domains
- [ ] Add domain
- [ ] Follow DNS configuration instructions
- [ ] Verify domain resolves correctly

**Time Required:** 30-45 minutes

**Resource File:** `VERCEL_DEPLOYMENT.md`

---

## Phase 7: GitHub Actions CI/CD ⚙️

- [ ] CI/CD workflow already configured at `.github/workflows/ci.yml`
- [ ] Verify workflow runs on push/PR
- [ ] Check GitHub Actions tab for runs
- [ ] Fix any failing checks
- [ ] Optional: Add badge to README

**Time Required:** 5-10 minutes

---

## Phase 8: Testing & Validation ✅

- [ ] Test all pages load without errors
- [ ] Test API endpoints with different inputs
- [ ] Test database CRUD operations
- [ ] Test in different browsers (Chrome, Safari, Firefox)
- [ ] Test on mobile devices
- [ ] Check performance (DevTools Lighthouse)
- [ ] Verify responsive design

**Time Required:** 15-20 minutes

---

## Phase 9: Documentation & Security 📚

- [ ] Update README.md with your project details
- [ ] Review CONTRIBUTING.md
- [ ] Ensure `.env.local` is in `.gitignore` ✓ (already added)
- [ ] Add `.env.local` to `.gitignore` locally if not already
- [ ] Create issue/PR templates (optional)
- [ ] Document any customizations made
- [ ] Set up code ownership (CODEOWNERS file, optional)

**Time Required:** 10 minutes

---

## Phase 10: Monitoring & Maintenance 📊

### Set Up Monitoring
- [ ] Enable Vercel Analytics (optional)
- [ ] Set up error logging (Sentry, LogRocket, etc., optional)
- [ ] Configure Supabase alerts
- [ ] Set up OpenAI usage alerts
- [ ] Monitor GitHub Actions

### Maintenance Tasks (Weekly/Monthly)
- [ ] Check for security updates: `npm audit`
- [ ] Monitor API usage
- [ ] Review error logs
- [ ] Backup database (if needed)
- [ ] Update dependencies: `npm update`
- [ ] Rotate API keys (monthly recommended)

**Time Required:** 5-10 minutes (ongoing)

---

## Summary

**Total Setup Time:** 2-3 hours

**Breakdown:**
- Initial Setup: 5-10 min
- GitHub: 10 min
- Supabase: 20-30 min
- OpenAI: 5-10 min
- Local Development: 10-15 min
- Vercel Deployment: 30-45 min
- GitHub Actions: 5-10 min
- Testing: 15-20 min
- Documentation: 10 min
- Monitoring: 5-10 min

---

## Troubleshooting During Setup

If you encounter issues:

1. **Dependency Issues**
   - Run: `npm cache clean --force && npm install`
   - Delete `node_modules` and reinstall

2. **Environment Variables Not Loading**
   - Restart dev server
   - Check `.env.local` file exists in root
   - Verify variable names are correct

3. **Database Connection Fails**
   - Verify Supabase URL is accessible
   - Check API keys are correct
   - Ensure database is running (check Supabase dashboard)

4. **Build Fails**
   - Run locally: `npm run build`
   - Check types: `npm run type-check`
   - Review build logs

5. **Deployment Issues**
   - Check Vercel build logs
   - Verify environment variables are set
   - Test locally first

---

## Quick Reference Links

- 📖 [Complete Setup Guide](./SETUP_GUIDE.md)
- 🗄️ [Supabase Setup](./SUPABASE_SETUP.md)
- 🚀 [Vercel Deployment](./VERCEL_DEPLOYMENT.md)
- 📚 [README](./README.md)
- 🤝 [Contributing](./CONTRIBUTING.md)

---

## Need Help?

1. Check the documentation files above
2. Review GitHub Issues for similar problems
3. Check error messages in console/logs
4. Create a detailed GitHub Issue:
   - Include error message
   - Describe what you were doing
   - Include your environment (OS, Node version, etc.)
   - Attach screenshots if relevant

---

**Last Updated:** October 24, 2025
**Status:** ⚠️ Check off items as you complete them
