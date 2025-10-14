# 🏗️ System Architecture

## Overview

This application automates the generation and management of Teachers Pay Teachers (TPT) product ideas using AI and modern cloud infrastructure.

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                      (Next.js React App)                        │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Product Idea Dashboard                                │   │
│  │  • Input form for topic & grade range                  │   │
│  │  • Generate ideas button                               │   │
│  │  • Display product ideas library                       │   │
│  │  • Delete & manage ideas                               │   │
│  └────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            │ HTTP Requests
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                           ▼                                     │
│                    NEXT.JS API ROUTES                           │
│                   (Backend Services)                            │
│                                                                 │
│  ┌────────────────────┐              ┌────────────────────┐   │
│  │  /api/research     │              │  /api/ideas        │   │
│  │                    │              │                    │   │
│  │  • POST request    │              │  • GET all ideas   │   │
│  │  • Sends prompt    │              │  • POST new idea   │   │
│  │    to OpenAI       │              │  • PUT update      │   │
│  │  • Formats         │              │  • DELETE idea     │   │
│  │    response        │              │                    │   │
│  │  • Saves to DB     │              │  Direct CRUD ops   │   │
│  └────────┬───────────┘              └──────────┬─────────┘   │
│           │                                     │              │
└───────────┼─────────────────────────────────────┼──────────────┘
            │                                     │
            │                                     │
            ▼                                     ▼
┌──────────────────────┐              ┌──────────────────────┐
│                      │              │                      │
│   OPENAI API         │              │   SUPABASE           │
│   (GPT-4 Turbo)      │              │   (PostgreSQL)       │
│                      │              │                      │
│  • Receives prompt   │              │  ┌────────────────┐ │
│  • Generates 5       │              │  │ product_ideas  │ │
│    product ideas     │              │  │                │ │
│  • Returns JSON      │              │  │ • id           │ │
│    format            │              │  │ • product_title│ │
│                      │              │  │ • grade_level  │ │
│                      │              │  │ • standards    │ │
│                      │              │  │ • notes        │ │
└──────────────────────┘              │  │ • category     │ │
                                      │  │ • created_at   │ │
                                      │  └────────────────┘ │
                                      └──────────────────────┘
```

---

## Data Flow

### 1. Generate Ideas Flow

```
User Input (Topic + Grade) 
    → Frontend Form
    → POST /api/research
    → OpenAI API Request
    → AI Generates 5 Ideas
    → Format as JSON
    → INSERT into Supabase
    → Return to Frontend
    → Display in Dashboard
```

### 2. View Ideas Flow

```
Page Load
    → GET /api/ideas
    → Query Supabase
    → Fetch all product_ideas
    → Sort by created_at DESC
    → Return to Frontend
    → Render Ideas List
```

### 3. Delete Idea Flow

```
User Clicks Delete
    → Confirmation Dialog
    → DELETE /api/ideas?id=xxx
    → Delete from Supabase
    → Return success
    → Refresh ideas list
```

---

## Tech Stack

### Frontend Layer
- **Next.js 14**: React framework with App Router
- **React 18**: UI component library
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first styling

### Backend Layer
- **Next.js API Routes**: Serverless functions
- **Node.js**: JavaScript runtime

### Database Layer
- **Supabase**: PostgreSQL database
- **Row Level Security**: Access control

### AI Layer
- **OpenAI GPT-4 Turbo**: Language model
- **Structured JSON Output**: Formatted responses

### Deployment
- **Vercel**: Hosting platform
- **GitHub**: Version control

---

## API Endpoints

### Research API
```
POST /api/research
Content-Type: application/json

Request Body:
{
  "topic": "Math fractions",
  "gradeRange": "6-8"
}

Response:
{
  "success": true,
  "ideas": [...],
  "count": 5
}
```

### Ideas API
```
GET /api/ideas
Response: { "ideas": [...] }

POST /api/ideas
Body: { product_title, grade_level, standards, notes, category }
Response: { "idea": {...} }

PUT /api/ideas
Body: { id, ...updates }
Response: { "idea": {...} }

DELETE /api/ideas?id=xxx
Response: { "success": true }
```

---

## Database Schema

```sql
TABLE product_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_title TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  standards TEXT NOT NULL,
  notes TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

INDEXES:
  - idx_product_ideas_created_at (created_at DESC)
  - idx_product_ideas_grade_level (grade_level)
  - idx_product_ideas_category (category)

RLS: Enabled with public access policy
```

---

## Security Considerations

### Environment Variables
- `NEXT_PUBLIC_*`: Exposed to browser (Supabase URLs)
- `OPENAI_API_KEY`: Server-side only (API routes)

### API Key Protection
- OpenAI key never sent to client
- All AI calls happen server-side
- Rate limiting via OpenAI

### Database Security
- Row Level Security (RLS) enabled
- Anon key has limited permissions
- Service key kept on server only

---

## Scalability

### Current Capacity
- **Database**: 500MB free (Supabase)
- **Requests**: Unlimited (Vercel free tier)
- **AI Calls**: Pay-as-you-go (OpenAI)

### Growth Path
1. **0-1000 ideas**: Free tier sufficient
2. **1000-10000 ideas**: Upgrade Supabase to Pro ($25/mo)
3. **10000+ ideas**: Add caching, pagination
4. **Multiple users**: Add authentication

---

## Performance Optimizations

### Current
- PostgreSQL indexes on frequently queried columns
- React state management for instant UI updates
- Vercel Edge Network for global CDN

### Future Enhancements
- Redis caching for frequent queries
- Pagination for large datasets
- Background job processing for bulk research
- WebSocket for real-time updates

---

## Development Workflow

```
1. Local Development
   ├── npm run dev (localhost:3000)
   ├── Hot reload enabled
   └── Local env variables

2. Git Commit
   ├── git add .
   ├── git commit -m "message"
   └── git push origin main

3. Automatic Deployment
   ├── Vercel detects push
   ├── Builds production bundle
   ├── Runs tests
   └── Deploys to production

4. Production
   ├── HTTPS enabled
   ├── Global CDN
   └── Environment variables from Vercel
```

---

## Monitoring & Debugging

### Logs
- **Vercel**: Function logs in dashboard
- **Supabase**: Query logs in dashboard
- **OpenAI**: Usage logs at platform.openai.com

### Error Tracking
- Console errors in browser DevTools
- API errors in Vercel function logs
- Database errors in Supabase logs

### Performance
- Vercel Analytics (speed insights)
- Supabase Dashboard (query performance)
- OpenAI Dashboard (token usage)

---

This architecture provides a solid foundation for your TPT product idea automation system! 🚀
