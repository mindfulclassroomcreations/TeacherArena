# Authentication System Guide

## Overview
This application includes a complete authentication system built with Supabase Auth. Users can sign up, log in, and access protected features.

## Features

### ✅ Authentication
- Email/password signup and login
- Password reset functionality
- Secure session management
- Automatic session refresh
- Sign out functionality

### ✅ User Interface
- Login page (`/login`)
- Signup page (`/signup`)
- User profile dropdown menu in navbar
- Conditional rendering (show login/signup buttons for guests)
- Protected routes with automatic redirects

### ✅ Security
- Row Level Security (RLS) policies
- User-specific data access
- Secure password handling by Supabase
- JWT token-based authentication

## Quick Start

### 1. Enable Email Auth in Supabase

Go to your Supabase dashboard:
1. Navigate to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates (optional)

### 2. Run Database Migration

Execute the auth migration to add user tracking:

```bash
# Copy the migration SQL
cat supabase/migration_auth.sql

# Paste into Supabase SQL Editor and run
```

This migration:
- Adds `user_id` columns to all tables
- Updates RLS policies for user-specific access
- Creates `user_profiles` table
- Sets up automatic profile creation on signup

### 3. Test the Auth Flow

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Sign up a new user:**
   - Navigate to http://localhost:3000/signup
   - Fill in email and password
   - Check your email for verification link (if enabled)

3. **Sign in:**
   - Navigate to http://localhost:3000/login
   - Enter credentials
   - Should redirect to home page

4. **Check user menu:**
   - Click on your email in the top-right corner
   - See dropdown with Dashboard, My Lessons, Settings
   - Click "Sign out" to log out

## File Structure

```
src/
├── contexts/
│   └── AuthContext.tsx          # Auth provider with useAuth hook
├── components/
│   ├── LoginForm.tsx            # Reusable login form
│   ├── SignupForm.tsx           # Reusable signup form
│   ├── ProtectedRoute.tsx       # HOC for protected pages
│   └── Layout.tsx               # Updated with user menu
├── pages/
│   ├── _app.tsx                 # Wrapped with AuthProvider
│   ├── login.tsx                # Login page
│   ├── signup.tsx               # Signup page
│   └── index.tsx                # Updated with Layout wrapper
└── lib/
    └── supabase.ts              # Supabase client

supabase/
└── migration_auth.sql           # Database migration for auth
```

## Usage Examples

### Using the Auth Hook

```tsx
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, signOut } = useAuth()

  return (
    <div>
      {user ? (
        <>
          <p>Welcome, {user.email}</p>
          <button onClick={signOut}>Sign Out</button>
        </>
      ) : (
        <p>Please sign in</p>
      )}
    </div>
  )
}
```

### Protecting a Page

```tsx
import ProtectedRoute from '@/components/ProtectedRoute'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>
        <h1>Dashboard</h1>
        <p>This content is only visible to authenticated users</p>
      </div>
    </ProtectedRoute>
  )
}
```

### Manual Auth Check

```tsx
import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) return <div>Loading...</div>
  if (!user) return null

  return <div>Profile content</div>
}
```

## API Functions

### AuthContext Functions

| Function | Parameters | Description |
|----------|-----------|-------------|
| `signUp` | `email, password, metadata?` | Create new user account |
| `signIn` | `email, password` | Sign in existing user |
| `signOut` | none | Sign out current user |
| `resetPassword` | `email` | Send password reset email |

### AuthContext State

| Property | Type | Description |
|----------|------|-------------|
| `user` | `User \| null` | Current authenticated user |
| `session` | `Session \| null` | Current session |
| `loading` | `boolean` | Auth state loading |

## Database Schema

### user_profiles Table

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  avatar_url TEXT,
  school TEXT,
  grade_level TEXT,
  subjects_taught TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### RLS Policies

All tables now have user-specific RLS policies:

- **SELECT**: Users can view all records
- **INSERT**: Users can only create records with their own user_id
- **UPDATE**: Users can only update their own records
- **DELETE**: Users can only delete their own records

## Customization

### Custom User Metadata

Add custom fields during signup:

```tsx
const { error } = await signUp(email, password, {
  full_name: 'John Doe',
  school: 'Example School',
  grade_level: 'High School'
})
```

### Email Templates

Customize Supabase email templates:
1. Go to Authentication → Email Templates
2. Edit templates for:
   - Confirmation email
   - Password reset
   - Email change
   - Magic link

### Redirect URLs

Set custom redirect URLs in `.env.local`:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Security Best Practices

✅ **DO:**
- Always use HTTPS in production
- Keep environment variables secure
- Use Row Level Security policies
- Validate user input
- Handle auth errors gracefully

❌ **DON'T:**
- Store passwords in plain text
- Expose service role key in client code
- Allow unauthenticated access to sensitive data
- Trust client-side auth checks alone

## Troubleshooting

### Users can't sign up
- Check email provider is enabled in Supabase
- Verify SMTP settings if using custom email
- Check browser console for errors

### RLS policies blocking access
- Verify user_id is set when creating records
- Check RLS policies in Supabase dashboard
- Test with service role key (backend only)

### Session not persisting
- Check localStorage is enabled
- Verify Supabase URL and keys are correct
- Clear browser cache and cookies

## Next Steps

1. **Create protected pages:**
   - Dashboard page
   - My Lessons page
   - Settings page

2. **Add social login:**
   - Google OAuth
   - GitHub OAuth
   - Microsoft OAuth

3. **Enhance user profiles:**
   - Avatar upload
   - Profile editing
   - Additional metadata

4. **Add email verification:**
   - Enable email confirmation in Supabase
   - Create confirmation callback page

5. **Implement role-based access:**
   - Add user roles (admin, teacher, student)
   - Create role-specific RLS policies
   - Build admin dashboard

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs/guides/auth
- Review Next.js docs: https://nextjs.org/docs
- Open an issue on GitHub

## License

This authentication system is part of the AI Lesson Generator project.
