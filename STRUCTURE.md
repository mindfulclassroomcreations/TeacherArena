# 🌳 Project Structure

Complete file tree of the TPT Product Idea Automation project.

```
05_Super Base/
│
├── 📄 Configuration Files
│   ├── .env.example                 # Environment variables template
│   ├── .eslintrc.json              # ESLint configuration
│   ├── .gitignore                  # Git ignore rules
│   ├── next.config.js              # Next.js configuration
│   ├── package.json                # Dependencies & scripts
│   ├── postcss.config.mjs          # PostCSS configuration
│   ├── tailwind.config.ts          # Tailwind CSS configuration
│   ├── tsconfig.json               # TypeScript configuration
│   └── vercel.json                 # Vercel deployment config
│
├── 📚 Documentation
│   ├── ARCHITECTURE.md             # System architecture & design
│   ├── CHEAT-SHEET.md             # Quick command reference
│   ├── CHECKLIST.md               # Setup progress tracker
│   ├── DOCS-INDEX.md              # Documentation navigation
│   ├── INSTALLATION-GUIDE.md      # Detailed setup guide
│   ├── PROJECT-SUMMARY.md         # Project overview
│   ├── QUICKSTART.md              # Fast 15-min setup
│   ├── README.md                  # Main documentation
│   ├── SETUP.md                   # Quick start guide
│   ├── STRUCTURE.md               # This file
│   └── VISUAL-GUIDE.md            # UI/UX overview
│
├── 🗄️ Database
│   └── supabase-schema.sql         # Database table schema
│
├── 🔧 Scripts
│   └── setup.sh                    # Automated setup script
│
├── 📱 Application Code
│   ├── app/
│   │   ├── api/
│   │   │   ├── ideas/
│   │   │   │   └── route.ts       # CRUD API for product ideas
│   │   │   └── research/
│   │   │       └── route.ts       # AI research API endpoint
│   │   ├── globals.css            # Global styles with Tailwind
│   │   ├── layout.tsx             # Root layout component
│   │   └── page.tsx               # Main dashboard page
│   └── lib/
│       └── supabase.ts            # Supabase client & types
│
└── 📦 Generated (not in repo)
    ├── .next/                      # Next.js build output
    ├── node_modules/               # NPM dependencies
    └── .env.local                  # Your local environment vars

```

---

## 📁 Directory Breakdown

### Root Level Files

#### Configuration
| File | Purpose | Edit? |
|------|---------|-------|
| `.env.example` | Environment variables template | Copy to `.env.local` |
| `.eslintrc.json` | Linting rules | Rarely |
| `.gitignore` | Files to ignore in Git | Rarely |
| `next.config.js` | Next.js settings | If needed |
| `package.json` | Dependencies list | When adding packages |
| `postcss.config.mjs` | PostCSS settings | Rarely |
| `tailwind.config.ts` | Tailwind customization | For theme changes |
| `tsconfig.json` | TypeScript settings | Rarely |
| `vercel.json` | Deployment config | For custom builds |

#### Documentation
| File | Purpose | Audience |
|------|---------|----------|
| `ARCHITECTURE.md` | System design | Developers |
| `CHEAT-SHEET.md` | Quick commands | All users |
| `CHECKLIST.md` | Setup tracker | New users |
| `DOCS-INDEX.md` | Documentation nav | All users |
| `INSTALLATION-GUIDE.md` | Setup guide | New users |
| `PROJECT-SUMMARY.md` | Overview | All users |
| `QUICKSTART.md` | Fast setup | New users |
| `README.md` | Full docs | All users |
| `SETUP.md` | Quick start | Experienced users |
| `STRUCTURE.md` | This file | All users |
| `VISUAL-GUIDE.md` | UI guide | Designers/Devs |

---

### Application Structure

#### `/app` Directory
```
app/
├── api/                    # API Routes (Backend)
│   ├── ideas/
│   │   └── route.ts       # GET, POST, PUT, DELETE product ideas
│   └── research/
│       └── route.ts       # POST to generate ideas with AI
├── globals.css            # Global styles
├── layout.tsx             # Root HTML structure
└── page.tsx              # Main dashboard UI
```

**Key Points:**
- `api/` contains serverless backend functions
- Each `route.ts` handles HTTP methods (GET, POST, etc.)
- `page.tsx` is the main frontend component
- `layout.tsx` wraps all pages

#### `/lib` Directory
```
lib/
└── supabase.ts           # Database client & TypeScript types
```

**Key Points:**
- Shared utility functions
- Database connection setup
- TypeScript interfaces
- Reusable across app

---

## 🔍 File Purposes

### API Routes

#### `app/api/research/route.ts`
**Purpose**: Generate product ideas using OpenAI
```
Functionality:
- Accepts topic & grade range
- Calls OpenAI GPT-4
- Formats AI response
- Saves ideas to database
- Returns results to frontend

Endpoint: POST /api/research
```

