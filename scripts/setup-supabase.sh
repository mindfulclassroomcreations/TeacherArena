#!/bin/bash

# Interactive Supabase Setup Script
# This script helps you configure Supabase for your AI Lesson Generator

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

clear

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                              ║${NC}"
echo -e "${CYAN}║         ${BOLD}AI LESSON GENERATOR - SUPABASE SETUP${NC}${CYAN}             ║${NC}"
echo -e "${CYAN}║                                                              ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local already exists${NC}"
    echo -e "${YELLOW}Do you want to update it? (y/n)${NC}"
    read -r update_env
    if [[ ! $update_env =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Skipping environment setup...${NC}"
        ENV_SETUP=false
    else
        ENV_SETUP=true
    fi
else
    ENV_SETUP=true
fi

if [ "$ENV_SETUP" = true ]; then
    echo ""
    echo -e "${BOLD}Step 1: Supabase Configuration${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Please visit: ${CYAN}https://supabase.com/dashboard${NC}"
    echo "Then go to: Project Settings > API"
    echo ""
    
    # Get Supabase URL
    echo -e "${YELLOW}Enter your Supabase Project URL:${NC}"
    echo -e "${BLUE}(Example: https://xxxxxxxxxxxxx.supabase.co)${NC}"
    read -r supabase_url
    
    # Get Supabase Anon Key
    echo ""
    echo -e "${YELLOW}Enter your Supabase Anon (public) Key:${NC}"
    echo -e "${BLUE}(Starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)${NC}"
    read -r supabase_anon_key
    
    # Get Supabase Service Role Key
    echo ""
    echo -e "${YELLOW}Enter your Supabase Service Role Key:${NC}"
    echo -e "${BLUE}(Starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)${NC}"
    read -r supabase_service_key
    
    # Get OpenAI API Key
    echo ""
    echo -e "${BOLD}Step 2: OpenAI Configuration${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Please visit: ${CYAN}https://platform.openai.com/api-keys${NC}"
    echo ""
    echo -e "${YELLOW}Enter your OpenAI API Key:${NC}"
    echo -e "${BLUE}(Starts with: sk-...)${NC}"
    read -r openai_key
    
    # Create .env.local
    echo ""
    echo -e "${BLUE}Creating .env.local file...${NC}"
    
    cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabase_url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabase_anon_key}
SUPABASE_SERVICE_ROLE_KEY=${supabase_service_key}

# OpenAI Configuration
OPENAI_API_KEY=${openai_key}
EOF
    
    echo -e "${GREEN}✅ .env.local file created successfully!${NC}"
fi

# Database Setup
echo ""
echo -e "${BOLD}Step 3: Database Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Now we need to create the database schema in Supabase."
echo ""
echo -e "${YELLOW}Have you already run the schema.sql file in Supabase? (y/n)${NC}"
read -r schema_done

if [[ ! $schema_done =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${CYAN}Please follow these steps:${NC}"
    echo ""
    echo "1. Open Supabase Dashboard: ${CYAN}https://supabase.com/dashboard${NC}"
    echo "2. Go to: ${BOLD}SQL Editor${NC}"
    echo "3. Click: ${BOLD}New Query${NC}"
    echo "4. Copy the contents of: ${BOLD}supabase/schema.sql${NC}"
    echo "5. Paste and click: ${BOLD}Run${NC}"
    echo ""
    echo -e "${YELLOW}Press Enter when you've completed these steps...${NC}"
    read -r
fi

# Test Connection
echo ""
echo -e "${BOLD}Step 4: Testing Connection${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -f scripts/test-supabase.sh ]; then
    echo -e "${BLUE}Running connection test...${NC}"
    echo ""
    bash scripts/test-supabase.sh
else
    echo -e "${YELLOW}⚠️  Test script not found, skipping tests${NC}"
fi

# Final Steps
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║                    ${BOLD}SETUP COMPLETE!${NC}${GREEN}                        ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}🎉 Your AI Lesson Generator is ready to use!${NC}"
echo ""
echo -e "${BOLD}Next Steps:${NC}"
echo ""
echo "1. Start the development server:"
echo -e "   ${CYAN}npm run dev${NC}"
echo ""
echo "2. Open in your browser:"
echo -e "   ${CYAN}http://localhost:3000${NC}"
echo ""
echo "3. Start generating lessons!"
echo ""
echo -e "${BOLD}Useful Commands:${NC}"
echo -e "   ${CYAN}npm run dev${NC}         - Start dev server"
echo -e "   ${CYAN}npm run build${NC}       - Build for production"
echo -e "   ${CYAN}npm run type-check${NC}  - Check TypeScript"
echo ""
echo -e "${BOLD}Documentation:${NC}"
echo "   📖 SUPABASE_SETUP_GUIDE.md  - Detailed setup guide"
echo "   📖 FRONTEND_GUIDE.md        - Frontend documentation"
echo "   📖 README.md                - Project overview"
echo ""
echo -e "${YELLOW}💡 Tip: Keep your .env.local file safe and never commit it to Git!${NC}"
echo ""
