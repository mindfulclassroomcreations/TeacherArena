import type { NextApiRequest, NextApiResponse } from 'next'
import client from '@/lib/openai'
import { ALLOWED_MODELS, DEFAULT_MODEL } from '@/lib/ai-constants'

// Lightweight helpers aligned with generate-with-ai for curriculum-aware code enforcement
type CurriculumFamily = 'NGSS' | 'TEKS' | 'SOL' | 'OTHER'
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
function buildFallbackCode(params: { subject?: string; grade?: string; section?: string; index: number }) {
  const { subject = '', grade = '', section = '', index } = params
  const s = subject.toLowerCase()
  const acronym = s.includes('science') ? 'SCI' : s.includes('math') ? 'MATH' : (s.includes('english') || s.includes('ela') || s.includes('language')) ? 'ELA' : (s.includes('social') || s.includes('history') || s.includes('civics')) ? 'SS' : (s.includes('computer') || s.includes('technology') || s.includes('ict') || s.includes('cs')) ? 'CS' : (subject || 'STD').trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'STD'
  const gradeBand = String(grade || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4)
  const sec = String(section || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
  const letter = String.fromCharCode('A'.charCodeAt(0) + (index % 26))
  return [acronym, gradeBand || 'GR', sec || 'SEC', letter].filter(Boolean).join('-')
}
function detectCurriculumFamily(name?: string, region?: string): CurriculumFamily {
  const s = `${name || ''} ${region || ''}`.toLowerCase()
  if (/(ngss|next generation science|nyssls|ste\b|ngsss)/.test(s)) return 'NGSS'
  if (/(teks|texas\b)/.test(s)) return 'TEKS'
  if (/(sol|virginia\b)/.test(s)) return 'SOL'
  return 'OTHER'
}
function isCodeAllowedByFamily(code: string, family: CurriculumFamily, subject?: string): boolean {
  const up = String(code || '').toUpperCase()
  if (!up) return false
  switch (family) {
    case 'NGSS':
      // Accept both DCI (HS-LS1.A) and Performance Expectations (MS-PS2-1), including grade bands (K-2, 3-5, 6-8, 9-12)
      return /^(HS|MS|K|[1-9]|1[0-2]|K-2|3-5|6-8|9-12)\-(LS|PS|ESS|ETS)\d((\.[A-Z])|(\-\d+[A-Z]?))?$/.test(up)
    case 'TEKS':
      return /^(K|[1-9]|1[0-2])\.[0-9]+[A-Z]$/.test(up) || /^(BIO|CHEM|PHYS|SCI)\.[0-9]+(\.[A-Z])?$/.test(up)
    case 'SOL':
      return /^(K|[1-9]|1[0-2])\.[0-9]+[A-Z]$/i.test(up) || /^(BIO|CHEM|PHYS|SCI)\.[0-9]+(\.[A-Z])?$/i.test(up)
    default:
      // For OTHER curricula, accept any non-empty code (no strict pattern enforcement)
      return up.length > 0
  }
}
function isLikelyScienceCode(code: string): boolean {
  const up = String(code || '').toUpperCase()
  if (!up) return false
  if (/^(HS|MS|K|[1-9]|1[0-2])\-(LS|PS|ESS|ETS)\d(\.[A-Z])?$/.test(up)) return true
  if (/^(K|[1-9]|1[0-2])\.[0-9]+[A-Z]$/.test(up)) return true
  if (/^(BIO|CHEM|PHYS|SCI)\./.test(up)) return true
  if (/^SCI\-/.test(up)) return true
  return false
}

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
  const { country, stateCurriculum, grade, subject, subStandards = [], model: reqModel = DEFAULT_MODEL }: QuickLessonReq = req.body || {}
    const model = (ALLOWED_MODELS as readonly string[]).includes(String(reqModel)) ? String(reqModel) : DEFAULT_MODEL
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

    // Flatten lessons with curriculum-family validation and safe fallbacks
    const family = detectCurriculumFamily(stateCurriculum, country)
    const flatLessons = parsed.items.flatMap((block: any) => {
      const input = cleaned.find(c => c.index === block.index)
      const baseCode = String(input?.code || '')
      const rowTitle = input?.title || ''
      const subj = String(subject || '')
      const arr = Array.isArray(block.lessons) ? block.lessons : []
      return arr.map((l: any, idx: number) => {
        const proposed = String(l.standard_code || baseCode || '').trim()
        const normalized = normalizeStandardCode(proposed)
        const allowed = isCodeAllowedByFamily(normalized, family, subj)
        let finalCode = normalized
        if (!allowed) {
          if (subj.toLowerCase().includes('science')) {
            if (!isLikelyScienceCode(normalized)) {
              finalCode = buildFallbackCode({ subject: subj, grade, section: rowTitle, index: idx })
            }
          } else {
            finalCode = buildFallbackCode({ subject: subj, grade, section: rowTitle, index: idx })
          }
        }
        return {
          title: String(l.title || '').trim(),
          description: String(l.description || '').trim(),
          standard_code: finalCode,
          _subIndex: block.index,
          _rowTitle: rowTitle
        }
      })
    })

    return res.status(200).json({ items: flatLessons })
  } catch (e: any) {
    return res.status(500).json({ error: String(e?.message || e) })
  }
}