#### `app/api/ideas/route.ts`
**Purpose**: CRUD operations for product ideas
```
Functionality:
- GET: Fetch all ideas
- POST: Create new idea
- PUT: Update existing idea
- DELETE: Remove idea

Endpoints:
- GET /api/ideas
- POST /api/ideas
- PUT /api/ideas
- DELETE /api/ideas?id=xxx
```

---

### Frontend Components

#### `app/page.tsx`
**Purpose**: Main dashboard UI
```
Components:
- Research form (topic + grade input)
- Generate button
- Ideas library list
- Delete buttons
- Loading states
- Error handling

State Management:
- ideas (array of product ideas)
- loading (boolean)
- researching (boolean)
- topic (string)
- gradeRange (string)
- message (string)
```

#### `app/layout.tsx`
**Purpose**: Root HTML structure
```
Features:
- HTML document setup
- Metadata (title, description)
- Global CSS import
- Wraps all pages
```

#### `app/globals.css`
**Purpose**: Global styles
```
Contains:
- Tailwind directives
- CSS variables
- Dark mode settings
- Custom utilities
```

---

### Library Files

#### `lib/supabase.ts`
**Purpose**: Database client
```
Exports:
- supabase (client instance)
- ProductIdea (TypeScript interface)

Interface Fields:
- id (UUID)
- product_title (string)
- grade_level (string)
- standards (string)
- notes (string)
- category (string)
- created_at (timestamp)
```

---

## 📊 File Statistics

### Code Files
- **Total TypeScript files**: 5
- **Total CSS files**: 1
- **Total Config files**: 9
- **Total Documentation files**: 11
- **Total SQL files**: 1
- **Total Shell scripts**: 1

### Lines of Code (Approximate)
- TypeScript: ~800 lines
- CSS: ~30 lines
- SQL: ~45 lines
- Documentation: ~5000 lines
- Config: ~100 lines

---

## 🎯 File Importance

### Critical (Don't delete!)
- ✅ `package.json` - Dependencies
- ✅ `tsconfig.json` - TypeScript setup
- ✅ `next.config.js` - Next.js config
- ✅ `app/page.tsx` - Main UI
- ✅ `app/api/*/route.ts` - Backend logic
- ✅ `lib/supabase.ts` - Database
- ✅ `.env.local` - Your credentials

### Important (Edit carefully)
- ⚠️ `tailwind.config.ts` - Styling
- ⚠️ `app/layout.tsx` - Root layout
- ⚠️ `app/globals.css` - Styles

### Optional (Safe to modify/delete)
- ℹ️ Documentation files - For reference
- ℹ️ `setup.sh` - Helper script
- ℹ️ `.eslintrc.json` - Code style

---

## 🚀 What to Edit for Customization

### Change UI Colors/Design
→ Edit: `app/page.tsx`, `tailwind.config.ts`

### Modify AI Prompt
→ Edit: `app/api/research/route.ts`

### Add Database Fields
→ Edit: `supabase-schema.sql`, `lib/supabase.ts`, `app/page.tsx`

### Change Grade Ranges
→ Edit: `app/page.tsx` (select options)

### Add New API Endpoint
→ Create: `app/api/newroute/route.ts`

### Change Metadata
→ Edit: `app/layout.tsx`

---

## 📦 Dependencies Overview

### Production Dependencies
```json
{
  "@supabase/supabase-js": "Database client",
  "openai": "AI integration",
  "next": "React framework",
  "react": "UI library",
  "react-dom": "React DOM renderer"
}
```

### Development Dependencies
```json
{
  "typescript": "Type checking",
  "tailwindcss": "CSS framework",
  "@types/*": "TypeScript types",
  "eslint": "Code linting",
  "autoprefixer": "CSS prefixing",
  "postcss": "CSS processing"
}
```

---

## 🔄 Build Process

### Development
```
npm run dev
  ↓
Next.js Dev Server
  ↓
Hot Module Replacement
  ↓
View at localhost:3000
```

### Production
```
npm run build
  ↓
TypeScript Compilation
  ↓
Tailwind CSS Processing
  ↓
Next.js Optimization
  ↓
Static/Server Files
  ↓
Deploy to Vercel
```

---

## 🌐 Deployment Structure

### Vercel Deployment
```
GitHub Repo
  ↓ (push)
Vercel Build
  ↓ (build)
Edge Network
  ↓ (serve)
Users Worldwide
```

---

## 📁 Not in Repository

These files are generated or contain secrets:

```
.env.local              # Your environment variables (SECRET!)
node_modules/           # NPM packages (5000+ files)
.next/                 # Build output (regenerated)
.vercel/               # Vercel deployment info
```

**These are in `.gitignore` for good reason!**

---

## 🎓 Understanding the Flow

### User Request Flow
```
User opens app
  ↓
app/page.tsx renders
  ↓
User enters topic
  ↓
Clicks Generate
  ↓
POST /api/research
  ↓
OpenAI generates ideas
  ↓
Saves to Supabase
  ↓
Returns to frontend
  ↓
app/page.tsx updates
  ↓
User sees ideas
```

---

**This structure supports a scalable, maintainable application! 🎉**
