import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Server-only admin client using service role
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE || ''
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || ''

const supabaseAdmin = createClient(url, serviceKey)

function isAuthorized(req: NextApiRequest) {
  const key = req.headers['x-admin-key']
  return typeof key === 'string' && key.length > 0 && ADMIN_API_KEY && key === ADMIN_API_KEY
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!serviceKey || !url) {
    return res.status(500).json({ error: 'Server not configured for admin actions' } as any)
  }
  if (!isAuthorized(req)) {
    return res.status(403).json({ error: 'Unauthorized' } as any)
  }

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id,email,role,tokens,created_at,updated_at')
        .order('created_at', { ascending: false })
      if (error) throw error
      return res.status(200).json({ items: data })
    }

    if (req.method === 'POST') {
      const { id, role, addTokens, setTokens } = req.body || {}
      if (!id) return res.status(400).json({ error: 'Missing id' } as any)
      const updates: any = {}
      if (role) updates.role = role
      if (typeof setTokens === 'number') updates.tokens = setTokens
      let error
      if (Object.keys(updates).length > 0) {
        const resp = await supabaseAdmin.from('profiles').update(updates).eq('id', id)
        error = resp.error
      }
      if (!error && typeof addTokens === 'number' && addTokens !== 0) {
        // increment tokens atomically
        const { data: row, error: selErr } = await supabaseAdmin.from('profiles').select('tokens').eq('id', id).single()
        if (selErr) throw selErr
        const newTokens = Math.max(0, (row?.tokens || 0) + addTokens)
        const { error: upErr } = await supabaseAdmin.from('profiles').update({ tokens: newTokens }).eq('id', id)
        if (upErr) throw upErr
      }
      return res.status(200).json({ success: true })
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {}
      if (!id) return res.status(400).json({ error: 'Missing id' } as any)
      // remove profile row; optionally remove auth user via GoTrue admin (requires separate key)
      const { error } = await supabaseAdmin.from('profiles').delete().eq('id', id)
      if (error) throw error
      return res.status(200).json({ success: true })
    }

    res.setHeader('Allow', 'GET,POST,DELETE')
    return res.status(405).json({ error: 'Method not allowed' } as any)
  } catch (e: any) {
    return res.status(500).json({ error: String(e?.message || e) } as any)
  }
}
