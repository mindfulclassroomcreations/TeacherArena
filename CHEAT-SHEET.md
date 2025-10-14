# 🛠️ Developer Cheat Sheet

Quick reference for common tasks and commands.

---

## 📦 NPM Commands

### Basic Commands
```bash
# Install all dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Update all packages
npm update

# Check for outdated packages
npm outdated
```

### Development Workflow
```bash
# Clean install (if having issues)
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next

# Full clean rebuild
rm -rf node_modules .next package-lock.json
npm install
npm run dev
```

---

## 🗄️ Supabase Commands (SQL)

### Query Examples
```sql
-- View all ideas
SELECT * FROM product_ideas ORDER BY created_at DESC;

-- Count total ideas
SELECT COUNT(*) FROM product_ideas;

-- Ideas by grade level
SELECT grade_level, COUNT(*) 
FROM product_ideas 
GROUP BY grade_level;

-- Ideas by category
SELECT category, COUNT(*) 
FROM product_ideas 
GROUP BY category;

-- Search by topic
SELECT * FROM product_ideas 
WHERE product_title ILIKE '%fraction%';

-- Recent ideas (last 7 days)
SELECT * FROM product_ideas 
WHERE created_at > NOW() - INTERVAL '7 days';

-- Delete old test data
DELETE FROM product_ideas 
WHERE created_at < '2024-10-01';

-- Backup (export)
-- Use Supabase dashboard > Table Editor > Export as CSV
```

---

## 🔧 Git Commands

### Initial Setup
```bash
# Initialize repository
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit: TPT Product Idea Automation"

# Add remote
git remote add origin https://github.com/username/repo.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Daily Workflow
```bash
# Check status
git status

# Add changes
git add .

# Commit with message
git commit -m "Add new feature: XYZ"

# Push to GitHub
git push

# Pull latest changes
git pull

# Create new branch
git checkout -b feature/new-feature

# Switch branches
git checkout main

# Merge branch
git merge feature/new-feature

# View commit history
git log --oneline
```

### Useful Git Commands
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all local changes
git reset --hard HEAD

# View differences
git diff

# View remote URL
git remote -v

# Remove remote
git remote remove origin
```

---

## 🚀 Vercel CLI Commands

### Install Vercel CLI
```bash
npm install -g vercel
```

### Deployment Commands
```bash
# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View deployment logs
vercel logs

# List all deployments
vercel list

# Remove deployment
vercel remove [deployment-url]

# Add environment variable
vercel env add OPENAI_API_KEY

# View environment variables
vercel env ls
```

---

## 🐛 Debug Commands

### Check Logs
```bash
# Browser console (Chrome DevTools)
# Press F12 or Cmd+Option+I (Mac) / Ctrl+Shift+I (Windows)

# View Next.js dev server logs
# Already visible in terminal where you ran 'npm run dev'

# Check Supabase logs
# Visit: Supabase Dashboard > Logs

# Check OpenAI usage
# Visit: https://platform.openai.com/usage
```

### Test API Endpoints
```bash
# Using curl (research endpoint)
curl -X POST http://localhost:3000/api/research \
  -H "Content-Type: application/json" \
  -d '{"topic":"Math fractions","gradeRange":"6-8"}'

# Using curl (get ideas)
curl http://localhost:3000/api/ideas

# Using curl (delete idea)
curl -X DELETE http://localhost:3000/api/ideas?id=YOUR_IDEA_ID
```

---

## 🔐 Environment Variables

### Required Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Optional
OPENAI_ASSISTANT_ID=asst_...
```

### Loading Environment Variables
```bash
# Next.js automatically loads from .env.local
# Restart dev server after changing .env.local

# Check if env var is loaded (in Node.js)
console.log(process.env.OPENAI_API_KEY)

# In browser (only NEXT_PUBLIC_* vars)
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```

---

## 📊 Database Maintenance

### Backup
```bash
# Export from Supabase Dashboard
# Table Editor > Export as CSV

# Or use pg_dump (advanced)
pg_dump -h db.xxxxx.supabase.co -U postgres -d postgres > backup.sql
```

### Restore
```bash
# Import CSV in Supabase Dashboard
# Table Editor > Import from CSV

