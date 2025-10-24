#!/bin/bash
# Initial Setup Script for AI Lesson Generator
# Run this after cloning: bash scripts/setup.sh

set -e

echo "🚀 Setting up AI Lesson Generator..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js installation
echo -e "${BLUE}Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js is not installed. Please install Node.js 18+ from https://nodejs.org${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check Git installation
echo -e "${BLUE}Checking Git installation...${NC}"
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}Git is not installed. Please install Git from https://git-scm.com${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Git installed${NC}"

# Install dependencies
echo -e "${BLUE}Installing npm dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo -e "${BLUE}Creating .env.local template...${NC}"
    cp .env.local.example .env.local 2>/dev/null || cat > .env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Backend Configuration
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
EOF
    echo -e "${YELLOW}⚠️  .env.local created. Please update with your credentials.${NC}"
else
    echo -e "${GREEN}✓ .env.local already exists${NC}"
fi

# Initialize Git if needed
if [ ! -d .git ]; then
    echo -e "${BLUE}Initializing Git repository...${NC}"
    git init
    git add .
    git commit -m "Initial commit: AI Lesson Generator"
    echo -e "${GREEN}✓ Git repository initialized${NC}"
    echo -e "${YELLOW}⚠️  Remember to: git remote add origin https://github.com/YOUR_USERNAME/ai-lesson-generator.git${NC}"
else
    echo -e "${GREEN}✓ Git repository already initialized${NC}"
fi

# Type checking
echo -e "${BLUE}Running type check...${NC}"
npm run type-check || echo -e "${YELLOW}⚠️  Some type errors found. These may resolve after dependencies load.${NC}"

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Update .env.local with your credentials:"
echo "   - Supabase URL and keys (https://supabase.com)"
echo "   - OpenAI API key (https://platform.openai.com)"
echo ""
echo "2. Set up Supabase database:"
echo "   - Follow instructions in SUPABASE_SETUP.md"
echo ""
echo "3. Start development server:"
echo "   npm run dev"
echo ""
echo "4. Deploy to GitHub:"
echo "   git remote add origin <your-repo-url>"
echo "   git push -u origin main"
echo ""
echo "5. Deploy to Vercel:"
echo "   - See VERCEL_DEPLOYMENT.md for instructions"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "- README.md - Project overview"
echo "- SETUP_GUIDE.md - Detailed setup instructions"
echo "- SUPABASE_SETUP.md - Database configuration"
echo "- VERCEL_DEPLOYMENT.md - Deployment guide"
echo "- CONTRIBUTING.md - Contributing guidelines"
echo ""
