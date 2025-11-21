import type { NextApiRequest, NextApiResponse } from 'next'
import { OpenAI } from 'openai'
import { ALLOWED_MODELS, DEFAULT_MODEL } from '@/lib/ai-constants'
import { createClient } from '@supabase/supabase-js'

// Disable body parser size limit
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const PROMPT_ID = 'pmpt_68fa404d58b08190a2e2c32770b4f59806857d16f04d704a'
const LESSON_PROMPT_ID = 'pmpt_68fafd15edc08197806351f71c1b39cb086c40b5fe347771'

// Lightweight normalizer to preserve official code punctuation and fix common NGSS-style hyphen omissions
function normalizeStandardCode(input: string | undefined | null): string {
  const raw = String(input || '').trim()
  if (!raw) return ''
  const up = raw.toUpperCase()
  // If already has a hyphen after HS/MS or grade number, keep as-is
  if (/^(HS|MS|K|[1-9]|1[0-2])-/.test(up)) return raw
  // Insert missing hyphen for NGSS-style DCI identifiers without the hyphen (e.g., HSLS1.A -> HS-LS1.A)
  const m1 = up.match(/^(HS|MS)(LS|PS|ESS|ETS)(\d)(\.[A-Z])?$/)
  if (m1) {
    const fixed = `${m1[1]}-${m1[2]}${m1[3]}${m1[4] || ''}`
    return fixed
  }
  // K-12 numeric prefixes without hyphen, e.g., 3ESS2.C -> 3-ESS2.C
  const m2 = up.match(/^(K|[1-9]|1[0-2])(LS|PS|ESS|ETS)(\d)(\.[A-Z])?$/)
  if (m2) {
    const fixed = `${m2[1]}-${m2[2]}${m2[3]}${m2[4] || ''}`
    return fixed
  }
  // Otherwise, return original untouched to avoid breaking state-specific formats (TEKS, SOL, etc.)
  return raw
}

// Build a simple teacher-facing fallback code when the model mixes subjects
function buildFallbackCode(params: { subject?: string; grade?: string; section?: string; index: number }) {
  const { subject = '', grade = '', section = '', index } = params
  const acronym = ((): string => {
    const s = subject.toLowerCase()
    if (s.includes('science')) return 'SCI'
    if (s.includes('math')) return 'MATH'
    if (s.includes('english') || s.includes('ela') || s.includes('language')) return 'ELA'
    if (s.includes('social') || s.includes('history') || s.includes('civics')) return 'SS'
    if (s.includes('computer') || s.includes('technology') || s.includes('ict') || s.includes('cs')) return 'CS'
    return (subject || 'STD').trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'STD'
  })()
  const gradeBand = String(grade || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4)
  const sec = String(section || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
  const letter = String.fromCharCode('A'.charCodeAt(0) + (index % 26))
  return [acronym, gradeBand || 'GR', sec || 'SEC', letter].filter(Boolean).join('-')
}

// Curriculum family detection and code validators
type CurriculumFamily = 'NGSS' | 'TEKS' | 'SOL' | 'OTHER'

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
      // Accept both DCI (HS-LS1.A, 3-ESS2.C) and Performance Expectations (MS-PS2-1), including grade bands (K-2, 3-5, 6-8, 9-12)
      return /^(HS|MS|K|[1-9]|1[0-2]|K-2|3-5|6-8|9-12)\-(LS|PS|ESS|ETS)\d((\.[A-Z])|(\-\d+[A-Z]?))?$/.test(up)
    case 'TEKS':
      // 5.7A style across subjects; allow BIO./CHEM./PHYS. prefixes for HS
      return /^(K|[1-9]|1[0-2])\.[0-9]+[A-Z]$/.test(up) || /^(BIO|CHEM|PHYS|SCI)\.[0-9]+(\.[A-Z])?$/.test(up)
    case 'SOL':
      // 6.2a or BIO.1.a (accept both upper/lower final letter)
      return /^(K|[1-9]|1[0-2])\.[0-9]+[A-Z]$/i.test(up) || /^(BIO|CHEM|PHYS|SCI)\.[0-9]+(\.[A-Z])?$/i.test(up)
    default:
      // For OTHER curricula, accept any non-empty code (no strict pattern enforcement)
      return up.length > 0
  }
}

// Heuristic subject-aware checker retained for Science-specific fallbacks
function isLikelyScienceCode(code: string): boolean {
  const up = String(code || '').toUpperCase()
  if (!up) return false
  if (/^(HS|MS|K|[1-9]|1[0-2])\-(LS|PS|ESS|ETS)\d(\.[A-Z])?$/.test(up)) return true
  if (/^(K|[1-9]|1[0-2])\.[0-9]+[A-Z]$/.test(up)) return true
  if (/^(BIO|CHEM|PHYS|SCI)\./.test(up)) return true
  if (/^SCI\-/.test(up)) return true
  return false
}

// Supabase admin client for token enforcement
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || ''
const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_ROLE)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
  : null

async function getAuthUserId(req: NextApiRequest): Promise<{ userId?: string; error?: string }> {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : ''
    if (!token) return { error: 'Login required' }
    if (!supabaseAdmin) return { error: 'Token system not configured' }
    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !data.user) return { error: 'Invalid session' }
    return { userId: data.user.id }
  } catch (e: any) {
    return { error: String(e?.message || e) }
  }
}

async function getUserTokens(userId: string): Promise<number> {
  if (!supabaseAdmin) return Number.MAX_SAFE_INTEGER
  // Try new table name first
  let { data, error } = await supabaseAdmin.from('user_profiles').select('tokens').eq('id', userId).maybeSingle()
  // If relation missing, fallback to legacy table
  const missing = (error as any)?.code === '42P01' || /relation .* does not exist/i.test(String(error?.message || ''))
  if (missing) {
    const alt = await supabaseAdmin.from('profiles').select('tokens').eq('id', userId).maybeSingle()
    if (alt.error) throw alt.error
    return alt.data?.tokens ?? 0
  }
  if (error) throw error
  return data?.tokens ?? 0
}

async function setUserTokens(userId: string, newTokens: number) {
  if (!supabaseAdmin) return
  let { error } = await supabaseAdmin.from('user_profiles').update({ tokens: Math.max(0, newTokens) }).eq('id', userId)
  const missing = (error as any)?.code === '42P01' || /relation .* does not exist/i.test(String(error?.message || ''))
  if (missing) {
    const alt = await supabaseAdmin.from('profiles').update({ tokens: Math.max(0, newTokens) }).eq('id', userId)
    if (alt.error) throw alt.error
    return
  }
  if (error) throw error
}

