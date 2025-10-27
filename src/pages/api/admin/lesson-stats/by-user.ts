import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient, type SupabaseClient, type PostgrestError } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || ''

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
    // Determine profile table
    let { data: prof, error: selErr } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()
    const missing = (selErr as PostgrestError | null)?.code === '42P01' || /relation .* does not exist/i.test(String(selErr?.message || ''))
    if (selErr && !missing) return false
    if (!prof && missing) {
      const alt = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()
      if (alt.error) return false
      prof = alt.data as any
    }
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
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Server not configured for admin actions' })
  }
  const headerAuthorized = isAuthorized(req)
  const bearerAuthorized = await bearerAdminAuthorized(req)
  if (!headerAuthorized && !bearerAuthorized) {
    return res.status(403).json({ error: 'Unauthorized (admin key or admin account required)' })
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const today = new Date(); today.setUTCHours(0,0,0,0)
    const todayIso = today.toISOString()

    // Lifetime counts per user
    const { data: lifetimeRows, error: lifetimeErr } = await supabaseAdmin
      .from('lessons')
      .select('user_id')
      .not('user_id', 'is', null)
    if (lifetimeErr) throw lifetimeErr
    const lifetimeMap: Record<string, number> = {}
    for (const r of lifetimeRows || []) {
      const uid = r.user_id as string
      lifetimeMap[uid] = (lifetimeMap[uid] || 0) + 1
    }

    // Today counts per user
    const { data: todayRows, error: todayErr } = await supabaseAdmin
      .from('lessons')
      .select('user_id, created_at')
      .gte('created_at', todayIso)
      .not('user_id', 'is', null)
    if (todayErr) throw todayErr
    const todayMap: Record<string, number> = {}
    for (const r of todayRows || []) {
      const uid = r.user_id as string
      todayMap[uid] = (todayMap[uid] || 0) + 1
    }

    // Response is a dictionary keyed by user_id
    const result: Record<string, { today: number; lifetime: number }> = {}
    const uids = new Set([...Object.keys(lifetimeMap), ...Object.keys(todayMap)])
    for (const uid of uids) {
      result[uid] = { today: todayMap[uid] || 0, lifetime: lifetimeMap[uid] || 0 }
    }

    return res.status(200).json(result)
  } catch (e: any) {
    console.error('admin/lesson-stats/by-user error', e)
    return res.status(500).json({ error: String(e?.message || e) })
  }
}
