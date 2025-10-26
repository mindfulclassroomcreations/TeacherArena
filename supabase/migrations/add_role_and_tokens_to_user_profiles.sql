-- Add missing columns to user_profiles table
-- Migration to support user roles and token management for admin panel

-- Add role column if it doesn't exist
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Add tokens column if it doesn't exist
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS tokens INTEGER DEFAULT 0;

-- Create index on role for faster admin queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Update any existing profiles without a role to 'user'
UPDATE public.user_profiles
SET role = 'user'
WHERE role IS NULL;

-- Update any existing profiles without tokens to 0
UPDATE public.user_profiles
SET tokens = 0
WHERE tokens IS NULL;
