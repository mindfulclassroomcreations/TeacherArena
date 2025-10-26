import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { UserProfile, UserRole } from '@/types'

// Server-only admin client using service role to safely upsert profiles
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE || ''

function getSupabaseAdmin(): SupabaseClient | null {
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey)
}

const INITIAL_TOKENS: Record<UserRole, number> = {
  user: 10,
  manager: 1000,
  designer: 1000,
  admin: 1000, // default for admin; adjust if needed
}

async function getAuthUser(req: NextApiRequest) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : ''
  if (!token) return { error: 'Missing bearer token' }
  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) return { error: 'Server not configured for profiles' }
    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error) return { error: error.message }
    return { user: data.user }
  } catch (e: any) {
    return { error: String(e?.message || e) }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Allow', 'GET,POST,OPTIONS')
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (!url || !serviceKey) {
    console.error('profile/init: missing SUPABASE config', { urlPresent: Boolean(url), serviceKeyPresent: Boolean(serviceKey) })
    return res.status(500).json({ error: 'Server not configured for profiles' })
  }

  // Allow GET (fetch profile) and POST (create/init). Other methods are not allowed.
  if (!(req.method === 'GET' || req.method === 'POST')) {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { user, error: authError } = await getAuthUser(req)
  if (authError || !user) {
    return res.status(401).json({ error: authError || 'Unauthorized' })
  }

  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) return res.status(500).json({ error: 'Server not configured for profiles' })
    // Ensure a profile exists for this user; if not, create with initial tokens based on role
    const userId = user.id
    const email = user.email || null
    const metaRole = (user.user_metadata?.role || user.app_metadata?.role || 'user')
    const role = String(metaRole).toLowerCase() as UserRole
    const initialTokens = INITIAL_TOKENS[role] ?? INITIAL_TOKENS.user

    // Check existing profile
    const { data: existing, error: selErr } = await supabaseAdmin
      .from('user_profiles')
      .select('id,email,role,tokens,created_at,updated_at')
      .eq('id', userId)
      .maybeSingle()
    if (selErr) throw selErr

    let profile: UserProfile
    if (existing) {
      // Return existing profile
      profile = existing as unknown as UserProfile
    } else {
      // Insert new profile with initial tokens
      const { data, error: insErr } = await supabaseAdmin
        .from('user_profiles')
        .insert({ id: userId, email, role, tokens: initialTokens })
        .select('id,email,role,tokens,created_at,updated_at')
        .single()
      if (insErr) throw insErr
      profile = data as unknown as UserProfile
    }

    return res.status(200).json({ profile })
  } catch (e: any) {
    return res.status(500).json({ error: String(e?.message || e) })
  }
}
