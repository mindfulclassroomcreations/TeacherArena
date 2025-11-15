import type { NextApiRequest, NextApiResponse } from 'next'
import client from '@/lib/openai'

// Simple quick lesson generator: accepts country, stateCurriculum, grade, subject, and an array of subStandards
// Each subStandard: { code?: string, description?: string, lessons?: number }
// Returns lessons grouped by provided sub-standard entries (no DB persistence, user merges later)

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } }

interface QuickLessonReq {
  country?: string
  stateCurriculum?: string
  grade?: string
  subject?: string
  // Each input row produces one or more sub-standards; include optional shared title
  subStandards?: Array<{ code?: string; description?: string; lessons?: number; title?: string }>
  model?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OpenAI not configured' })
  const { country, stateCurriculum, grade, subject, subStandards = [], model = 'gpt-5-mini-2025-08-07' }: QuickLessonReq = req.body || {}
    if (!subject || !grade || !Array.isArray(subStandards) || subStandards.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: subject, grade, subStandards' })
    }

    const cleaned = subStandards.map((s, i) => ({
      index: i,
      code: String(s.code || '').trim(),
      description: String(s.description || '').trim(),
      title: String(s.title || '').trim(),
      lessons: Math.min(10, Math.max(1, Number(s.lessons) || 1))
    }))

    const sys = 'You are an expert curriculum lesson designer. Return ONLY valid JSON. No prose, no markdown.'

  const user = `Create lessons for the following sub-standards. Provide JSON only.\nContext:\nCountry: ${country || ''}\nState/Curriculum: ${stateCurriculum || ''}\nGrade: ${grade || ''}\nSubject: ${subject || ''}\nSub-standards (array with index, code, title, description, lessons count):\n${JSON.stringify(cleaned)}\n\nRULES:\n- For each sub-standard produce the requested number of lessons.\n- Output keys: index (number, maps to input), lessons (array).\n- Each lesson: { title: string, description: string, standard_code: string }.\n- Titles concise (max ~12 words). Descriptions 1–2 sentences, actionable, age-appropriate.\n- Use provided code as standard_code (or improve punctuation minimally if obvious).\n- If a row has a title, subtly align lesson titles to that theme.\nOUTPUT JSON SHAPE: { items: [ { index: number, lessons: [ { title: string, description: string, standard_code: string } ] } ] }`

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.5,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user }
      ],
      response_format: { type: 'json_object' }
    })

    const content = completion.choices?.[0]?.message?.content || ''
    let parsed: any = null
    try { parsed = JSON.parse(content) } catch {}
    if (!parsed || !Array.isArray(parsed.items)) {
      return res.status(200).json({ items: [] })
    }

    // Flatten lessons with reference back to sub-standard code
    const flatLessons = parsed.items.flatMap((block: any) => {
      const input = cleaned.find(c => c.index === block.index)
      const code = input?.code || ''
      const rowTitle = input?.title || ''
      const arr = Array.isArray(block.lessons) ? block.lessons : []
      return arr.map((l: any) => ({
        title: String(l.title || '').trim(),
        description: String(l.description || '').trim(),
        standard_code: String(l.standard_code || code).trim() || code,
        _subIndex: block.index,
        _rowTitle: rowTitle
      }))
    })

    return res.status(200).json({ items: flatLessons })
  } catch (e: any) {
    return res.status(500).json({ error: String(e?.message || e) })
  }
}
