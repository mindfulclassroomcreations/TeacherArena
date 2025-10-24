import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

type ResponseData = {
  success?: boolean
  subjects?: any[]
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method === 'GET') {
    // Get all subjects
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return res.status(200).json({ success: true, subjects: data })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  } else if (req.method === 'POST') {
    // Create a new subject
    try {
      const { name, description } = req.body

      if (!name) {
        return res.status(400).json({ error: 'Name is required' })
      }

      const { data, error } = await supabase
        .from('subjects')
        .insert([{ name, description }])
        .select()

      if (error) throw error

      return res.status(201).json({ success: true, subjects: data })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}
