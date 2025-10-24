import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

type ResponseData = {
  success?: boolean
  grades?: any[]
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
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

      const { data, error } = await supabase
        .from('grades')
        .insert([{ framework_id, name, description }])
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
