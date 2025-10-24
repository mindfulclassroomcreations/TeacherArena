# AI Lesson Generator

An AI-powered curriculum lesson generator built with Next.js, Supabase, and OpenAI.

## Overview

This application helps educators create standards-aligned lessons using AI. It supports:
- Subject selection and generation
- Curriculum framework selection
- Grade-level targeting
- Strand/domain analysis
- Per-strand lesson generation

## Tech Stack

### Frontend
- **Next.js 14** - React framework for production
- **React 18** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - State management

### Backend
- **Next.js API Routes** - Serverless backend
- **Supabase** - PostgreSQL database with authentication
- **OpenAI API** - AI-powered content generation

### Deployment
- **Vercel** - Frontend hosting and deployment
- **Supabase** - Database and backend services

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- GitHub account for version control
- Supabase account and project
- OpenAI API key

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd ai-lesson-generator
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. **Run the development server**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── components/       # Reusable React components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and API clients
├── pages/           # Next.js pages and API routes
│   ├── api/        # Backend API endpoints
│   └── *.tsx       # Frontend pages
├── store/           # Zustand store for state management
├── styles/          # Global styles and Tailwind CSS
└── types/           # TypeScript type definitions
public/              # Static assets
```

## Database Schema

### Tables
- **subjects** - Educational subjects (Math, Science, etc.)
- **frameworks** - Curriculum frameworks (Common Core, NGSS, etc.)
- **grades** - Grade levels within frameworks
- **strands** - Major content areas/domains
- **lessons** - Individual lesson content

## API Endpoints

### Generate Content
- `POST /api/generate-with-ai` - Generate subjects, frameworks, grades, or lessons using AI

Supported types:
- `subjects` - Generate subjects based on context
- `frameworks` - Generate frameworks for a subject
- `grades` - Generate grade levels
- `lesson-discovery` - Analyze framework and identify strands
- `lesson-generation-by-strand` - Generate lessons for a specific strand
- `lessons` - Generate all lessons for a framework/grade

## Deployment to Vercel

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Vercel**
- Go to [vercel.com](https://vercel.com)
- Click "New Project"
- Import your GitHub repository
- Select the project root directory
- Configure environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `OPENAI_API_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Click "Deploy"

3. **Configure Domain**
- Add your custom domain in Vercel project settings

## Setting Up Supabase

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Create tables** using the SQL editor:

```sql
-- Subjects table
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Frameworks table
CREATE TABLE frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grades table
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES frameworks(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Strands table
CREATE TABLE strands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id UUID NOT NULL REFERENCES grades(id),
  strand_code TEXT NOT NULL,
  strand_name TEXT NOT NULL,
  num_standards INTEGER,
  key_topics TEXT[] DEFAULT '{}',
  target_lesson_count INTEGER,
  performance_expectations TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lessons table
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strand_id UUID NOT NULL REFERENCES strands(id),
  title TEXT NOT NULL,
  description TEXT,
  performance_expectation TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

3. **Enable RLS (Row Level Security)** for all tables

4. **Get credentials** from project settings:
   - API URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`

## Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
npm start
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGc...` |

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add some amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions, please create an issue on GitHub.
