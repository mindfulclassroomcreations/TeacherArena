# Fix for User Management Admin Page

## Issues Fixed:

1. **Missing Environment Variable**: Added `SUPABASE_SERVICE_ROLE` to `.env.local`
2. **Wrong Table Name**: Changed all queries from `profiles` to `user_profiles`
3. **Email Data**: Updated GET handler to fetch emails from `auth.users` and merge with profile data

## What You Need to Do:

### Step 1: Get Your Service Role Key
1. Go to your Supabase Dashboard
2. Navigate to **Settings > API**
3. Copy the **Service Role secret** key (keep this SECRET!)
4. Update `.env.local`:

```bash
SUPABASE_SERVICE_ROLE=YOUR_COPIED_SERVICE_ROLE_KEY_HERE
```

### Step 2: Test the Admin Page
1. Restart your development server: `npm run dev`
2. Go to `/admin/users` 
3. You should now see all users with their:
   - Email (from auth.users)
   - Role (from user_profiles)
   - Tokens (from user_profiles)
   - Created date

## Files Changed:

- `.env.local` - Added SUPABASE_SERVICE_ROLE variable
- `src/pages/api/admin/users.ts` - Fixed table references and added proper user data merging

## How It Works Now:

```
GET /api/admin/users
├── Fetch all auth users (get email)
├── Fetch all user_profiles (get role, tokens)
└── Merge data and return combined user list

POST /api/admin/users
└── Update user_profiles (role, tokens)

DELETE /api/admin/users
└── Delete from user_profiles
```

## Security Note:

⚠️ **Keep `SUPABASE_SERVICE_ROLE` secret!**
- Never commit it to git
- It has full access to your database
- Only used server-side (in API routes)
