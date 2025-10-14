# ⚡ QUICK START - Get Running in 5 Minutes

Follow these steps in order to get your app running quickly.

---

## ✅ Step 1: Install Node.js (2 minutes)

**Option A - Using Homebrew (Recommended)**
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node
```

**Option B - Download Installer**
Visit https://nodejs.org/ and download the LTS version for macOS.

**Verify Installation**
```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
```

---

## ✅ Step 2: Install Project Dependencies (1 minute)

```bash
cd "/Users/sankalpa/Desktop/TPT/05_Super Base"
npm install
```

Wait for installation to complete (1-2 minutes).

---

## ✅ Step 3: Set Up Supabase (5 minutes)

### 3.1 Create Account
1. Go to https://supabase.com
2. Sign up (free account)
3. Create a new project
4. Wait for project to initialize (~2 minutes)

### 3.2 Create Database Table
1. In Supabase dashboard, click "SQL Editor"
2. Open the file `supabase-schema.sql` in this project
3. Copy all the SQL code
4. Paste into SQL Editor
5. Click "Run"

### 3.3 Get API Credentials
1. Go to Settings → API
2. Copy "Project URL" (https://xxxxx.supabase.co)
3. Copy "anon public" key (starts with eyJ...)

---

## ✅ Step 4: Get OpenAI API Key (3 minutes)

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with sk-...)
5. **IMPORTANT**: Go to https://platform.openai.com/account/billing
6. Add at least $5 credit to your account

---

## ✅ Step 5: Configure Environment (1 minute)

```bash
# Create environment file
cp .env.example .env.local

# Edit .env.local with your actual credentials
# Use any text editor (VS Code, TextEdit, nano, etc.)
```

Replace these values in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
OPENAI_API_KEY=sk-YOUR_OPENAI_KEY_HERE
```

---

## ✅ Step 6: Start the App (30 seconds)

```bash
npm run dev
```

You should see:
```
  ▲ Next.js 14.0.4
  - Local:        http://localhost:3000
  - Ready in 2.3s
```

---

## ✅ Step 7: Test It! (1 minute)

1. Open http://localhost:3000 in your browser
2. You should see the TPT Product Idea Automation dashboard
3. Enter a topic: "Math worksheets"
4. Select grade: "Grades 6-8"
5. Click "Generate Product Ideas"
6. Wait 10-20 seconds
7. You should see 5 new product ideas!

---

## 🎉 Success!

If you see product ideas, everything is working!

---

## 🚨 Troubleshooting

### "npm: command not found"
→ Node.js isn't installed. Go back to Step 1.

### "Failed to fetch ideas"
→ Check your Supabase URL and key in `.env.local`
→ Make sure you ran the SQL schema in Supabase

### "Failed to generate ideas"
→ Check your OpenAI API key in `.env.local`
→ Make sure you have credits in your OpenAI account
→ Visit https://platform.openai.com/account/billing

### Port 3000 in use
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

### Still stuck?
Read the detailed `INSTALLATION-GUIDE.md`

---

## 📚 Next Steps

Once everything is working:

1. ✅ Generate ideas for different topics
2. ✅ Try different grade ranges
3. ✅ Delete unwanted ideas
4. ✅ Check ideas in Supabase dashboard
5. ✅ Read `README.md` for more features
6. ✅ Deploy to Vercel (see `INSTALLATION-GUIDE.md`)

---

## 💡 Pro Tips

**Save Money on OpenAI**
- Each research request costs ~$0.01-0.05
- Generate ideas in batches
- Delete test ideas after experimenting

**Organize Better**
- Keep related ideas together
- Use consistent naming
- Review standards alignment

**Scale Up**
- Deploy to Vercel for public access
- Share with your team
- Add more customizations

---

## 📞 Need Help?

**Check these files:**
- `INSTALLATION-GUIDE.md` - Detailed setup
- `README.md` - Full documentation  
- `CHECKLIST.md` - Track your progress
- `CHEAT-SHEET.md` - Common commands
- `TROUBLESHOOTING.md` - Solve issues

---

**Total Time: ~15 minutes**
**Cost: Free (except OpenAI usage ~$0.01-0.05 per request)**

Let's build your TPT empire! 🚀📚
