import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  school: string | null
  grade_level: string | null
  subjects_taught: string[] | null
  role: string | null
  tokens: number | null
  created_at?: string
  updated_at?: string
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE || ''

function getSupabaseAdmin(): SupabaseClient | null {
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey)
}

async function getUserId(req: NextApiRequest): Promise<{ userId?: string; error?: string }> {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : ''
  if (!token) return { error: 'Missing bearer token' }
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return { error: 'Server not configured' }
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data?.user?.id) return { error: 'Invalid session' }
  return { userId: data.user.id }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Allow', 'GET,PUT,OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (!url || !serviceKey) {
    console.error('profile/me: missing SUPABASE config', { urlPresent: Boolean(url), serviceKeyPresent: Boolean(serviceKey) })
    return res.status(500).json({ error: 'Server not configured' })
  }

  const { userId, error: authError } = await getUserId(req)
  if (authError || !userId) return res.status(401).json({ error: authError || 'Unauthorized' })

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return res.status(500).json({ error: 'Server not configured' })

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('id,email,full_name,avatar_url,school,grade_level,subjects_taught,role,tokens,created_at,updated_at')
      .eq('id', userId)
      .maybeSingle()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ profile: data as ProfileRow | null })
  }

  if (req.method === 'PUT') {
    const { full_name, avatar_url, school, grade_level, subjects_taught } = req.body || {}
    const updates: Partial<ProfileRow> = {}
    if (typeof full_name === 'string') updates.full_name = full_name
    if (typeof avatar_url === 'string') updates.avatar_url = avatar_url
    if (typeof school === 'string') updates.school = school
    if (typeof grade_level === 'string') updates.grade_level = grade_level
    if (Array.isArray(subjects_taught)) updates.subjects_taught = subjects_taught

    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No valid fields to update' })

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select('id,email,full_name,avatar_url,school,grade_level,subjects_taught,role,tokens,created_at,updated_at')
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ profile: data as ProfileRow })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
