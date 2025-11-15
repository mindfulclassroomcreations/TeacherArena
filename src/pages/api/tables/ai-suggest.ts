import type { NextApiRequest, NextApiResponse } from 'next'
import client from '@/lib/openai'

type LessonItem = { title?: string; name?: string; description?: string; standard_code?: string; code?: string }

type Body = {
  model?: string
  webSearch?: boolean
  scope: 'lesson' | 'section'
  subject?: string
  framework?: string
  grade?: string
  region?: string
  sectionKey?: string
  sectionName?: string
  standardCode?: string
  lesson?: LessonItem
  lessons?: LessonItem[]
  userInstructions?: string
}

type SuggestionResponse = {
  type: 'lessonUpdate' | 'sectionBulkUpdate'
  updates?: { standard?: string; title?: string; notes?: string }
  sectionUpdates?: Array<{ index: number; standard?: string; title?: string; notes?: string }>
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OpenAI not configured' })
  const { model = 'gpt-5-mini-2025-08-07', webSearch = false, scope, subject, framework, grade, region, sectionName, lesson, lessons, userInstructions }: Body = req.body || {}
    if (!scope) return res.status(400).json({ error: 'Missing scope' })

  const baseContext = `You are an expert K-12 curriculum editor. Subject: ${subject || ''}. Framework/Curriculum: ${framework || ''}. Grade: ${grade || ''}. Region/State: ${region || ''}. Section: ${sectionName || ''}.`;
    const searchHint = webSearch ? '\nYou may use your broad web knowledge to ensure correctness and suggest realistic, standards-aligned edits. Prefer concise improvements.' : ''

    let sys = 'Return ONLY valid JSON. No prose, no markdown.'
    let user = ''
    if (scope === 'lesson') {
      const l = lesson || {}
      user = `${baseContext}${searchHint}\nTASK: Improve the following lesson entry for clarity, alignment, and correctness. Validate the STANDARD code strictly matches the given Grade and Region/State for the specified Curriculum. If the code format or grade band is mismatched, correct it to the most appropriate official code and preserve correct hyphenation/punctuation. Provide small edits only.\nINPUT: ${JSON.stringify({
        code: l.standard_code || l.code || '',
        title: l.title || l.name || '',
        notes: l.description || ''
      })}\nOUTPUT JSON SHAPE:\n{ "type": "lessonUpdate", "updates": { "standard": "string?", "title": "string?", "notes": "string?" } }\n${userInstructions ? `USER NOTES: ${userInstructions}` : ''}`
    } else {
      const arr = Array.isArray(lessons) ? lessons : []
      user = `${baseContext}${searchHint}\nTASK: Validate and correct STANDARD codes so they match the grade band and Region/State for the specified Curriculum. Also propose small, precise edits (tighten titles, clarify notes). Only include items that need changes.\nINPUT: ${JSON.stringify(arr.map((it, i) => ({ index: i, code: it.standard_code || it.code || '', title: it.title || it.name || '', notes: it.description || '' })))}\nOUTPUT JSON SHAPE:\n{ "type": "sectionBulkUpdate", "sectionUpdates": [ { "index": number, "standard": "string?", "title": "string?", "notes": "string?" } ] }\n${userInstructions ? `USER NOTES: ${userInstructions}` : ''}`
    }

    async function callOpenAI(modelName: string): Promise<string> {
      const completion = await client.chat.completions.create({
        model: modelName,
        temperature: 0.2,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
      })
      return completion.choices?.[0]?.message?.content || ''
    }

    // If a Gemini model is provided, coerce to default OpenAI model (Gemini disabled)
  const effectiveModel = /^gemini\-/i.test(model) ? 'gpt-5-mini-2025-08-07' : model

    let content = ''
    try {
      content = await callOpenAI(effectiveModel)
    } catch (e: any) {
      const fallback = 'gpt-4o-mini'
      content = await callOpenAI(fallback)
    }
    let parsed: SuggestionResponse | null = null
    try { parsed = JSON.parse(content) } catch {}
    if (!parsed) return res.status(200).json({ type: scope === 'lesson' ? 'lessonUpdate' : 'sectionBulkUpdate' })

    // Normalize common NGSS-style hyphenation for returned standards without altering state-specific formats
    function normalizeStandardCode(input: string | undefined | null): string {
      const raw = String(input || '').trim()
      if (!raw) return ''
      const up = raw.toUpperCase()
      if (/^(HS|MS|K|[1-9]|1[0-2])-/.test(up)) return raw
      const m1 = up.match(/^(HS|MS)(LS|PS|ESS|ETS)(\d)(\.[A-Z])?$/)
      if (m1) return `${m1[1]}-${m1[2]}${m1[3]}${m1[4] || ''}`
      const m2 = up.match(/^(K|[1-9]|1[0-2])(LS|PS|ESS|ETS)(\d)(\.[A-Z])?$/)
      if (m2) return `${m2[1]}-${m2[2]}${m2[3]}${m2[4] || ''}`
      return raw
    }

    if (parsed.type === 'lessonUpdate' && (parsed as any).updates?.standard) {
      (parsed as any).updates.standard = normalizeStandardCode((parsed as any).updates.standard)
    }
    if (parsed.type === 'sectionBulkUpdate' && Array.isArray((parsed as any).sectionUpdates)) {
      (parsed as any).sectionUpdates = (parsed as any).sectionUpdates.map((u: any) => (
        'standard' in u && typeof u.standard === 'string'
          ? { ...u, standard: normalizeStandardCode(u.standard) }
          : u
      ))
    }
    return res.status(200).json(parsed)
  } catch (e: any) {
    return res.status(500).json({ error: String(e?.message || e) })
  }
}
