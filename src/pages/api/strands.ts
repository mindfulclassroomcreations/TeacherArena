import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

type ResponseData = {
  success?: boolean
  strands?: any[]
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

  if (req.method === 'GET') {
    // Get strands by grade_id
    try {
      const { grade_id } = req.query

      if (!grade_id) {
        return res.status(400).json({ error: 'grade_id is required' })
      }

      const { data, error } = await supabase
        .from('strands')
        .select('*')
        .eq('grade_id', grade_id)
        .order('strand_code', { ascending: true })

      if (error) throw error

      return res.status(200).json({ success: true, strands: data })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  } else if (req.method === 'POST') {
    // Create new strands (batch insert)
    try {
      const { grade_id, strands } = req.body

      if (!grade_id || !strands || !Array.isArray(strands)) {
        return res.status(400).json({ error: 'grade_id and strands array are required' })
      }

      // Add grade_id to each strand
      const strandsWithGrade = strands.map(strand => ({
        ...strand,
        grade_id
      }))

      const { data, error } = await supabase
        .from('strands')
        .insert(strandsWithGrade)
        .select()

      if (error) throw error

      return res.status(201).json({ success: true, strands: data })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}
