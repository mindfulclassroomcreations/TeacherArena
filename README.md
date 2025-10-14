# TPT Product Idea Automation

Automate the process of generating and organizing digital product ideas for your Teachers Pay Teachers (TPT) store using AI and modern web technologies.

## 🎯 Features

- **AI-Powered Research**: Automatically generate product ideas using OpenAI's GPT-4
- **Smart Organization**: Store and manage product ideas in Supabase
- **Grade-Specific**: Focus on Grades 6-12 educational resources
- **Standards Alignment**: Track Common Core and subject-specific standards
- **Category Management**: Organize by product type (Google Forms, Worksheets, Task Cards, etc.)
- **Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account ([sign up here](https://supabase.com))
- An OpenAI API key ([get one here](https://platform.openai.com/api-keys))
- A GitHub account (for version control)
- A Vercel account (for deployment - optional)

### 1. Supabase Setup

1. Create a new project in Supabase
2. Go to the SQL Editor in your Supabase dashboard
3. Run the SQL script from `supabase-schema.sql` to create the database table
4. Go to Settings → API to get your:
   - Project URL
   - Anon/Public API Key

### 2. Installation

```bash
# Install dependencies
npm install
```

### 3. Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` and add your credentials:
```env
# SUPABASE CONFIGURATION
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OPENAI CONFIGURATION
OPENAI_API_KEY=sk-your_openai_api_key

# Optional: If you have a specific assistant ID
OPENAI_ASSISTANT_ID=asst_your_assistant_id_optional
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 How to Use

1. **Generate Ideas**: 
   - Enter a topic or subject area (e.g., "Math fractions", "Reading comprehension")
   - Select the grade range
   - Click "Generate Product Ideas"
   - The AI will research and generate 5 relevant product ideas

2. **View Ideas**:
   - All generated ideas appear in the Product Ideas Library
   - Each idea includes: title, grade level, standards, notes, and category

3. **Manage Ideas**:
   - Delete ideas you don't need
   - Refresh the list to see updates
   - All ideas are automatically saved to your Supabase database

## 🔧 Project Structure

```
├── app/
│   ├── api/
│   │   ├── ideas/route.ts       # CRUD operations for product ideas
│   │   └── research/route.ts    # OpenAI integration for generating ideas
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main dashboard
├── lib/
│   └── supabase.ts              # Supabase client configuration
├── .env.example                 # Environment variables template
├── supabase-schema.sql          # Database schema
└── package.json                 # Dependencies and scripts
```

## 🚢 Deployment to Vercel

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/tpt-automation.git
git push -u origin main
```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `OPENAI_API_KEY`
   - Click "Deploy"

## 🛠️ Technologies Used

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4
- **Deployment**: Vercel
- **Version Control**: Git/GitHub

## 📝 API Endpoints

### Research API
- **POST** `/api/research`
  - Generate new product ideas using AI
  - Body: `{ topic: string, gradeRange: string }`

### Ideas API
- **GET** `/api/ideas` - Fetch all product ideas
- **POST** `/api/ideas` - Create a new idea
- **PUT** `/api/ideas` - Update an existing idea
- **DELETE** `/api/ideas?id={id}` - Delete an idea

## 🎨 Customization

### Modify AI Prompts
Edit `/app/api/research/route.ts` to customize how the AI generates ideas.

### Change UI Theme
Edit `/app/globals.css` and Tailwind classes in components.

### Add New Fields
1. Update the Supabase schema
2. Update the TypeScript interface in `/lib/supabase.ts`
3. Update the UI components

## 🔒 Security Notes

- Never commit `.env.local` to version control
- Keep your API keys secure
- Configure Supabase Row Level Security (RLS) for production
- Consider adding authentication for multi-user scenarios

## 🐛 Troubleshooting

### "Failed to fetch ideas"
- Check your Supabase URL and API key
- Verify the table exists in your database
- Check browser console for detailed errors

### "Failed to generate ideas"
- Verify your OpenAI API key is valid
- Check you have sufficient API credits
- Review the OpenAI API usage limits

### TypeScript Errors
- Run `npm install` to ensure all dependencies are installed
- The errors shown during file creation will resolve after running npm install

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

**Happy Creating! 🎓**
