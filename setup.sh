#!/bin/bash

# TPT Product Idea Automation - Quick Start Script
# This script helps you get started with the project

echo "🚀 TPT Product Idea Automation - Setup"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed!"
    echo ""
    echo "Please install Node.js first:"
    echo "1. Using Homebrew: brew install node"
    echo "2. Or download from: https://nodejs.org/"
    echo ""
    exit 1
fi

echo "✅ Node.js $(node --version) detected"
echo "✅ npm $(npm --version) detected"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found!"
    echo "Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env.local and add your credentials:"
    echo "   - Supabase URL and API Key"
    echo "   - OpenAI API Key"
    echo ""
    echo "Press Enter after you've updated .env.local..."
    read
fi

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
else
    echo "✅ Dependencies already installed"
    echo ""
fi

# Check if Supabase is configured
echo "🔍 Checking configuration..."
if grep -q "your_supabase_project_url" .env.local; then
    echo ""
    echo "⚠️  WARNING: Supabase not configured in .env.local"
    echo "Please update the following in .env.local:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo ""
fi

if grep -q "your_openai_api_key" .env.local; then
    echo "⚠️  WARNING: OpenAI not configured in .env.local"
    echo "Please update the following in .env.local:"
    echo "   - OPENAI_API_KEY"
    echo ""
fi

echo "======================================"
echo ""
echo "✨ Setup complete! Next steps:"
echo ""
echo "1. Make sure you've configured .env.local"
echo "2. Create the Supabase table using supabase-schema.sql"
echo "3. Run: npm run dev"
echo "4. Open: http://localhost:3000"
echo ""
echo "See INSTALLATION-GUIDE.md for detailed instructions."
echo ""
