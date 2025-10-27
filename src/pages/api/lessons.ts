import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { supabase as browserSupabase } from '@/lib/supabase'

type ResponseData = {
  success?: boolean
  lessons?: any[]
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

  // Resolve current user id (for scoping)
  const { data: userData } = token ? await supabase.auth.getUser(token) : { data: null as any }
  const userId = userData?.user?.id || null

  if (req.method === 'GET') {
    // Get lessons by strand_id
    try {
      const { strand_id } = req.query

      if (!strand_id) {
        return res.status(400).json({ error: 'strand_id is required' })
      }

      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('strand_id', strand_id)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return res.status(200).json({ success: true, lessons: data })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  } else if (req.method === 'POST') {
    // Create new lessons (batch insert)
    try {
      const { strand_id, lessons } = req.body

      if (!strand_id || !lessons || !Array.isArray(lessons)) {
        return res.status(400).json({ error: 'strand_id and lessons array are required' })
      }

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      // Add strand_id to each lesson
      const lessonsWithStrand = lessons.map(lesson => ({
        ...lesson,
        strand_id,
        user_id: userId
      }))

      const { data, error } = await supabase
        .from('lessons')
        .insert(lessonsWithStrand)
        .select()

      if (error) throw error

      return res.status(201).json({ success: true, lessons: data })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}
