import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

type ResponseData = {
  success?: boolean
  frameworks?: any[]
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method === 'GET') {
    // Get frameworks by subject_id
    try {
      const { subject_id } = req.query

      if (!subject_id) {
        return res.status(400).json({ error: 'subject_id is required' })
      }

      const { data, error } = await supabase
        .from('frameworks')
        .select('*')
        .eq('subject_id', subject_id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return res.status(200).json({ success: true, frameworks: data })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  } else if (req.method === 'POST') {
    // Create a new framework
    try {
      const { subject_id, name, description } = req.body

      if (!subject_id || !name) {
        return res.status(400).json({ error: 'subject_id and name are required' })
      }

      const { data, error } = await supabase
        .from('frameworks')
        .insert([{ subject_id, name, description }])
        .select()

      if (error) throw error

      return res.status(201).json({ success: true, frameworks: data })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}
