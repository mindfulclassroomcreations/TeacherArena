import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Server-only admin client using service role
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE || ''
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || ''

// Lazily create the admin client only when env is present to avoid import-time crashes in production
function getSupabaseAdmin(): SupabaseClient | null {
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey)
}

async function bearerAdminAuthorized(req: NextApiRequest): Promise<boolean> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) return false
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : ''
    if (!token) return false
    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !data?.user?.id) return false
    const userId = data.user.id
    const { data: prof, error: selErr } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single()
    if (selErr) return false
    return String(prof?.role || '').toLowerCase() === 'admin'
  } catch {
    return false
  }
}

function isAuthorized(req: NextApiRequest) {
  const key = req.headers['x-admin-key']
  return typeof key === 'string' && key.length > 0 && ADMIN_API_KEY && key === ADMIN_API_KEY
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!serviceKey || !url) {
    console.error('admin/users: missing SUPABASE_SERVICE_ROLE or NEXT_PUBLIC_SUPABASE_URL', { serviceKeyPresent: Boolean(serviceKey), urlPresent: Boolean(url) })
    return res.status(500).json({ error: 'Server not configured for admin actions' } as any)
  }
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    // Double check to satisfy TS and runtime safety
    console.error('admin/users: failed to initialize Supabase admin client')
    return res.status(500).json({ error: 'Server not configured for admin actions' } as any)
  }
  const headerAuthorized = isAuthorized(req)
  const bearerAuthorized = await bearerAdminAuthorized(req)
  if (!headerAuthorized && !bearerAuthorized) {
    console.warn('admin/users: unauthorized request - provide valid x-admin-key or admin bearer token')
    return res.status(403).json({ error: 'Unauthorized (admin key or admin account required)' } as any)
  }

  try {
    if (req.method === 'GET') {
      // Get all users from auth with their email
      const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
      if (usersError) throw usersError
      
      // Get user profiles with role and tokens
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('user_profiles')
        .select('id,role,tokens,created_at,updated_at')
      if (profilesError) throw profilesError
      
      // Merge the data: combine auth users with their profiles
      const mergedUsers = users.map(authUser => {
        const profile = profiles?.find(p => p.id === authUser.id)
        return {
          id: authUser.id,
          email: authUser.email,
          role: profile?.role || 'user',
          tokens: profile?.tokens || 0,
          created_at: profile?.created_at || authUser.created_at,
          updated_at: profile?.updated_at || authUser.updated_at,
        }
      }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      return res.status(200).json({ items: mergedUsers })
    }

    if (req.method === 'POST') {
      const { id, role, addTokens, setTokens } = req.body || {}
      if (!id) return res.status(400).json({ error: 'Missing id' } as any)
      const updates: any = {}
      if (role) updates.role = role
      if (typeof setTokens === 'number') updates.tokens = setTokens
      let error
      if (Object.keys(updates).length > 0) {
        const resp = await supabaseAdmin.from('user_profiles').update(updates).eq('id', id)
        error = resp.error
      }
      if (!error && typeof addTokens === 'number' && addTokens !== 0) {
        // increment tokens atomically
        const { data: row, error: selErr } = await supabaseAdmin.from('user_profiles').select('tokens').eq('id', id).single()
        if (selErr) throw selErr
        const newTokens = Math.max(0, (row?.tokens || 0) + addTokens)
        const { error: upErr } = await supabaseAdmin.from('user_profiles').update({ tokens: newTokens }).eq('id', id)
        if (upErr) throw upErr
      }
      return res.status(200).json({ success: true })
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {}
      if (!id) return res.status(400).json({ error: 'Missing id' } as any)
      // remove profile row; optionally remove auth user via GoTrue admin (requires separate key)
      const { error } = await supabaseAdmin.from('user_profiles').delete().eq('id', id)
      if (error) throw error
      return res.status(200).json({ success: true })
    }

    res.setHeader('Allow', 'GET,POST,DELETE')
    return res.status(405).json({ error: 'Method not allowed' } as any)
  } catch (e: any) {
    console.error('admin/users: unexpected error', e)
    return res.status(500).json({ error: String(e?.message || e) } as any)
  }
}
