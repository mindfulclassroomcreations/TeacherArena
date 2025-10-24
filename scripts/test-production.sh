#!/bin/bash

# API Endpoint Test Script for Production
# Tests all API endpoints after deployment

echo "🧪 Testing Production API Endpoints..."
echo ""

SITE_URL="https://www.teacherarena.asia"
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test 1: Generate with AI endpoint
echo -e "${BLUE}Test 1: POST /api/generate-with-ai${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$SITE_URL/api/generate-with-ai" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "subjects",
    "context": "Elementary education"
  }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ API endpoint working (HTTP $http_code)${NC}"
    echo "Response preview: $(echo $body | cut -c1-100)..."
else
    echo -e "${RED}❌ Failed with HTTP $http_code${NC}"
    echo "Response: $body"
fi

echo ""

# Test 2: Subjects endpoint
echo -e "${BLUE}Test 2: GET /api/subjects${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET "$SITE_URL/api/subjects")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ Subjects endpoint working (HTTP $http_code)${NC}"
else
    echo -e "${RED}❌ Failed with HTTP $http_code${NC}"
    echo "Response: $body"
fi

echo ""

# Test 3: Check homepage
echo -e "${BLUE}Test 3: GET / (Homepage)${NC}"
response=$(curl -s -w "\n%{http_code}" "$SITE_URL/")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ Homepage accessible (HTTP $http_code)${NC}"
else
    echo -e "${RED}❌ Failed with HTTP $http_code${NC}"
fi

echo ""

# Test 4: OPTIONS preflight
echo -e "${BLUE}Test 4: OPTIONS /api/generate-with-ai (CORS Preflight)${NC}"
response=$(curl -s -w "\n%{http_code}" -X OPTIONS "$SITE_URL/api/generate-with-ai" \
  -H "Origin: https://www.teacherarena.asia" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type")

http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "200" ] || [ "$http_code" = "204" ]; then
    echo -e "${GREEN}✅ CORS preflight working (HTTP $http_code)${NC}"
else
    echo -e "${RED}❌ CORS preflight failed (HTTP $http_code)${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Summary:${NC}"
echo "Site URL: $SITE_URL"
echo ""
echo "If all tests pass, your deployment is ready! ✅"
echo "If tests fail, check:"
echo "  1. Vercel deployment status"
echo "  2. Environment variables in Vercel"
echo "  3. Function logs in Vercel dashboard"
echo "  4. Browser console for detailed errors"
echo ""
echo "Read DEPLOYMENT_FIX.md for detailed troubleshooting"
echo ""
