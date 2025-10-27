import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { supabase as browserSupabase } from '@/lib/supabase'

type ResponseData = {
  success?: boolean
  grades?: any[]
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : ''
  const supabase = token && supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${token}` } } })
    : browserSupabase

  const { data: userData } = token ? await supabase.auth.getUser(token) : { data: null as any }
  const userId = userData?.user?.id || null

  if (req.method === 'GET') {
    // Get grades by framework_id
    try {
      const { framework_id } = req.query

      if (!framework_id) {
        return res.status(400).json({ error: 'framework_id is required' })
      }

      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .eq('framework_id', framework_id)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return res.status(200).json({ success: true, grades: data })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  } else if (req.method === 'POST') {
    // Create a new grade
    try {
  const { framework_id, name, description } = req.body

      if (!framework_id || !name) {
        return res.status(400).json({ error: 'framework_id and name are required' })
      }

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { data, error } = await supabase
        .from('grades')
        .insert([{ framework_id, name, description, user_id: userId }])
        .select()

      if (error) throw error

      return res.status(201).json({ success: true, grades: data })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}
