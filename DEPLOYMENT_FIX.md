# 🔧 API 405 Error Fix - Deployment Troubleshooting

## Problem
Getting `405 (Method Not Allowed)` error on deployed API routes at https://www.teacherarena.asia/api/generate-with-ai

## ✅ Solutions Applied

### 1. Added CORS Headers to All API Routes
All API endpoints now include proper CORS headers:
- `/api/generate-with-ai.ts`
- `/api/subjects.ts`
- `/api/frameworks.ts`
- `/api/grades.ts`
- `/api/strands.ts`
- `/api/lessons.ts`

### 2. Added Middleware
Created `src/middleware.ts` to handle CORS at the edge level.

### 3. Updated Next.js Config
Added CORS headers in `next.config.js` for all API routes.

### 4. Updated Vercel Config
Enhanced `vercel.json` with proper routing and headers.

---

## 🚀 Deployment Steps

### Step 1: Commit Changes
```bash
git add .
git commit -m "Fix API 405 error: Add CORS headers and middleware"
git push
```

### Step 2: Redeploy to Vercel

#### Option A: Automatic (Recommended)
- Push to GitHub triggers automatic deployment
- Wait 2-3 minutes for build to complete

#### Option B: Manual via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Deployments"
4. Click "Redeploy" on latest deployment

#### Option C: Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

### Step 3: Verify Environment Variables
Make sure these are set in Vercel:
1. Go to Project Settings → Environment Variables
2. Verify these exist:
   - ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`
   - ✅ `OPENAI_API_KEY`

### Step 4: Test API Endpoints
After deployment, test:

```bash
# Test generate-with-ai endpoint
curl -X POST https://www.teacherarena.asia/api/generate-with-ai \
  -H "Content-Type: application/json" \
  -d '{
    "type": "subjects",
    "context": "Elementary education"
  }'

# Should return JSON with success: true
```

---

## 🔍 Debugging Steps

### Check Vercel Logs
1. Go to Vercel Dashboard
2. Select your project
3. Click "Deployments" → Latest deployment
4. Click "View Function Logs"
5. Look for errors

### Check Browser Console
1. Open your site: https://www.teacherarena.asia
2. Press F12 (Developer Tools)
3. Go to "Network" tab
4. Try to generate content
5. Click on failed request
6. Check "Response" tab for error details

### Common Issues & Fixes

#### Issue 1: 405 Method Not Allowed
**Cause**: API route not recognizing POST method
**Fix**: ✅ Applied - Added CORS middleware

#### Issue 2: Environment Variables Not Set
**Cause**: Missing API keys in Vercel
**Fix**: 
```bash
# Add via Vercel CLI
vercel env add OPENAI_API_KEY
# Or add in Vercel Dashboard
```

#### Issue 3: CORS Errors
**Cause**: Browser blocking cross-origin requests
**Fix**: ✅ Applied - Added CORS headers to all routes

#### Issue 4: API Route Not Found (404)
**Cause**: Build didn't include API routes
**Fix**: Redeploy with `vercel --prod`

#### Issue 5: Timeout Errors
**Cause**: OpenAI API taking too long
**Fix**: Already set to 60s timeout in Vercel

---

## 📋 Verification Checklist

After redeployment, verify:

- [ ] API endpoint accessible: `https://www.teacherarena.asia/api/generate-with-ai`
- [ ] POST requests work from frontend
- [ ] No CORS errors in browser console
- [ ] Environment variables set in Vercel
- [ ] Function logs show no errors
- [ ] Generate subjects works
- [ ] Generate frameworks works
- [ ] Generate grades works
- [ ] Lesson discovery works
- [ ] Lesson generation works

---

## 🛠️ Alternative Solutions

### If Issue Persists

#### 1. Check Vercel Function Configuration
Ensure your functions have proper configuration:

```javascript
// In each API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    externalResolver: true,
  },
}
```

#### 2. Use API Route Rewrites
Update `next.config.js`:

```javascript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: '/api/:path*',
    },
  ]
}
```

#### 3. Check Build Output
Look at build logs for:
- ✅ API routes being compiled
- ✅ No TypeScript errors
- ✅ Dependencies installed

#### 4. Test Locally in Production Mode
```bash
npm run build
npm start
# Test on http://localhost:3000
```

---

## 📱 Contact Vercel Support

If issue still persists:

1. Go to: https://vercel.com/support
2. Provide:
   - Deployment URL
   - Error message
   - Function logs
   - Steps to reproduce

---

## ✨ Expected Behavior After Fix

### Before Fix
```
POST /api/generate-with-ai → 405 Method Not Allowed
```

### After Fix
```
POST /api/generate-with-ai → 200 OK
{
  "success": true,
  "items": [...],
  "count": 5
}
```

---

## 🔄 Quick Redeploy Command

```bash
# Pull latest changes
git pull

# Install dependencies (if needed)
npm install

# Build locally to test
npm run build

# If build succeeds, deploy
git add .
git commit -m "Fix API 405 errors"
git push origin main

# Vercel will auto-deploy
# Or manually: vercel --prod
```

---

## 📚 Additional Resources

- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Vercel Deployment](https://vercel.com/docs/concepts/deployments/overview)
- [CORS in Next.js](https://nextjs.org/docs/api-routes/api-middlewares)
- [Vercel Function Configuration](https://vercel.com/docs/concepts/functions/serverless-functions)

---

## ✅ Summary

**Changes Made**:
1. ✅ Added CORS headers to all 6 API routes
2. ✅ Created middleware for edge-level CORS handling
3. ✅ Updated Next.js config with CORS headers
4. ✅ Enhanced Vercel config with routing
5. ✅ Added OPTIONS method handling

**Next Steps**:
1. Commit and push changes
2. Wait for automatic Vercel deployment
3. Test API endpoints
4. Verify in browser console

**Expected Result**: All API calls work without 405 errors! 🎉
