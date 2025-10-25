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

    switch (type) {
      case 'subjects':
        userPrompt = `Generate educational subjects relevant to ${country} curriculum standards based on the following context: ${context || 'General educational subjects'}

Generate 6-10 relevant subjects that are commonly taught in ${country} schools and span different disciplines.
These should align with ${country}'s national curriculum standards.
Respond with ONLY a JSON array of objects with "name" and "description" fields.`
        break

      case 'frameworks':
        userPrompt = `Generate educational frameworks for the subject: "${subject}" relevant to ${country} curriculum.
${context || ''}
Respond with ONLY a JSON array of objects with "name" and "description" fields.`
        break

      case 'grades':
        userPrompt = `Generate individual grade levels for:
- Subject: "${subject}"
- Framework: "${framework}"
- Country: "${country}"
${context || ''}

IMPORTANT: Generate INDIVIDUAL grades ONLY (e.g., "Grade 1", "Grade 2", "Grade 3", etc.) as used in ${country}.
Generate 8-12 individual grades appropriate for ${country}.
Respond with ONLY a JSON array of objects with "name" and "description" fields.`
        break

      case 'lesson-discovery':
        const finalTotalLessonCount = totalLessonCount || 45
        
        userPrompt = `ROLE: You are a curriculum framework analyst.

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
}`
        break

      case 'lesson-generation-by-strand':
        const { strandCode, strandName, targetLessonCount, keyTopics, performanceExpectations } = req.body
        
        userPrompt = `ROLE: You are an expert lesson plan creator.

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
- Align with the performance expectations provided`
        break

      case 'national-strands':
        userPrompt = `List the major national curriculum strands/standards for ${subject} in ${country}.
These are the main domains or topics that form the basis of ${country}'s national curriculum framework for ${subject}.

Provide 5-8 main strands/domains.
Respond with ONLY a JSON array of objects with "name" and "description" fields.
Each name should be the strand name, and description should explain what topics this strand covers.`
        break

      case 'state-curricula':
        userPrompt = `For the subject "${subject}" in ${country}, provide information about state/provincial/regional curriculum standards.
List the major states or provinces and their curriculum names (e.g., Common Core, state-specific standards, etc.).
If multiple states share the same curriculum, group them together.

Format the response as a JSON array where each object has:
- "curriculum_name": the name of the curriculum standard (e.g., "Common Core", "Texas TEKS", etc.)
- "states": an array of state/province names that use this curriculum
- "description": brief description of what this curriculum covers

Respond with ONLY a JSON array of such objects.`
        break

      default:
        return res.status(400).json({ error: 'Invalid type' })
    }

    const selectedPromptId = (type === 'lesson-discovery' || type === 'lesson-generation-by-strand' || type === 'lessons') 
      ? LESSON_PROMPT_ID 
      : PROMPT_ID

    const response = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert curriculum designer. Generate responses in valid JSON format only.'
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.7,
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

    if (type === 'national-strands') {
      let items = parsedData
      if (!Array.isArray(items)) {
        return res.status(500).json({ error: 'AI did not return an array of strands' })
      }

      items = items.map((item, index) => ({
        name: item.name || `Strand ${index + 1}`,
        title: item.name,
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
