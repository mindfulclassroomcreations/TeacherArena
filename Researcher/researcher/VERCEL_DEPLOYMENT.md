# Vercel Deployment Guide

## Step-by-Step Setup

### 1. Prepare Your Repository

Ensure your project is properly set up in Git:

```bash
git add .
git commit -m "Initial commit: AI Lesson Generator setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-lesson-generator.git
git push -u origin main
```

### 2. Create a Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (recommended for easy integration)
3. Authorize Vercel to access your GitHub account

### 3. Import Project to Vercel

1. In Vercel Dashboard, click "New Project"
2. Select "Import Git Repository"
3. Find and select your `ai-lesson-generator` repository
4. Click "Import"

### 4. Configure Project Settings

1. **Framework**: Select "Next.js"
2. **Root Directory**: Leave as default (or enter `./` if needed)
3. **Build Settings**: Leave as default (Vercel auto-detects Next.js)

### 5. Add Environment Variables

In the Vercel project settings, go to "Settings" → "Environment Variables":

Add each variable:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Important**: Public variables must start with `NEXT_PUBLIC_`

### 6. Deploy

1. Click "Deploy"
2. Wait for the build to complete (usually 2-3 minutes)
3. Your site is now live! 🎉

### 7. Custom Domain (Optional)

1. Go to "Settings" → "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions provided

## Continuous Deployment

Any push to your main branch will automatically trigger a new deployment on Vercel.

### Branch Deployments

You can also set up preview deployments for pull requests:

1. Go to "Settings" → "Git"
2. Enable "Deploy on Push to any branch"
3. Every PR will get a preview URL

## Monitoring & Debugging

### View Logs
- Click "Deployments" to see build logs
- Check "Runtime Logs" for production errors

### Environment Variables in Production
- Variables are injected during build time
- Changes require redeployment
- Preview deployments inherit production variables by default

## Troubleshooting

### Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify environment variables are set

### Runtime Errors
- Check "Runtime Logs" in Vercel dashboard
- Ensure API endpoints are correctly configured
- Verify Supabase credentials are valid

### Cold Starts
- Serverless functions have cold start delays
- Optimize database queries
- Consider caching strategies

## Rollback

To rollback to a previous deployment:
1. Go to "Deployments"
2. Find the deployment you want to restore
3. Click the three dots menu
4. Select "Promote to Production"

## Performance Optimization

### Image Optimization
Next.js automatically optimizes images. Use `<Image>` component instead of `<img>`.

### Code Splitting
Next.js handles this automatically with dynamic imports.

### Database Queries
- Use connection pooling
- Cache frequently accessed data
- Use indexes in PostgreSQL

## API Rate Limiting

If using OpenAI API, be aware of rate limits:
- Set up proper error handling
- Implement retry logic
- Monitor API usage in OpenAI dashboard

## Security

- Never commit `.env.local` (use `.env.local.example` instead)
- Rotate API keys periodically
- Use service role key only on backend
- Enable CORS restrictions if needed

## Support

For Vercel-specific issues:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/next.js/discussions)
- [GitHub Issues](https://github.com/your-repo/issues)