# Or use psql (advanced)
psql -h db.xxxxx.supabase.co -U postgres -d postgres < backup.sql
```

---

## 🧪 Testing Checklist

### Before Committing
- [ ] `npm run dev` works without errors
- [ ] Can generate new ideas
- [ ] Ideas save to database
- [ ] Can delete ideas
- [ ] No console errors
- [ ] Environment variables are set
- [ ] Code is formatted

### Before Deploying
- [ ] `npm run build` succeeds
- [ ] All environment variables added to Vercel
- [ ] Database is accessible
- [ ] OpenAI API key is valid
- [ ] Test on preview deployment first

---

## 🎨 Tailwind CSS Quick Reference

### Common Classes
```css
/* Layout */
flex, grid, block, inline-block
container, mx-auto

/* Spacing */
p-4 (padding), m-4 (margin)
px-4 (horizontal padding), py-4 (vertical padding)
space-x-4 (gap between children)

/* Colors */
bg-blue-500, text-white
bg-gradient-to-br from-blue-50 to-indigo-100

/* Typography */
text-xl, text-2xl, text-3xl
font-bold, font-semibold, font-medium

/* Borders */
border, border-2, border-gray-300
rounded, rounded-lg, rounded-full

/* Shadows */
shadow, shadow-md, shadow-lg

/* Responsive */
sm:text-lg (small screens)
md:grid-cols-2 (medium screens)
lg:px-8 (large screens)

/* Hover/Focus */
hover:bg-blue-600
focus:ring-2 focus:ring-blue-500
```

---

## 🔍 VS Code Tips

### Recommended Extensions
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- GitLens
- Prettier - Code formatter
- ESLint

### Useful Shortcuts (Mac)
- `Cmd+P` - Quick file open
- `Cmd+Shift+P` - Command palette
- `Cmd+B` - Toggle sidebar
- `Cmd+/` - Toggle comment
- `Cmd+D` - Select next occurrence
- `Option+Shift+F` - Format document

### Useful Shortcuts (Windows)
- `Ctrl+P` - Quick file open
- `Ctrl+Shift+P` - Command palette
- `Ctrl+B` - Toggle sidebar
- `Ctrl+/` - Toggle comment
- `Ctrl+D` - Select next occurrence
- `Alt+Shift+F` - Format document

---

## 📝 Common TypeScript Patterns

### API Response Types
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Usage
const response: ApiResponse<ProductIdea[]> = await fetch(...);
```

### Async/Await Error Handling
```typescript
try {
  const data = await fetchData();
  // Success
} catch (error) {
  console.error('Error:', error);
  // Handle error
}
```

---

## 🐞 Common Errors & Fixes

### "Cannot find module"
```bash
npm install
```

### "Port 3000 already in use"
```bash
lsof -ti:3000 | xargs kill -9
# or
npm run dev -- -p 3001
```

### "Supabase error: JWT expired"
```bash
# Regenerate anon key in Supabase Dashboard
# Update .env.local
```

### "OpenAI rate limit exceeded"
```bash
# Wait a few minutes
# Or upgrade your OpenAI plan
```

### "Build failed"
```bash
# Check for TypeScript errors
npm run lint

# Clear cache and rebuild
rm -rf .next
npm run build
```

---

## 📚 Useful Resources

### Official Docs
- Next.js: https://nextjs.org/docs
- React: https://react.dev
- TypeScript: https://www.typescriptlang.org/docs
- Tailwind: https://tailwindcss.com/docs
- Supabase: https://supabase.com/docs
- OpenAI: https://platform.openai.com/docs

### Community
- Next.js Discord: https://nextjs.org/discord
- Supabase Discord: https://discord.supabase.com
- Stack Overflow: https://stackoverflow.com

### Learning
- Next.js Learn: https://nextjs.org/learn
- Supabase Tutorials: https://supabase.com/docs/guides
- OpenAI Cookbook: https://github.com/openai/openai-cookbook

---

## 🎯 Performance Tips

### Optimization
```typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  // Component code
});

// Use useCallback for functions
const handleClick = useCallback(() => {
  // Handler code
}, [dependencies]);

// Use useMemo for expensive calculations
const result = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);
```

### Database
- Add indexes for frequently queried columns
- Use pagination for large datasets
- Cache frequent queries

### API
- Add rate limiting
- Implement request caching
- Use server-side rendering when appropriate

---

## 🔒 Security Best Practices

### Environment Variables
- Never commit `.env.local`
- Use different keys for dev/prod
- Rotate keys regularly

### API Keys
- Keep OpenAI key server-side only
- Don't expose in client code
- Monitor usage regularly

### Database
- Enable Row Level Security
- Use appropriate policies
- Sanitize user inputs

---

**Keep this cheat sheet handy for quick reference! 🚀**