type ResponseData = {
  success?: boolean
  items?: any[]
  count?: number
  error?: string
  details?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Set CORS headers for production
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
  const { type, country, subject, framework, grade, context, totalLessonCount, region, subjectsCount, section, stateCurriculum, subStandards, lessonsPerStandard, targetLessonCount, stateStandardName, model: reqModel } = req.body

    if (!type) {
      return res.status(400).json({ error: 'Missing required field: type' })
    }

    if (type === 'subjects' && !country) {
      return res.status(400).json({ error: 'Missing required field: country (for subject generation)' })
    }

    if (type !== 'subjects' && !subject) {
      return res.status(400).json({ error: 'Missing required field: subject' })
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' })
    }

    // Token pre-check for lesson generation endpoints
    let userId: string | undefined
    if (type === 'lessons-by-substandards' || type === 'lesson-generation-by-strand') {
      const { userId: uid, error } = await getAuthUserId(req)
      if (error || !uid) {
        return res.status(401).json({ error: 'Login required' })
      }
      userId = uid
      // Estimate cost
      let estimated = 0
      if (type === 'lessons-by-substandards') {
        const per = Number(lessonsPerStandard) > 0 ? Number(lessonsPerStandard) : 1
        const subs = Array.isArray(subStandards) ? subStandards.length : 1
        estimated = Math.max(1, per * subs)
      } else {
        estimated = Math.max(1, Number(targetLessonCount) || 10)
      }
      if (supabaseAdmin) {
        const tokens = await getUserTokens(userId)
        if (tokens < estimated) {
          return res.status(402).json({ error: 'Insufficient tokens. Please add tokens to continue.' })
        }
      }
    }

  let userPrompt = ''

  // Helper: Some models may wrap arrays inside an object like { items: [...] }.
  // This utility normalizes such responses into arrays when the API expects an array.
  const ensureArray = (data: any): any[] | null => {
    if (Array.isArray(data)) return data
    if (data && typeof data === 'object') {
      // Common wrapper key
      if (Array.isArray((data as any).items)) return (data as any).items
      // Other likely keys the model might use
      const candidateKeys = ['subjects', 'data', 'list', 'results', 'grades', 'major_parts']
      for (const key of candidateKeys) {
        const v = (data as any)[key]
        if (Array.isArray(v)) return v
      }
      // Find any array of objects with a likely item shape (name/title)
      for (const v of Object.values(data)) {
        if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && (('name' in v[0]) || ('title' in v[0]))) {
          return v as any[]
        }
      }
    }
    return null
  }

  // Shared guidance injected into each prompt for higher compliance
  const sharedRules = `
GENERAL INSTRUCTIONS
- Output MUST be valid JSON only. No prose, no markdown, no comments, no code fences.
- Use only the fields requested for each item. Do not add extra fields.
- Ensure items are unique and non-duplicative.
- If unsure or information is insufficient, make the best, typical curriculum-aligned choice—do NOT leave placeholders.
- Keep language concise and neutral.
`

  switch (type) {
  case 'unit-topics':
        userPrompt = `${sharedRules}
TASK: Generate main curriculum unit topic clusters for lesson planning.

INPUTS
- Subject: "${subject}"
- Country: "${country}"
${region ? `- Region/State: "${region}"` : ''}
${grade ? `- Grade Level: "${grade}"` : ''}
${context ? `ADDITIONAL CONTEXT\n${context}` : ''}

REQUIREMENTS
- Return 8–12 high-level unit topics (major conceptual groupings) appropriate for ${grade || 'K–12'} ${subject}.
- Each item must include: name (string), description (string).
- Name should be short (2–5 words) and classroom-friendly; description 1 concise sentence focusing on learning focus.
- Avoid duplicates or overly narrow single-lesson themes; focus on reusable multi-week clusters.
- Prefer units that map well to worksheet/task card / Google Forms style resources.

OUTPUT
[
  { "name": "Foundations of Measurement", "description": "Introduce core measurement concepts, tools, and real-world estimation." }
]
`
        break
  case 'section-standards':
        const familySS = detectCurriculumFamily(stateCurriculum || framework, region)
        const codeFamilyRules = (() => {
          switch (familySS) {
            case 'NGSS':
              return `For NGSS/NGSS-aligned adoptions, USE DCI-style codes like "HS-LS1.A", "MS-PS2.B", "3-ESS2.C" (with the hyphen). Do NOT output TEKS/SOL codes.`
            case 'TEKS':
              return `For Texas TEKS, USE codes like "5.7A" (grade.strandLetter) and for high school courses allow prefixes like "BIO.6B". Do NOT output NGSS/SOL codes.`
            case 'SOL':
              return `For Virginia SOL, USE codes like "6.2a" or high school forms like "BIO.1.a". Do NOT output NGSS/TEKS codes.`
            default:
              return `Use only the official local format for the selected curriculum. Do NOT guess NGSS/TEKS/SOL if not applicable.`
          }
        })()
        const confidenceRule = (() => {
          switch (familySS) {
            case 'NGSS':
            case 'TEKS':
            case 'SOL':
              return `CONFIDENCE RULE: If you are not highly confident at least 4 valid in-section sub-standards exist, return an empty JSON array [] instead of guessing.`
            default:
              return `CONFIDENCE RULE: For this curriculum, provide your best-fit in-section sub-standards even if you are not fully certain about every official code. Only return an empty JSON array [] if you truly cannot infer any reasonable sub-standards for this section at this grade.`
          }
        })()
        userPrompt = `${sharedRules}
TASK: For the selected curriculum, generate sub-standards for a specific section.

INPUTS
- Subject: "${subject}"
- Framework/Standard: "${framework}"
- Country: "${country}"
- Curriculum Group (State/Region): "${stateCurriculum || ''}"
- Grade Level: "${grade}"
${region ? `- Region/State: "${region}"` : ''}
- Section Name: "${section}"
${context ? `ADDITIONAL CONTEXT\n${context}` : ''}

REQUIREMENTS
- Generate ${familySS === 'NGSS' || familySS === 'TEKS' || familySS === 'SOL' ? '4–10' : '3–10'} sub-standards that belong under the section "${section}" for ${subject} at ${grade}.
- Each item must include exactly these fields:
  - code (string) — a short code or identifier like "S1.A" or "BIO.1.1".
  - name (string) — concise sub-standard title.
  - description (string) — 1–2 sentence explanation of the sub-standard.
- Keep codes unique and realistic; avoid placeholder text.
- Base sub-standards strictly on the official curriculum/state standard for the given country/region.
- Prefer official government or state education websites (e.g., TEKS, SOL, NGSS-aligned state pages) as the reference basis.
- Do NOT invent standards; mirror real structure/names where possible.
- STRICT UNIT BOUNDARY: Only include sub-standards that logically fall INSIDE the pedagogical scope of the section "${section}". If a candidate would clearly belong to another unit/section (even if related), EXCLUDE it.
- GRADE & CURRICULUM ALIGNMENT: All sub-standards must be appropriate for grade ${grade} and reflect the selected curriculum family. Do not output advanced high-school only content if grade is elementary, etc.
- ${confidenceRule}
- NO CROSS-UNIT REFERENCES: Names or descriptions must NOT explicitly reference other units/sections by name (e.g., "This prepares for Forces & Motion" if that is a different unit).
- NO MIXED SUBJECTS: Stay strictly within ${subject}—no cross-curricular blend unless inherently part of the official standard wording.

CODE FORMAT RULES
- Preserve official punctuation and separators in codes (hyphens and dots). Do NOT drop hyphens.
- If the framework is NGSS-style (or a state adoption like NYSSLS, MA STE), use DCI-style identifiers when applicable, e.g., "HS-LS1.A", "MS-PS2.B", "3-ESS2.C" (NOT "HSLS1.A").
- If the framework uses state-specific formats (e.g., TEKS, SOL), follow those exactly and do not convert formats.
  - ${codeFamilyRules}
  - STRICT SUBJECT ENFORCEMENT: The subject is ${subject}. Do NOT output codes from other subjects. If you are uncertain about the official code for THIS subject and region/grade, generate a teacher-facing code using the pattern "SCI-<GRADE>-<SECTION>-<LETTER>" for science, or "<SUBJ>-<GRADE>-<SECTION>-<LETTER>" in general (do NOT claim it is official), and keep the name/description accurate.

OUTPUT
[
  { "code": "S1.A", "name": "Scientific Inquiry Basics", "description": "Plan and carry out simple investigations using observations and measurements." }
]
`
        break
      case 'subjects':
        const count = (typeof subjectsCount === 'number' && subjectsCount > 0 && subjectsCount <= 50) ? Math.floor(subjectsCount) : undefined
        userPrompt = `${sharedRules}
TASK: Generate educational subjects for product research on the TeachersPayTeachers (TPT) marketplace.
MARKET: ${country} schools; Grades 1–12 (primary to secondary).
PRODUCT TYPES: Worksheets, Task Cards, Google Forms, and similar printable/Google resources.
CONTEXT: ${context || 'General focus on high-demand classroom subjects suitable for printable and Google resources.'}

REQUIREMENTS
- ${count ? `Return EXACTLY ${count} subjects` : `Return 12–20 subjects`} commonly taught across Grades 1–12 in ${country}, spanning core and high‑demand elective areas.
- Ensure at least one Science or science‑related subject (e.g., "Science", "General Science", "Physical Science", "Life Science", "Biology", "Chemistry", "Physics", "Earth/Space Science", "Environmental Science", "STEM") unless Science is not typically taught in K–12 for ${country}.
- Optimize for subjects that are well-suited to worksheets, task cards, and Google Forms (clear skills practice, objective assessments).
- Each item must include: name (string), description (string).
- Avoid overly narrow topics and post‑secondary subjects; avoid course-level variants unless universally recognized.

OUTPUT
[
  { "name": "Mathematics", "description": "Grade 1–12 numeracy and problem solving (arithmetic, algebra, geometry, data). Strong fit for worksheets and Google Forms quizzes." }
]
`
        break

  

  case 'frameworks':
        // Dual-mode: if a specific framework is provided, generate its sections aligned to grade/region.
  if (framework) {
          userPrompt = `${sharedRules}
TASK: Generate curriculum standard sections under the specified framework.

INPUTS
- Subject: "${subject}"
- Framework/Standard: "${framework}"
- Country: "${country}"
${region ? `- Region/State: "${region}"` : ''}
${grade ? `- Grade Level: "${grade}"` : ''}
${stateStandardName ? `- Official/Reference Standard Name: "${stateStandardName}"` : ''}
${context ? `ADDITIONAL CONTEXT
${context}` : ''}

REQUIREMENTS
- STRICT MATCHING: Only include sections/units that are officially part of the framework "${framework}" for the subject ${subject}${grade ? ` at ${grade}` : ''}${region ? ` in ${region}` : ''}. If you are not certain about an item’s inclusion, DO NOT GUESS—omit it.
- FALLBACK WITHIN OFFICIAL STRUCTURE: If the framework does not publish named "units/sections" for this grade/subject but does publish official strands/domains/clusters, return those official strands/domains/clusters as the sections instead of returning an empty list.
- If neither official units nor official strands/domains/clusters for this grade can be determined with reasonable confidence, return an empty JSON array []. Do NOT invent units.
- Return 6–15 items only if they are official; otherwise fewer or 0 is acceptable.
- Each item must include: name (string), description (string).
- Keep subject alignment strict to ${subject} and avoid cross-subject content.
- Prefer short, recognizable official section names; descriptions 1–2 sentences aligned to the grade and region (if provided).

OUTPUT
[
  { "name": "Forces and Motion", "description": "Investigate balanced and unbalanced forces, motion, and simple machines with age-appropriate investigations." }
]
`
        } else {
          userPrompt = `${sharedRules}
TASK: Generate curriculum frameworks (or unit clusters) for:
- Subject: "${subject}"
- Country: "${country}"
${region ? `- Region/State: "${region}"` : ''}
${context ? `ADDITIONAL CONTEXT
${context}` : ''}

REQUIREMENTS
- Return 4–10 items representing frameworks, strands, or unit clusters commonly used for this subject in ${country}.
- Each item must include: name (string), description (string).
- Names should be short and recognizable; descriptions 1–2 sentences.

OUTPUT
[
  { "name": "Number and Operations", "description": "Numeracy foundations including place value, operations with whole numbers, and fractions." }
]
`
        }
        break

  case 'grades':
        userPrompt = `${sharedRules}
TASK: Return grade levels organized into categories for lesson planning.

INPUTS
- Subject: "${subject}"
- Framework: "${framework}"
- Country: "${country}"
${region ? `- Region/State: "${region}"` : ''}
${context ? `ADDITIONAL CONTEXT\n${context}` : ''}

REQUIREMENTS
- Use EXACTLY these categories and grade lists:
  - elementary.grades: [
      {"name":"Preschool"},
      {"name":"Kindergarten"},
      {"name":"1st grade"},
      {"name":"2nd grade"},
      {"name":"3rd grade"},
      {"name":"4th grade"},
      {"name":"5th grade"}
    ]
  - middle_school.grades: [
      {"name":"6th grade"},
      {"name":"7th grade"},
      {"name":"8th grade"}
    ]
  - high_school.grades: [
      {"name":"9th grade"},
      {"name":"10th grade"},
      {"name":"11th grade"},
      {"name":"12th grade"}
    ]
- Provide a 1–2 sentence description for each grade tailored to ${subject} in ${country}${region ? ` (${region})` : ''}.
- Include select_all_labels: { elementary: "All Elementary", middle_school: "All Middle School", high_school: "All High School" }.

OUTPUT
Respond with ONLY a JSON object with exactly these keys and shapes:
{
  "elementary": { "label": "Elementary", "grades": [{"name":"Preschool","description":"..."}] },
  "middle_school": { "label": "Middle school", "grades": [{"name":"6th grade","description":"..."}] },
  "high_school": { "label": "High school", "grades": [{"name":"9th grade","description":"..."}] },
  "select_all_labels": { "elementary": "All Elementary", "middle_school": "All Middle School", "high_school": "All High School" }
}
`
        break

  case 'lesson-discovery':
        const finalTotalLessonCount = totalLessonCount || 45
        
        userPrompt = `${sharedRules}
ROLE: You are a curriculum framework analyst.

INPUTS
- Subject: "${subject}"
- Framework: "${framework}"
- Grade Level: "${grade}"
${region ? `- Region/State: "${region}"` : ''}
- Target Total Lesson Count: ${finalTotalLessonCount}

GOAL
Analyze this framework and identify all major strands/domains/clusters.

OUTPUT FORMAT
Respond with ONLY a JSON object:
{
  "framework_summary": "Brief overview",
  "major_parts": [
    {
      "strand_code": "string",
      "strand_name": "string",
      "num_standards": number,
      "key_topics": ["topic1", "topic2"],
      "target_lesson_count": number,
      "performance_expectations": ["CODE1"]
    }
  ],
  "total_lessons_planned": ${finalTotalLessonCount},
  "estimated_coverage": "percentage string"
}

CONSTRAINTS
- The sum of target_lesson_count across major_parts should closely match ${finalTotalLessonCount} (±10%).
- Provide 4–10 major_parts where reasonable.
- Codes and names should be concise and recognizably tied to the subject.
`
        break

  case 'lesson-generation-by-strand':
        const { strandCode, strandName, targetLessonCount, keyTopics, performanceExpectations } = req.body
        
        userPrompt = `${sharedRules}
ROLE: You are an expert lesson plan creator.

INPUTS
- Subject: "${subject}"
- Framework: "${framework}"
- Grade Level: "${grade}"
${region ? `- Region/State: "${region}"` : ''}
- Strand Code: "${strandCode}"
- Strand Name: "${strandName}"
- Target Lesson Count: ${targetLessonCount || 5}
- Key Topics: ${JSON.stringify(keyTopics || [])}
- Performance Expectations: ${JSON.stringify(performanceExpectations || [])}

GOAL
Generate ${targetLessonCount || 5} detailed lesson plans for this strand that align with the performance expectations.

OUTPUT FORMAT
Respond with ONLY a JSON array of lesson objects:
[
  {
    "name": "Lesson Title",
    "title": "Lesson Title",
    "description": "Brief lesson description covering learning objectives, key activities, and assessment methods"
  }
]

REQUIREMENTS:
- Each lesson should be unique and build upon previous lessons
- Include clear learning objectives
- Suggest hands-on activities appropriate for the grade level
- Include assessment strategies
- Align with the performance expectations provided
- Titles must be unique and concise; descriptions 1–3 sentences
- Strongly incorporate the provided key topics where applicable
`
        break

      case 'state-curricula':
        // Build canonical region lists for supported countries
        const usaRegions = [
          'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia',
          'Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland',
          'Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey',
          'New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina',
          'South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'
        ]
        const canadaRegions = [
          // Provinces (10)
          'Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland and Labrador','Nova Scotia','Ontario','Prince Edward Island','Quebec','Saskatchewan',
          // Territories (3)
          'Northwest Territories','Nunavut','Yukon'
        ]
        const australiaRegions = [
          // States (6)
          'New South Wales','Queensland','South Australia','Tasmania','Victoria','Western Australia',
          // Mainland Territories (2)
          'Australian Capital Territory','Northern Territory'
        ]
        const ukRegions = ['England','Scotland','Wales','Northern Ireland']

        let requiredRegionsText = ''
        if ((country || '').toLowerCase() === 'usa' || (country || '').toLowerCase().includes('united states')) {
          requiredRegionsText = `REQUIRED REGIONS (50 U.S. States)\n${usaRegions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
        } else if ((country || '').toLowerCase() === 'canada') {
          requiredRegionsText = `REQUIRED REGIONS (Canada: 10 Provinces + 3 Territories)\n${canadaRegions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
        } else if ((country || '').toLowerCase() === 'australia') {
          requiredRegionsText = `REQUIRED REGIONS (Australia: 6 States + 2 Mainland Territories)\n${australiaRegions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
        } else if ((country || '').toLowerCase().includes('uk') || (country || '').toLowerCase().includes('united kingdom')) {
          requiredRegionsText = `REQUIRED REGIONS (United Kingdom: 4 Countries)\n${ukRegions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
        }

        const subjectLower = (subject || '').toLowerCase()
        const subjectSpecific = subjectLower.includes('science')
          ? `
SUBJECT-SPECIFIC GUIDANCE (Science)
- USA: Reflect NGSS (Next Generation Science Standards) adoption/adaptation where applicable, and name state-specific standards explicitly (e.g., "Texas Essential Knowledge and Skills (TEKS) – Science", "Virginia Standards of Learning (SOL) – Science", "New York State Science Learning Standards (NYSSLS)", "Massachusetts Science and Technology/Engineering (STE) Standards", "Florida NGSSS Science").
- Canada: Use official provincial/territorial science curriculum names (e.g., "Ontario Science Curriculum", "BC Science K–12", "Alberta Science K–12", "Programme de formation – Science et technologie (QC)").
- Australia: Use "Australian Curriculum: Science (ACARA)" and state syllabus names (e.g., "NSW Science K–10 Syllabus", "Victorian Curriculum: Science").
- UK: Name per-country frameworks (e.g., "National Curriculum – Science (England)", "Curriculum for Excellence – Sciences (Scotland)", "Curriculum for Wales – Science and Technology", "Northern Ireland Science & Technology").
- Prefer the subject name within curriculum_name (e.g., include "Science").
`
          : ''

  userPrompt = `${sharedRules}
TASK: For the subject "${subject}" in ${country}, list curriculum standards groupings and ensure COMPLETE region coverage.

${requiredRegionsText ? `${requiredRegionsText}\n` : ''}
${subjectSpecific}

REQUIREMENTS
- Consider the selected subject when grouping (use subject-specific official names where possible).
- Group regions that share the same curriculum into a single object.
- Each object must include: curriculum_name (string), states (string[]), description (string).
- Include ALL regions for ${country}. If a region has no distinct curriculum for this subject, include it under a grouping with curriculum_name like "No special curriculum (${subject})" and a brief description.
- SORT ORDER: Sort the array by the number of regions in each grouping (states.length) DESC so the most common curricula appear first. Place the "No special curriculum" grouping last.
- Avoid duplicates: the union of all "states" arrays MUST cover each required region exactly once.
- Provide 3–12 groupings depending on ${country}.

OUTPUT
Respond with ONLY a JSON object using this exact shape:
{
  "items": [
    {
      "curriculum_name": "Common Core State Standards (CCSS) – Science",
      "states": ["California", "New York"],
      "description": "Science learning standards adopted or adapted by multiple states (discipline core ideas, practices, and crosscutting concepts)."
    }
  ]
}
`
        break

      case 'state-standard':
        userPrompt = `${sharedRules}
TASK: For the subject "${subject}" in ${country}, identify the official or commonly used curriculum standard for the region "${region}".

REQUIREMENTS
- Output ONE object describing the region-specific standard for this subject.
- If multiple names exist, include them in alternate_names.
- If there is no distinct standard for this subject, provide a best-fit description and set standard_name to "No special curriculum (${subject})".

OUTPUT (object only; will be wrapped in an array by the server)
{
  "region": "${region}",
  "standard_name": "string",
  "alternate_names": ["string"],
  "coverage_description": "1–3 sentence summary of what the standard covers and its alignment for ${subject}.",
  "notable_features": ["short bullet features"],
  "reference_note": "optional short note about source or adoption (no URLs required)"
}
`
        break

      case 'lessons-by-substandards':
        const { subStandards = [], lessonsPerStandard = 5 } = req.body
        const targetTotal = Math.max(1, (Array.isArray(subStandards) ? subStandards.length : 0) * (Number(lessonsPerStandard) || 5))
        userPrompt = `${sharedRules}
ROLE: You are an expert lesson plan creator.

INPUTS
- Subject: "${subject}"
- Framework/Standard: "${framework}"
- Grade Level: "${grade}"
${region ? `- Region/State: "${region}"` : ''}
- Country: "${country}"
- Curriculum Group (State/Region): "${stateCurriculum || ''}"
- Section: "${section}"
- Sub-standards: ${JSON.stringify(subStandards)}
- Target Lessons Per Sub-standard: ${Number(lessonsPerStandard) || 5}
- Target Total Lessons: ${targetTotal}

GOAL
Generate ${targetTotal} short lesson plan outlines distributed across the provided sub-standards (roughly ${Number(lessonsPerStandard) || 5} per sub-standard), aligned to the section and grade.

OUTPUT FORMAT
Respond with ONLY a JSON array of lesson objects:
[
  {
    "title": "Lesson Title",
    "description": "Brief lesson description with objectives, key activity, assessment",
    "standard_code": "SUBSTANDARD CODE",
    "lesson_code": "CODE combining sub-standard code + sequence, e.g., SUBSTANDARD-L01"
  }
]

REQUIREMENTS
- Cover each sub-standard with multiple lessons (approximately the requested count per sub-standard)
- Titles must be unique and concise; descriptions 1–3 sentences
- Align to the grade level and the sub-standard referenced via standard_code
- Provide a lesson_code for each lesson. Compose it using the sub-standard code plus a short sequence (e.g., CODE-L01, CODE-L02). Do NOT claim it is an official state code; it is a teacher-facing lesson identifier aligned to the standard.
- Base topic alignment and naming on official curriculum/state standards where possible; do not invent standard codes beyond the provided sub-standard codes.
- CODE FORMAT RULES: Preserve hyphens and dots in codes exactly as in the official framework. For NGSS-style identifiers, use forms like "HS-LS1.A" (NOT "HSLS1.A").
`
        break

      default:
        return res.status(400).json({ error: 'Invalid type' })
    }

    // Custom exhaustive flow for section-standards to include ALL relevant sub-standards within the unit
    // Skip exhaustive multi-call discovery for OTHER curricula to allow best-fit generation instead of empty arrays.
    if (type === 'section-standards' && detectCurriculumFamily(stateCurriculum || framework, region) !== 'OTHER') {
      try {
        // Resolve model with allowlist guard
        let model: string = typeof reqModel === 'string' && reqModel.trim() ? String(reqModel).trim() : DEFAULT_MODEL
        const isAllowed = (m: string) => (ALLOWED_MODELS as readonly string[]).includes(m)
        if (!isAllowed(model) || /^gemini\-/i.test(model)) {
          model = DEFAULT_MODEL
        }

        const familySS = detectCurriculumFamily(stateCurriculum || framework, region)
        const codeFamilyRules = (() => {
          switch (familySS) {
            case 'NGSS':
              return `For NGSS/NGSS-aligned adoptions, USE DCI-style codes like "HS-LS1.A", "MS-PS2.B", "3-ESS2.C" (with the hyphen). Do NOT output TEKS/SOL codes.`
            case 'TEKS':
              return `For Texas TEKS, USE codes like "5.7A" (grade.strandLetter) and for high school courses allow prefixes like "BIO.6B". Do NOT output NGSS/SOL codes.`
            case 'SOL':
              return `For Virginia SOL, USE codes like "6.2a" or high school forms like "BIO.1.a". Do NOT output NGSS/TEKS codes.`
            default:
              return `Use only the official local format for the selected curriculum. Do NOT guess NGSS/TEKS/SOL if not applicable.`
          }
        })()

        // 1) Ask for the COMPLETE set of official sub-standard CODES for the unit
        const codesPrompt = `${sharedRules}
TASK: List the complete set of official sub-standard CODES that belong inside the section/unit "${section}" for ${subject} at ${grade} under the selected curriculum.

INPUTS
- Subject: "${subject}"
- Framework/Standard: "${framework}"
- Country: "${country}"
${region ? `- Region/State: "${region}"` : ''}
- Curriculum Group (State/Region): "${stateCurriculum || ''}"
- Grade Level: "${grade}"
- Section Name: "${section}"
${context ? `ADDITIONAL CONTEXT\n${context}` : ''}

REQUIREMENTS
- Return ONLY JSON with this exact shape: { "codes": string[], "total": number }.
- "codes" must contain ALL official sub-standard codes for THIS unit and grade. No extras from other units.
- STRICT UNIT BOUNDARY: If you are not 100% certain, return { "codes": [], "total": 0 }.
- CODE FAMILY: ${codeFamilyRules}
- CODE FORMAT RULES: Preserve official punctuation (hyphens/dots). Do NOT invent formats.
`

        const codesResp = await client.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: 'You are an expert curriculum designer. Return ONLY valid JSON that matches the requested shape. No text outside JSON.' },
            { role: 'user', content: codesPrompt }
          ],
          response_format: { type: 'json_object' }
        })

        let codesObj: any = null
        try {
          const c = codesResp.choices?.[0]?.message?.content || ''
          codesObj = JSON.parse(c)
        } catch {}

        const rawCodes: string[] = Array.isArray(codesObj?.codes) ? codesObj.codes : []
        const family = familySS
        const allowedCodes = rawCodes
          .map((x: string) => normalizeStandardCode(x))
          .filter((x: string) => isCodeAllowedByFamily(x, family, subject))
        let uniqueCodes = Array.from(new Set(allowedCodes))

        // NGSS safeguard: if too few codes were returned (common when model mixes DCI vs PE),
        // request Performance Expectation style codes explicitly and merge.
        if (family === 'NGSS' && uniqueCodes.length < 4) {
          try {
            const pePrompt = `${sharedRules}
TASK: List the complete set of NGSS Performance Expectation CODES (e.g., MS-LS1-1, HS-PS2-2) that belong INSIDE the section/unit "${section}" for ${subject} at ${grade}.

INPUTS
- Subject: "${subject}"
- Framework/Standard: "${framework}"
- Country: "${country}"
${region ? `- Region/State: "${region}"` : ''}
- Curriculum Group (State/Region): "${stateCurriculum || ''}"
- Grade Level: "${grade}"
- Section Name: "${section}"
${context ? `ADDITIONAL CONTEXT\n${context}` : ''}

REQUIREMENTS
- Return ONLY JSON with this exact shape: { "codes": string[], "total": number }.
- Include ONLY NGSS PE codes for THIS specific unit/section and grade band.
- Preserve hyphens; do NOT convert to DCI dot notation.
`
            const peResp = await client.chat.completions.create({
              model,
              messages: [
                { role: 'system', content: 'You are an expert curriculum designer. Return ONLY valid JSON that matches the requested shape. No text outside JSON.' },
                { role: 'user', content: pePrompt }
              ],
              response_format: { type: 'json_object' }
            })
            let peObj: any = null
            try { peObj = JSON.parse(peResp.choices?.[0]?.message?.content || '') } catch {}
            const peRaw: string[] = Array.isArray(peObj?.codes) ? peObj.codes : []
            const peAllowed = peRaw.map((x) => normalizeStandardCode(x)).filter((x) => isCodeAllowedByFamily(x, family, subject))
            uniqueCodes = Array.from(new Set([...uniqueCodes, ...peAllowed]))
          } catch {}
        }

        if (uniqueCodes.length > 0) {
          // 2) Request details for the specific codes, ensuring one item per code
          const detailsPrompt = `${sharedRules}
TASK: For the provided sub-standard codes, return details belonging INSIDE the section/unit "${section}" for ${subject} at ${grade}.

INPUTS
- Subject: "${subject}"
- Framework/Standard: "${framework}"
- Country: "${country}"
${region ? `- Region/State: "${region}"` : ''}
- Curriculum Group (State/Region): "${stateCurriculum || ''}"
- Grade Level: "${grade}"
- Section Name: "${section}"
- CODES: ${JSON.stringify(uniqueCodes)}
${context ? `ADDITIONAL CONTEXT\n${context}` : ''}

REQUIREMENTS
- Return ONLY JSON with key "items": an array of { code: string, name: string, description: string }.
- Include exactly ONE item per provided code; names concise; descriptions 1–2 sentences.
- STRICT UNIT BOUNDARY: Content must fit this unit; if a provided code does not belong, OMIT it.
- CODE FAMILY: ${codeFamilyRules}
- CODE FORMAT RULES: Preserve official punctuation (hyphens/dots). Do NOT alter the provided codes.
`
          const detResp = await client.chat.completions.create({
            model,
            messages: [
              { role: 'system', content: 'You are an expert curriculum designer. Return ONLY valid JSON that matches the requested shape. No text outside JSON.' },
              { role: 'user', content: detailsPrompt }
            ],
            response_format: { type: 'json_object' }
          })

          let detObj: any = null
          try {
            const d = detResp.choices?.[0]?.message?.content || ''
            detObj = JSON.parse(d)
          } catch {}

          let items: any[] = Array.isArray(detObj?.items) ? detObj.items : []
          // Filter, normalize, and map
          const byCode = new Map<string, any>()
          for (const it of items) {
            const code = normalizeStandardCode(it?.code || it?.standard_code || '')
            if (!code) continue
            if (!isCodeAllowedByFamily(code, family, subject)) continue
            if (!uniqueCodes.includes(code)) continue
            byCode.set(code, {
              code,
              name: String(it?.name || it?.title || `Sub-standard ${code}`).trim(),
              title: String(it?.name || it?.title || `Sub-standard ${code}`).trim(),
              description: String(it?.description || '').trim(),
            })
          }

          // Attempt a single retry for any missing codes
          const missing = uniqueCodes.filter(c => !byCode.has(c))
          if (missing.length > 0) {
            const retryPrompt = `${sharedRules}
TASK: Provide details ONLY for these missing sub-standard codes for the unit "${section}": ${JSON.stringify(missing)}
Return: { items: [ { code: string, name: string, description: string } ] }
Rules: One item per code; keep within unit; ${codeFamilyRules}`
            const retry = await client.chat.completions.create({
              model,
              messages: [
                { role: 'system', content: 'Return ONLY valid JSON. No text outside JSON.' },
                { role: 'user', content: retryPrompt }
              ],
              response_format: { type: 'json_object' }
            })
            try {
              const r = retry.choices?.[0]?.message?.content || ''
              const rObj = JSON.parse(r)
              const rItems: any[] = Array.isArray(rObj?.items) ? rObj.items : []
              for (const it of rItems) {
                const code = normalizeStandardCode(it?.code || it?.standard_code || '')
                if (!code) continue
                if (!isCodeAllowedByFamily(code, family, subject)) continue
                if (!uniqueCodes.includes(code)) continue
                if (!byCode.has(code)) {
                  byCode.set(code, {
                    code,
                    name: String(it?.name || it?.title || `Sub-standard ${code}`).trim(),
                    title: String(it?.name || it?.title || `Sub-standard ${code}`).trim(),
                    description: String(it?.description || '').trim(),
                  })
                }
              }
            } catch {}
          }

          // Finalize in the original order of uniqueCodes
          const finalItems = uniqueCodes
            .filter(c => byCode.has(c))
            .map(c => byCode.get(c))

          return res.status(200).json({ success: true, items: finalItems, count: finalItems.length })
        }
        // If no codes returned, fall through to the generic single-shot path below
      } catch (e) {
        console.warn('section-standards exhaustive flow failed; falling back to single-call:', e)
      }
    }

    const selectedPromptId = (type === 'lesson-discovery' || type === 'lesson-generation-by-strand' || type === 'lessons' || type === 'lessons-by-substandards') 
      ? LESSON_PROMPT_ID 
      : PROMPT_ID

    // Resolve effective model from request; default and validate against allowed list, and coerce any unsupported/gemini-like to default
    let model: string = typeof reqModel === 'string' && reqModel.trim() ? String(reqModel).trim() : DEFAULT_MODEL
    const isAllowed = (m: string) => (ALLOWED_MODELS as readonly string[]).includes(m)
    if (!isAllowed(model) || /^gemini\-/i.test(model)) {
      model = DEFAULT_MODEL
    }

    // Enforce JSON object format where prompts ask for object output
    const needsJsonObject = (
      type === 'lesson-discovery' ||
      type === 'grades' ||
      type === 'state-standard' ||
      type === 'state-curricula'
    )
    // Some lightweight models only support default temperature; omit temperature for those.
    const modelSupportsTemperature = (m: string) => !/gpt-5-(mini|nano)-/i.test(m)
    const desiredTemp = (type === 'frameworks' || type === 'section-standards') ? 0.2 : 0.4
    const baseMessages = [
      {
        role: 'system' as const,
        content: 'You are an expert curriculum designer. Return ONLY valid JSON that matches the requested shape. Do not include any text outside JSON.'
      },
      {
        role: 'user' as const,
        content: userPrompt
      }
    ]

    const response = await client.chat.completions.create({
      model,
      messages: baseMessages,
      ...(modelSupportsTemperature(model) ? { temperature: desiredTemp } : {}),
      ...(needsJsonObject ? { response_format: { type: 'json_object' as const } } : {}),
    })

    let responseText = ''
    if (response?.choices?.[0]?.message?.content) {
      responseText = response.choices[0].message.content
    }

    if (!responseText) {
      const meta = {
        finish_reason: response?.choices?.[0]?.finish_reason,
        usage: response?.usage || undefined,
      }
      console.error('Empty AI response meta:', meta)
      return res.status(500).json({
        error: 'AI response was empty or unreadable. Please try again.',
      })
    }

    let parsedData = null
    try {
      // Strip common code fences if present
      let cleaned = String(responseText || '').trim()
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '')
        if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)
      }
      const jsonMatch = cleaned.match(/\[[\s\S]*\]|\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
      } else {
        parsedData = JSON.parse(cleaned)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText)
      return res.status(500).json({
        error: 'Failed to parse AI response. Please try again.',
        details: String(parseError)
      })
    }

    if (type === 'lesson-discovery') {
      if (typeof parsedData === 'object' && parsedData !== null) {
        return res.status(200).json({
          success: true,
          items: [parsedData],
          count: 1
        })
      } else {
        return res.status(500).json({ error: 'AI did not return a valid discovery object' })
      }
    }

    // Special handling for 'frameworks' when a specific framework is selected: try a strands/domains fallback if empty
    if (type === 'frameworks' && framework) {
      let items = ensureArray(parsedData) || []
      if (!Array.isArray(items)) items = []
      // If nothing returned, try a fallback prompt asking for official strands/domains/clusters for this grade
      if (items.length === 0) {
        const fallbackPrompt = `${sharedRules}
TASK: When named units/sections are not explicitly published for this framework, return the official strands/domains/clusters for the grade as the sections.

INPUTS
- Subject: "${subject}"
- Framework/Standard: "${framework}"
- Country: "${country}"
${region ? `- Region/State: "${region}"` : ''}
${grade ? `- Grade Level: "${grade}"` : ''}
${stateStandardName ? `- Official/Reference Standard Name: "${stateStandardName}"` : ''}
${context ? `ADDITIONAL CONTEXT\n${context}` : ''}

REQUIREMENTS
- Return ONLY official strands/domains/clusters for this framework and grade (no invented items).
- If official strands/domains do not exist for this grade, return an empty list.
- Output object shape ONLY: { "items": [ { "name": string, "description": string } ] }
`
        try {
          const fb = await client.chat.completions.create({
            model,
            messages: [
              { role: 'system', content: 'You are an expert curriculum designer. Return ONLY valid JSON that matches the requested shape. No text outside JSON.' },
              { role: 'user', content: fallbackPrompt }
            ],
            ...(modelSupportsTemperature(model) ? { temperature: 0.2 } : {}),
            response_format: { type: 'json_object' }
          })
          let fbObj: any = null
          try {
            const txt = fb.choices?.[0]?.message?.content || ''
            fbObj = JSON.parse(txt)
          } catch {}
          const arr = ensureArray(fbObj) || []
          items = Array.isArray(arr) ? arr : []
        } catch (e) {
          // swallow and keep items as []
        }
      }

      // Normalize and return
      items = items.map((item: any, index: number) => ({
        name: item.title || item.name || `Item ${index + 1}`,
        title: item.title,
        description: item.description || '',
      }))
      return res.status(200).json({ success: true, items, count: items.length })
    }

    if (type === 'lessons-by-substandards') {
      let items = ensureArray(parsedData)
      if (!items) {
        return res.status(500).json({ error: 'AI did not return an array of lessons' })
      }

      items = items.map((item: any, index: number) => {
        const std = normalizeStandardCode(item.standard_code || item.code || '')
        const lessonCode = item.lesson_code || (std ? `${std}-L${String(index + 1).padStart(2, '0')}` : `L${String(index + 1).padStart(2, '0')}`)
        return {
          name: item.title || item.name || `Lesson ${index + 1}`,
          title: item.title || item.name || `Lesson ${index + 1}`,
          description: item.description || '',
          standard_code: std,
          lesson_code: lessonCode
        }
      })

      // Enforce correct standard codes distribution across provided sub-standards
      try {
        const { subStandards: reqSubs = [], lessonsPerStandard: reqLps = 5 } = req.body || {}
        // Determine curriculum family to validate codes
        const family = detectCurriculumFamily(stateCurriculum || framework, region)
        let normalizedSubCodes: string[] = Array.isArray(reqSubs)
          ? reqSubs
              .map((s: any) => normalizeStandardCode(s?.code || s?.standard_code || s?.title || s?.name || String(s || '')))
              .filter((c: string) => isCodeAllowedByFamily(c, family, subject))
          : []
        if (normalizedSubCodes.length > 0) {
          const per = Math.max(1, Number(reqLps) || 5)
          items = items.map((it: any, i: number) => {
            const preferred = normalizedSubCodes[i % normalizedSubCodes.length]
            const normalizedCurrent = normalizeStandardCode(it.standard_code || '')
            const currentAllowed = isCodeAllowedByFamily(normalizedCurrent, family, subject)
            const std = (normalizedSubCodes.includes(normalizedCurrent) && currentAllowed) ? normalizedCurrent : preferred
            const seqWithinStd = (Math.floor(i / normalizedSubCodes.length) % per) + 1
            const lesson_code = `${std}-L${String(seqWithinStd).padStart(2, '0')}`
            return { ...it, standard_code: std, lesson_code }
          })
        }
      } catch (e) {
        // If enforcement fails, proceed with AI-provided values
        console.warn('Standard enforcement skipped:', e)
      }
      // Deduct tokens equal to the number of lessons generated
      if (userId && supabaseAdmin) {
        try {
          const current = await getUserTokens(userId)
          await setUserTokens(userId, current - items.length)
        } catch (e) {
          console.error('Token deduction failed (substandards):', e)
        }
      }
      return res.status(200).json({
        success: true,
        items,
        count: items.length
      })
    }

    if (type === 'section-standards') {
      const family = detectCurriculumFamily(stateCurriculum || framework, region)
      let itemsRaw = ensureArray(parsedData)

      // If parsing failed AND family is OTHER, attempt fallback instead of hard error
      if (!itemsRaw && family !== 'OTHER') {
        return res.status(500).json({ error: 'AI did not return an array of sub-standards' })
      }

      let items: any[] = Array.isArray(itemsRaw) ? itemsRaw : []
      items = items
        .map((item: any, index: number) => {
          const codeRaw = item.code || item.standard_code || `S${index + 1}`
          const code = normalizeStandardCode(codeRaw)
          const nm = item.name || item.title || `Sub-standard ${index + 1}`
          const desc = item.description || ''
          const subj = String(subject || '')
          const allowed = isCodeAllowedByFamily(code, family, subj)
          if (!allowed) return null
          return { code, name: nm, title: item.name || item.title || nm, description: desc }
        })
        .filter(Boolean)

      const attemptFallback = async () => {
        try {
          const fallbackPrompt = `${sharedRules}\nTASK: Provide 3–6 best-fit sub-standards inside the section "${section}" for ${subject} at ${grade}.\nCURRICULUM CONTEXT: ${stateCurriculum || framework || country || ''}\n\nRULES\n- Return ONLY JSON: { "items": [ { "code": string, "name": string, "description": string } ] }.\n- Use locally plausible short codes. If official codes are unknown, you MAY use simple teacher codes like SEC1, SEC2, SEC3.\n- Each name concise (≤ 7 words). Description 1 sentence.\n- Avoid cross-unit references.\n- Avoid returning an empty list unless absolutely no reasonable sub-standards can be inferred.\nOUTPUT EXAMPLE\n{ "items": [ { "code": "SEC1", "name": "Matter and Its Properties", "description": "Explore states of matter and observable physical changes." } ] }`
          const fbResp = await client.chat.completions.create({
            model,
            messages: [
              { role: 'system', content: 'You are an expert curriculum designer. Return ONLY valid JSON.' },
              { role: 'user', content: fallbackPrompt }
            ],
            response_format: { type: 'json_object' }
          })
          let fbObj: any = null
          try { fbObj = JSON.parse(fbResp.choices?.[0]?.message?.content || '') } catch {}
          const fbItemsArr: any[] = Array.isArray(fbObj?.items) ? fbObj.items : []
          const mapped = fbItemsArr.map((it: any, idx: number) => {
            const code = normalizeStandardCode(it.code || it.standard_code || `SEC${idx + 1}`)
            const nm = it.name || it.title || `Sub-standard ${idx + 1}`
            const desc = it.description || ''
            return { code: code || `SEC${idx + 1}`, name: nm, title: nm, description: desc }
          }).filter((x: any) => x.code)
          if (mapped.length > 0) items = mapped
        } catch (e) {
          // swallow fallback errors
        }
      }

      if ((items.length === 0) && family === 'OTHER') {
        await attemptFallback()
        if (items.length === 0) {
          // Final placeholder guarantee (never return empty for OTHER)
          items = [1,2,3].map((n) => ({
            code: `SEC${n}`,
            name: n === 1 ? 'Foundational Concept' : n === 2 ? 'Core Skill Development' : 'Applied Practice',
            title: n === 1 ? 'Foundational Concept' : n === 2 ? 'Core Skill Development' : 'Applied Practice',
            description: 'Locally inferred sub-standard placeholder to support lesson planning where official granular codes are unavailable.'
          }))
        }
      }

      return res.status(200).json({
        success: true,
        items,
        count: items.length
      })
    }

    if (type === 'lesson-generation-by-strand') {
      let items = ensureArray(parsedData)
      if (!items) {
        return res.status(500).json({ error: 'AI did not return an array of lessons' })
      }

      items = items.map((item, index) => ({
        name: item.title || item.name || `Lesson ${index + 1}`,
        title: item.title,
        description: item.description || '',
      }))
      // Deduct tokens equal to the number of lessons generated
      if (userId && supabaseAdmin) {
        try {
          const current = await getUserTokens(userId)
          await setUserTokens(userId, current - items.length)
        } catch (e) {
          console.error('Token deduction failed (strand):', e)
        }
      }
      return res.status(200).json({
        success: true,
        items,
        count: items.length
      })
    }

    // Special handling for 'grades' when the model returns categorized object
    if (type === 'grades') {
      if (Array.isArray(parsedData)) {
        // Legacy flat array; normalize like default below
        let items = parsedData.map((item: any, index: number) => ({
          name: item.title || item.name || `Item ${index + 1}`,
          title: item.title,
          description: item.description || '',
        }))
        return res.status(200).json({ success: true, items, count: items.length })
      }

      if (typeof parsedData === 'object' && parsedData) {
        const isAdult = (n: any) => String(n?.name || n).toLowerCase().includes('adult')
        const elementary = (parsedData.elementary?.grades || [])
        const middle = (parsedData.middle_school?.grades || [])
        // Filter out Adult education from high school
        const high = (parsedData.high_school?.grades || []).filter((g: any) => !isAdult(g))
        const selectAll = parsedData.select_all_labels || {
          elementary: 'All Elementary',
          middle_school: 'All Middle School',
          high_school: 'All High School'
        }

        const toItems = (arr: any[], category: string) => arr.map((g: any, idx: number) => ({
          name: g.name || `Grade ${idx + 1}`,
          title: g.title,
          description: g.description || '',
          category,
        }))

        let items = [
          ...toItems(elementary, 'Elementary'),
          ...toItems(middle, 'Middle school'),
          ...toItems(high, 'High school'),
        ]

        // Return items and include the categorized structure in details for optional UI usage
        return res.status(200).json({
          success: true,
          items,
          count: items.length,
          details: JSON.stringify({
            categories: {
              elementary: parsedData.elementary,
              middle_school: parsedData.middle_school,
              high_school: {
                ...(parsedData.high_school || {}),
                grades: high
              },
            },
            select_all_labels: selectAll
          })
        })
      }

      return res.status(500).json({ error: 'AI did not return valid grades data' })
    }

    if (type === 'state-curricula') {
      let items = ensureArray(parsedData)
      if (!items) {
        return res.status(500).json({ error: 'AI did not return an array of state curricula' })
      }

      // Sort by number of states descending, keep "No special curriculum" last if present
      items = items.slice().sort((a, b) => {
        const aNo = String(a.curriculum_name || '').toLowerCase().includes('no special curriculum')
        const bNo = String(b.curriculum_name || '').toLowerCase().includes('no special curriculum')
        if (aNo && !bNo) return 1
        if (!aNo && bNo) return -1
        const aLen = Array.isArray(a.states) ? a.states.length : 0
        const bLen = Array.isArray(b.states) ? b.states.length : 0
        return bLen - aLen
      })

      // items already have curriculum_name, states, and description
      return res.status(200).json({
        success: true,
        items,
        count: items.length
      })
    }

    if (type === 'state-standard') {
      let obj = parsedData
      if (Array.isArray(obj)) {
        obj = obj[0]
      }
      if (typeof obj !== 'object' || obj === null) {
        return res.status(500).json({ error: 'AI did not return a valid state standard object' })
      }
      // Normalize minimal fields
      const item = {
        region: obj.region || region || '',
        standard_name: obj.standard_name || obj.name || 'No special curriculum',
        alternate_names: Array.isArray(obj.alternate_names) ? obj.alternate_names : [],
        coverage_description: obj.coverage_description || obj.description || '',
        notable_features: Array.isArray(obj.notable_features) ? obj.notable_features : [],
        reference_note: obj.reference_note || ''
      }
      return res.status(200).json({ success: true, items: [item], count: 1 })
    }

    // Type-specific handling: subjects must include at least one Science-related item (for supported countries)
    if (type === 'subjects') {
      let items = ensureArray(parsedData)
      if (!items) {
        return res.status(500).json({ error: 'AI did not return an array of items' })
      }

      // Normalize items
      items = items.map((item, index) => ({
        name: item.title || item.name || `Item ${index + 1}`,
        title: item.title,
        description: item.description || '',
      }))

      const countryName = String(country || '').toLowerCase()
      const countryLikelyHasScience = (
        countryName.includes('usa') ||
        countryName.includes('united states') ||
        countryName.includes('canada') ||
        countryName.includes('australia') ||
        countryName.includes('uk') ||
        countryName.includes('united kingdom') ||
        countryName.includes('england') ||
        countryName.includes('scotland') ||
        countryName.includes('wales') ||
        countryName.includes('northern ireland')
      )

      const scienceKeywords = [
        'science', 'general science', 'physical science', 'life science', 'earth science', 'space science',
        'biology', 'chemistry', 'physics', 'environmental science', 'stem', 'natural science', 'natural sciences'
      ]

      const hasScience = (arr: any[]) => arr.some((it: any) => {
        const n = String(it?.name || it?.title || '').toLowerCase()
        return scienceKeywords.some((kw) => n.includes(kw))
      })

      // Enforce presence of a science-related subject when applicable
      if (countryLikelyHasScience && !hasScience(items)) {
        const scienceItem = {
          name: 'Science',
          title: 'Science',
          description: 'General science across life, physical, and Earth/space sciences for Grades 1–12; strong fit for worksheets, labs, and Google Forms.',
        }

        // If subjectsCount was specified and we are at/over the limit, replace the last non-science item
        const limit = (typeof subjectsCount === 'number' && subjectsCount > 0) ? Math.floor(subjectsCount) : undefined
        if (limit && items.length >= limit) {
          // Avoid duplicates and keep array length equal to limit
          const deduped = items.filter((it: any) => String(it.name).toLowerCase() !== 'science')
          // Drop the last item to make room, if needed
          if (deduped.length >= limit) deduped.pop()
          items = [scienceItem, ...deduped]
        } else {
          // Just prepend science
          items = [scienceItem, ...items]
        }
      }

      return res.status(200).json({ success: true, items, count: items.length })
    }

    // Default normalization for other types
    let items = ensureArray(parsedData)
    if (!items) {
      return res.status(500).json({ error: 'AI did not return an array of items' })
    }

    items = items.map((item, index) => ({
      name: item.title || item.name || `Item ${index + 1}`,
      title: item.title,
      description: item.description || '',
    }))

    return res.status(200).json({
      success: true,
      items,
      count: items.length
    })

  } catch (error) {
    // Surface useful provider error details to the client for debugging
    const errAny: any = error as any
    const providerMsg = errAny?.error?.message || errAny?.message || String(error)
    console.error('API Error:', providerMsg)
    return res.status(500).json({
      error: providerMsg
    })
  }
}
