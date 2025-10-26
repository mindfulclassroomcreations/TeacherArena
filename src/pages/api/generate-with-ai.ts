import type { NextApiRequest, NextApiResponse } from 'next'
import { OpenAI } from 'openai'

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
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
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
    const { type, country, subject, framework, grade, context, totalLessonCount } = req.body

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

  let userPrompt = ''

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
      case 'subjects':
        userPrompt = `${sharedRules}
TASK: Generate educational subjects for product research on the TeachersPayTeachers (TPT) marketplace.
MARKET: ${country} schools; Grades 1–12 (primary to secondary).
PRODUCT TYPES: Worksheets, Task Cards, Google Forms, and similar printable/Google resources.
CONTEXT: ${context || 'General focus on high-demand classroom subjects suitable for printable and Google resources.'}

REQUIREMENTS
- Return 12–20 subjects commonly taught across Grades 1–12 in ${country}, spanning core and high‑demand elective areas.
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
        userPrompt = `${sharedRules}
TASK: Generate curriculum frameworks (or unit clusters) for:
- Subject: "${subject}"
- Country: "${country}"
${context ? `ADDITIONAL CONTEXT\n${context}` : ''}

REQUIREMENTS
- Return 4–10 items representing frameworks, strands, or unit clusters commonly used for this subject in ${country}.
- Each item must include: name (string), description (string).
- Names should be short and recognizable; descriptions 1–2 sentences.

OUTPUT
[
  { "name": "Number and Operations", "description": "Numeracy foundations including place value, operations with whole numbers, and fractions." }
]
`
        break

      case 'grades':
        userPrompt = `${sharedRules}
TASK: Generate individual grade levels for:
- Subject: "${subject}"
- Framework: "${framework}"
- Country: "${country}"
${context ? `ADDITIONAL CONTEXT\n${context}` : ''}

REQUIREMENTS
- Return 8–12 INDIVIDUAL grades ONLY (e.g., "Kindergarten" and "Grade 1", "Grade 2", etc.) based on ${country} conventions.
- No grade ranges (avoid "Grades 3–5").
- Each item must include: name (string), description (string).

OUTPUT
[
  { "name": "Grade 1", "description": "First year of primary school with foundational literacy and numeracy." }
]
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

        userPrompt = `${sharedRules}
TASK: For the subject "${subject}" in ${country}, list curriculum standards groupings and ensure COMPLETE region coverage.

${requiredRegionsText ? `${requiredRegionsText}\n` : ''}

REQUIREMENTS
- Consider the selected subject when grouping (e.g., Math, Science, ELA variants per region).
- Group regions that share the same curriculum into a single object.
- Each object must include: curriculum_name (string), states (string[]), description (string).
- Include ALL regions for ${country}. If a region has no distinct curriculum for this subject, include it under a grouping with curriculum_name like "No special curriculum (Subject)" and a brief description.
- SORT ORDER: Sort the array by the number of regions in each grouping (states.length) DESC so the most common curricula appear first. Place the "No special curriculum" grouping last.
- Avoid duplicates: the union of all "states" arrays MUST cover each required region exactly once.
- Provide 3–12 groupings depending on ${country}.

OUTPUT
[
  {
    "curriculum_name": "Common Core State Standards (CCSS)",
    "states": ["California", "New York"],
    "description": "Discipline-specific learning standards adopted or adapted by multiple states."
  }
]
`
        break

      default:
        return res.status(400).json({ error: 'Invalid type' })
    }

    const selectedPromptId = (type === 'lesson-discovery' || type === 'lesson-generation-by-strand' || type === 'lessons') 
      ? LESSON_PROMPT_ID 
      : PROMPT_ID

    // Tune temperature per type: keep structured outputs lower
    const temperature = (type === 'lesson-generation-by-strand') ? 0.7 : 0.3

  // Select model per step (subjects and state-curricula use gpt-4.1-nano as requested)
  const model = (type === 'subjects' || type === 'state-curricula') ? 'gpt-4.1-nano' : 'gpt-4'

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert curriculum designer. Return ONLY valid JSON that matches the requested shape. Do not include any text outside JSON.'
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature,
      max_tokens: 2000,
    })

    let responseText = ''
    if (response?.choices?.[0]?.message?.content) {
      responseText = response.choices[0].message.content
    }

    if (!responseText) {
      return res.status(500).json({
        error: 'AI response was empty or unreadable. Please try again.',
      })
    }

    let parsedData = null
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]|\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
      } else {
        parsedData = JSON.parse(responseText)
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

    if (type === 'lesson-generation-by-strand') {
      let items = parsedData
      if (!Array.isArray(items)) {
        return res.status(500).json({ error: 'AI did not return an array of lessons' })
      }

      items = items.map((item, index) => ({
        name: item.title || item.name || `Lesson ${index + 1}`,
        title: item.title,
        description: item.description || '',
      }))

      return res.status(200).json({
        success: true,
        items,
        count: items.length
      })
    }

    if (type === 'state-curricula') {
      let items = parsedData
      if (!Array.isArray(items)) {
        return res.status(500).json({ error: 'AI did not return an array of state curricula' })
      }

      // items already have curriculum_name, states, and description
      return res.status(200).json({
        success: true,
        items,
        count: items.length
      })
    }

    let items = parsedData
    if (!Array.isArray(items)) {
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
    console.error('API Error:', error)
    return res.status(500).json({
      error: 'Failed to generate content',
      details: String(error)
    })
  }
}
