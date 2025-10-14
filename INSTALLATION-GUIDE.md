# 🚀 Complete Setup Guide - TPT Product Idea Automation

## Prerequisites Installation

### 1. Install Node.js

Node.js is required to run this application. Install it using one of these methods:

#### Option A: Using Homebrew (Recommended for macOS)
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Verify installation
node --version
npm --version
```

#### Option B: Download from Official Website
1. Visit https://nodejs.org/
2. Download the LTS (Long Term Support) version for macOS
3. Run the installer
4. Verify installation by opening Terminal and running:
   ```bash
   node --version
   npm --version
   ```

---

## Project Setup

### Step 1: Install Dependencies

After installing Node.js, navigate to the project directory and install dependencies:

```bash
cd "/Users/sankalpa/Desktop/TPT/05_Super Base"
npm install
```

This will install:
- Next.js 14 (React framework)
- React & React DOM
- TypeScript
- Tailwind CSS
- Supabase JS client
- OpenAI SDK
- All development dependencies

### Step 2: Set Up Supabase

1. **Create a Supabase Account**:
   - Go to https://supabase.com
   - Sign up for a free account
   - Create a new project

2. **Create the Database Table**:
   - In your Supabase dashboard, go to "SQL Editor"
   - Copy the contents of `supabase-schema.sql`
   - Paste and run the SQL code
   - This creates the `product_ideas` table

3. **Get Your API Credentials**:
   - Go to Settings → API in your Supabase dashboard
   - Copy your:
     - Project URL (looks like: `https://xxxxx.supabase.co`)
     - Anon/Public Key (starts with `eyJ...`)

### Step 3: Set Up OpenAI

1. **Get an OpenAI API Key**:
   - Go to https://platform.openai.com/api-keys
   - Sign in or create an account
   - Click "Create new secret key"
   - Copy and save your API key (starts with `sk-...`)
   - **Important**: Add credits to your account at https://platform.openai.com/account/billing

2. **Note About API Usage**:
   - This app uses GPT-4 Turbo for generating ideas
   - Each research request costs approximately $0.01-0.05
   - Monitor usage at https://platform.openai.com/usage

### Step 4: Configure Environment Variables

1. **Create the environment file**:
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`** with your actual credentials:
   ```env
   # SUPABASE CONFIGURATION
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # OPENAI CONFIGURATION
   OPENAI_API_KEY=sk-proj-...

   # Optional: If using OpenAI Assistants API
   OPENAI_ASSISTANT_ID=asst_...
   ```

### Step 5: Run the Development Server

```bash
npm run dev
```

The application will start at http://localhost:3000

---

## Deployment to Vercel

### Step 1: Set Up GitHub Repository

1. **Initialize Git** (if not already done):
   ```bash
   cd "/Users/sankalpa/Desktop/TPT/05_Super Base"
   git init
   git add .
   git commit -m "Initial commit: TPT Product Idea Automation"
   ```

2. **Create a GitHub Repository**:
   - Go to https://github.com/new
   - Create a new repository (e.g., `tpt-product-automation`)
   - **Don't** initialize with README (we already have one)

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/tpt-product-automation.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to Vercel

1. **Sign Up for Vercel**:
   - Go to https://vercel.com
   - Sign up with your GitHub account

2. **Import Project**:
   - Click "New Project"
   - Select your GitHub repository
   - Vercel will auto-detect Next.js

3. **Add Environment Variables**:
   Click on "Environment Variables" and add:
   
   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `OPENAI_API_KEY` | Your OpenAI API key |

4. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `https://your-project.vercel.app`

---

## Testing the Application

### Test 1: Generate Product Ideas

1. Open the application at http://localhost:3000
2. Enter a topic: "Math fractions for middle school"
3. Select grade range: "Grades 6-8"
4. Click "Generate Product Ideas"
5. Wait 10-20 seconds for AI to generate ideas
6. You should see 5 new product ideas appear

### Test 2: View and Manage Ideas

1. Generated ideas appear in the "Product Ideas Library"
2. Each idea shows:
   - Product title
   - Grade level
   - Category
   - Standards
   - Notes
3. Click "Delete" to remove an idea
4. Click "Refresh" to reload the list

### Test 3: Different Topics

Try generating ideas for various subjects:
- "Reading comprehension strategies"
- "Science lab activities"
- "Social studies projects"
- "Writing prompts for high school"

---

## Troubleshooting

### Error: "Cannot find module"
**Solution**: Run `npm install` again

### Error: "Failed to fetch ideas"
**Possible causes**:
1. Supabase URL or key is incorrect
2. Database table doesn't exist
3. Row Level Security (RLS) is blocking access

**Solution**:
- Check `.env.local` credentials
- Verify table exists in Supabase
- Check the RLS policies in Supabase

### Error: "Failed to generate ideas"
**Possible causes**:
1. OpenAI API key is invalid
2. Insufficient API credits
3. Rate limit exceeded

**Solution**:
- Verify API key at https://platform.openai.com/api-keys
- Add credits at https://platform.openai.com/account/billing
- Wait a few minutes if rate limited

### Port 3000 Already in Use
**Solution**:
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

---

## Project Structure Explained

```
├── app/
│   ├── api/
│   │   ├── ideas/route.ts       # API for CRUD operations
│   │   └── research/route.ts    # API for AI-powered research
│   ├── globals.css              # Global styles with Tailwind
│   ├── layout.tsx               # Root layout component
│   └── page.tsx                 # Main dashboard page
├── lib/
│   └── supabase.ts              # Supabase client & types
├── .env.example                 # Environment variables template
├── .env.local                   # Your actual credentials (not in Git)
├── .gitignore                   # Files to ignore in Git
├── next.config.js               # Next.js configuration
├── package.json                 # Dependencies and scripts
├── postcss.config.mjs           # PostCSS configuration
├── README.md                    # Full documentation
├── supabase-schema.sql          # Database schema
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── vercel.json                  # Vercel deployment config
```

---

## Customization Ideas

### 1. Add More Grades
Edit the grade range selector in `app/page.tsx`

### 2. Change AI Model
In `app/api/research/route.ts`, change:
```typescript
model: "gpt-4-turbo-preview"  // or "gpt-3.5-turbo" for cheaper
```

### 3. Generate More Ideas
Change the number of ideas in the prompt:
```typescript
const prompt = `... generate 10 high-demand digital product ideas ...`
```

### 4. Add Search/Filter
Implement filtering by category or grade level

### 5. Export to CSV
Add a button to export ideas to a CSV file

### 6. Add Authentication
Integrate Supabase Auth for multi-user support

---

## Next Steps

1. ✅ Install Node.js
2. ✅ Run `npm install`
3. ✅ Set up Supabase account and database
4. ✅ Get OpenAI API key
5. ✅ Configure `.env.local`
6. ✅ Run `npm run dev`
7. ✅ Test the application
8. ✅ Push to GitHub
9. ✅ Deploy to Vercel

---

## Support & Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **OpenAI API Docs**: https://platform.openai.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## Cost Estimation

### Development (Free)
- Supabase: Free tier (500MB database, 2GB file storage)
- Vercel: Free tier (unlimited projects)
- OpenAI: Pay-as-you-go (~$0.01-0.05 per research request)

### Monthly Production (Estimated)
- Supabase: $0 (free tier sufficient for small scale)
- Vercel: $0 (free tier sufficient)
- OpenAI: ~$5-20 (depending on usage, ~100-400 research requests)

**Total**: ~$5-20/month for moderate usage

---

**You're all set! Follow the steps above and you'll have your TPT Product Idea Automation system running in no time! 🎉**
