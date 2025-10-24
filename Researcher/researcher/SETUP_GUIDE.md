# Complete Setup Guide: AI Lesson Generator

This guide walks you through the entire setup process from scratch.

## 📋 Prerequisites

- **Node.js 18+** and npm (or yarn)
- **Git** installed and configured
- **GitHub account** for version control
- **Supabase account** for database
- **OpenAI API key** for AI features
- **Vercel account** for deployment

## 🚀 Quick Start (5 Steps)

### Step 1: Clone or Initialize Repository

```bash
# If starting from scratch
mkdir ai-lesson-generator
cd ai-lesson-generator
git init
git remote add origin https://github.com/YOUR_USERNAME/ai-lesson-generator.git

# Or clone existing
git clone https://github.com/YOUR_USERNAME/ai-lesson-generator.git
cd ai-lesson-generator
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- Next.js 14
- React 18
- TypeScript
- Supabase client
- OpenAI API
- Zustand state management
- Tailwind CSS

### Step 3: Set Up Environment Variables

Create `.env.local` in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# OpenAI
OPENAI_API_KEY=sk-...

# Backend (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Where to find these:**
- **Supabase URL & Keys**: [supabase.com](https://supabase.com) → Your Project → Settings → API
- **OpenAI Key**: [platform.openai.com](https://platform.openai.com) → API Keys

### Step 4: Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for database initialization (2-3 minutes)
4. Go to SQL Editor
5. Copy entire SQL from [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
6. Paste and run in SQL Editor

### Step 5: Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) ✨

---

## 🔧 Detailed Setup by Component

### A. GitHub Setup

#### Create Repository
```bash
# Create new repo on GitHub first (don't initialize with README)
git remote add origin https://github.com/YOUR_USERNAME/ai-lesson-generator.git
git add .
git commit -m "Initial commit: AI Lesson Generator"
git branch -M main
git push -u origin main
```

#### Protect Main Branch (Recommended)
1. Go to GitHub Repo → Settings → Branches
2. Add branch protection rule for `main`
3. Require pull request reviews
4. Require status checks to pass

### B. Supabase Setup (Detailed)

#### Create Project
1. [Sign in to Supabase](https://app.supabase.com)
2. Click "New project"
3. Enter:
   - Name: `ai-lesson-generator`
   - Password: (strong, 16+ chars)
   - Region: Closest to your users
4. Click "Create new project"

#### Get Credentials
1. Project Settings → API
2. Copy these to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL = Project URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY = anon key
   SUPABASE_SERVICE_ROLE_KEY = service_role key
   ```

#### Initialize Database
1. SQL Editor → New Query
2. Copy SQL from [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
3. Run query
4. Tables should appear in left sidebar

#### Optional: Enable Authentication
1. Authentication → Providers
2. Enable desired providers (Google, GitHub, etc.)
3. Add credentials/settings

### C. OpenAI Setup

#### Get API Key
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. API Keys → Create new secret key
4. Copy to `OPENAI_API_KEY` in `.env.local`

#### Create Custom Prompts (Optional)
The code references custom prompt IDs. To use custom prompts:
1. Go to OpenAI Prompts (if available in your plan)
2. Create custom system instructions
3. Update `PROMPT_ID` and `LESSON_PROMPT_ID` in code

### D. Vercel Deployment Setup

#### Before Deploying
```bash
# Test build locally
npm run build
npm run type-check

# Ensure no errors
npm run lint
```

#### Deploy Steps
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select "Import Git Repository"
4. Choose your GitHub repo
5. Click "Import"
6. Add Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   OPENAI_API_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ```
7. Click "Deploy"
8. Wait for build (2-5 minutes)
9. Your site is live! 🎉

#### Add Custom Domain
1. Vercel Dashboard → Settings → Domains
2. Add your domain
3. Follow DNS configuration
4. Update GitHub with production URL

---

## 📁 Project Structure Explained

```
ai-lesson-generator/
├── src/
│   ├── pages/
│   │   ├── _app.tsx           # App wrapper
│   │   ├── _document.tsx       # HTML document
│   │   ├── index.tsx           # Home page
│   │   └── api/
│   │       └── generate-with-ai.ts  # AI endpoint
│   ├── components/
│   │   └── Layout.tsx          # Shared layout
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client
│   │   ├── openai.ts           # OpenAI config
│   │   └── api.ts              # API helpers
│   ├── store/
│   │   └── curriculum.ts       # Zustand store
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   └── styles/
│       └── globals.css         # Global styles
├── public/                     # Static assets
├── .github/
│   └── workflows/
│       └── ci.yml              # CI/CD pipeline
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── README.md
```

---

## 🧪 Testing Locally

### Test API
```bash
# In VS Code Terminal
curl -X POST http://localhost:3000/api/generate-with-ai \
  -H "Content-Type: application/json" \
  -d '{"type":"subjects","context":"K-12 Education"}'
```

### Test Database
```javascript
// In browser console or in a test file
import { supabase } from './src/lib/supabase'

const { data } = await supabase.from('subjects').select('*')
console.log(data)
```

### Run Tests
```bash
npm run test
```

---

## 🚀 Next Steps After Setup

1. **Create sample subjects** in Supabase
2. **Test the AI generation** with different inputs
3. **Set up GitHub Actions** for CI/CD
4. **Configure Vercel analytics** for monitoring
5. **Add user authentication** (optional)
6. **Customize UI** with your branding

---

## ⚠️ Important Notes

- **Never commit `.env.local`** to Git
- **Rotate API keys regularly** for security
- **Keep `SUPABASE_SERVICE_ROLE_KEY` secret** - only use server-side
- **Monitor OpenAI costs** - set up billing alerts
- **Test before deploying** to production
- **Enable RLS on Supabase** for production use

---

## 🆘 Troubleshooting

### Dependencies won't install
```bash
rm -rf node_modules package-lock.json
npm install
```

### Environment variables not loading
- Ensure `.env.local` exists in root
- Restart development server
- Check variable names (case-sensitive)

### API errors
- Check OpenAI API key is valid
- Verify Supabase URL is accessible
- Check internet connection
- Review console logs for details

### Build fails on Vercel
- Check all environment variables are set
- Ensure types compile (`npm run type-check`)
- Review build logs in Vercel dashboard
- Test local build: `npm run build`

### Database connection issues
- Verify SUPABASE_URL is correct
- Check ANON_KEY is valid
- Ensure database is running (check Supabase dashboard)
- Check network connectivity

---

## 📚 Useful Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Vercel Documentation](https://vercel.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 📞 Getting Help

1. Check [README.md](./README.md) for overview
2. Review documentation links above
3. Check GitHub Issues for similar problems
4. Ask in GitHub Discussions
5. Create detailed issue report with:
   - Error message
   - Steps to reproduce
   - Environment (OS, Node version, etc.)
   - Screenshot if applicable

---

## 🎯 Key Endpoints Reference

### Development
- Frontend: http://localhost:3000
- API: http://localhost:3000/api

### Production (after Vercel deployment)
- Frontend: https://your-domain.vercel.app
- API: https://your-domain.vercel.app/api

### Services
- GitHub: https://github.com/your-username/ai-lesson-generator
- Supabase: https://app.supabase.com
- Vercel: https://vercel.com/dashboard
- OpenAI: https://platform.openai.com

---

Last Updated: October 24, 2025
