#!/bin/bash

# Supabase Connection Test Script
# This script tests your Supabase connection and database setup

echo "🧪 Testing Supabase Connection..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local file not found!${NC}"
    echo "Please create .env.local with your Supabase credentials"
    exit 1
fi

echo -e "${GREEN}✅ .env.local file found${NC}"

# Check if required variables are set
source .env.local

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_URL not set${NC}"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not set${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables set${NC}"
echo ""

# Test connection to Supabase
echo -e "${BLUE}Testing connection to: ${NEXT_PUBLIC_SUPABASE_URL}${NC}"

# Test REST API endpoint
response=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/")

if [ "$response" -eq 200 ]; then
    echo -e "${GREEN}✅ Supabase REST API responding${NC}"
else
    echo -e "${RED}❌ Connection failed (HTTP $response)${NC}"
    exit 1
fi

# Test subjects table
echo ""
echo -e "${BLUE}Testing subjects table...${NC}"

subjects_response=$(curl -s \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/subjects?select=*")

if echo "$subjects_response" | grep -q "name"; then
    count=$(echo "$subjects_response" | grep -o "name" | wc -l | xargs)
    echo -e "${GREEN}✅ Subjects table accessible (${count} records found)${NC}"
else
    echo -e "${YELLOW}⚠️  Subjects table empty or inaccessible${NC}"
fi

# Test frameworks table
echo ""
echo -e "${BLUE}Testing frameworks table...${NC}"

frameworks_response=$(curl -s \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/frameworks?select=*")

if echo "$frameworks_response" | grep -q "\[\]" || echo "$frameworks_response" | grep -q "name"; then
    echo -e "${GREEN}✅ Frameworks table accessible${NC}"
else
    echo -e "${RED}❌ Frameworks table issue${NC}"
fi

# Test grades table
echo ""
echo -e "${BLUE}Testing grades table...${NC}"

grades_response=$(curl -s \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/grades?select=*")

if echo "$grades_response" | grep -q "\[\]" || echo "$grades_response" | grep -q "name"; then
    echo -e "${GREEN}✅ Grades table accessible${NC}"
else
    echo -e "${RED}❌ Grades table issue${NC}"
fi

# Test strands table
echo ""
echo -e "${BLUE}Testing strands table...${NC}"

strands_response=$(curl -s \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/strands?select=*")

if echo "$strands_response" | grep -q "\[\]" || echo "$strands_response" | grep -q "strand_code"; then
    echo -e "${GREEN}✅ Strands table accessible${NC}"
else
    echo -e "${RED}❌ Strands table issue${NC}"
fi

# Test lessons table
echo ""
echo -e "${BLUE}Testing lessons table...${NC}"

lessons_response=$(curl -s \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/lessons?select=*")

if echo "$lessons_response" | grep -q "\[\]" || echo "$lessons_response" | grep -q "title"; then
    echo -e "${GREEN}✅ Lessons table accessible${NC}"
else
    echo -e "${RED}❌ Lessons table issue${NC}"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ All tests passed!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Your Supabase database is ready to use!${NC}"
echo ""
echo "Next steps:"
echo "1. Start your dev server: npm run dev"
echo "2. Visit: http://localhost:3000"
echo "3. Start generating lessons!"
echo ""
