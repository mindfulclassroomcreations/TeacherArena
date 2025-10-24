// pages/api/generate-with-ai.js
import { OpenAI } from 'openai'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// OpenAI Prompt IDs created with custom system instructions
const PROMPT_ID = 'pmpt_68fa404d58b08190a2e2c32770b4f59806857d16f04d704a'
const LESSON_PROMPT_ID = 'pmpt_68fafd15edc08197806351f71c1b39cb086c40b5fe347771'
const PROMPT_VERSION = '2'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { type, subject, framework, grade, context, totalLessonCount } = req.body

    if (!type) {
      return res.status(400).json({ error: 'Missing required field: type' })
    }

    // For subjects generation, context is required; for others, subject is required
    if (type === 'subjects' && !context) {
      return res.status(400).json({ error: 'Missing required field: context (for subject generation)' })
    }

    if (type !== 'subjects' && !subject) {
      return res.status(400).json({ error: 'Missing required field: subject' })
    }

    // Validate environment variable
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' })
    }

    let userPrompt = ''

    switch (type) {
      case 'subjects':
        userPrompt = `Generate educational subjects based on the following context: ${context}

Generate 5-8 relevant subjects that span different disciplines (e.g., Math, Science, English, History, Art, etc.).
Make sure the subjects are appropriate for the context provided.

Respond with ONLY a JSON array of objects with "name" and "description" fields.`
        break

      case 'frameworks':
        userPrompt = `Generate educational frameworks for the subject: "${subject}".
        
${context || ''}

Respond with ONLY a JSON array of objects with "name" and "description" fields.`
        break

      case 'grades':
        userPrompt = `Generate individual grade levels for:
- Subject: "${subject}"
- Framework: "${framework}"

${context || ''}

IMPORTANT: Generate INDIVIDUAL grades ONLY (e.g., "Grade 1", "Grade 2", "Grade 3", etc.), NOT grade ranges (e.g., do NOT use "K-2", "3-5", "6-8").
Generate 8-12 individual grades that are appropriate for this subject and framework.

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
Analyze this framework and identify all major strands/domains/clusters for this grade level.
For each strand, provide:
1. Strand code (e.g., "LS1", "ESS2", "PS1")
2. Strand name (full descriptive name)
3. Number of performance expectations or standards
4. Key topics covered (2-4 main topics)
5. Recommended target lessons for this strand

COVERAGE REQUIREMENTS
• Ensure you identify ALL major content areas/strands in this framework for this grade
• Think about the breadth and depth of content standards
• Distribute the target lesson count (${finalTotalLessonCount}) proportionally across strands
• Ensure NO overlapping strands
• TARGET: Total lessons across ALL strands = EXACTLY ${finalTotalLessonCount}

VALIDATION
- Verify all major content strands are included
- Verify target lesson counts sum to EXACTLY ${finalTotalLessonCount} total lessons
- Ensure no overlapping strands
- Each strand should get 5-15 lessons (unless single-strand curriculum)

OUTPUT FORMAT
Respond with ONLY a JSON object:
{
  "framework_summary": "Brief overview of this framework for this grade",
  "major_parts": [
    {
      "strand_code": "string (e.g., LS1)",
      "strand_name": "string (full name)",
      "num_standards": number,
      "key_topics": ["topic1", "topic2", "topic3"],
      "target_lesson_count": number,
      "performance_expectations": ["CODE1", "CODE2", "CODE3"]
    },
    ...
  ],
  "total_lessons_planned": ${finalTotalLessonCount},
  "estimated_coverage": "percentage string (e.g., 95%)"
}

CRITICAL: The sum of all target_lesson_count values MUST equal ${finalTotalLessonCount}
No markdown, no comments, no extra keys—JSON object only.`
        break

      case 'lesson-generation-by-strand':
        const { strandCode, strandName, targetLessonCount, keyTopics, performanceExpectations } = req.body
        
        if (!strandCode || !targetLessonCount) {
          return res.status(400).json({ error: 'Missing required fields: strandCode, targetLessonCount' })
        }

        userPrompt = `ROLE: You are a standards-aligned curriculum lesson generator.

INPUTS
Subject: "${subject}"
Framework: "${framework}"
Grade Level: "${grade}"
Strand Code: "${strandCode}"
Strand Name: "${strandName}"
Performance Expectations: ${JSON.stringify(performanceExpectations || [])}
Key Topics: ${JSON.stringify(keyTopics || [])}
Target Lesson Count: ${targetLessonCount}
Optional notes: "${context || ''}"

GOAL
Generate EXACTLY ${targetLessonCount} distinct lessons that comprehensively cover this strand.
Align each lesson to one or more of the listed Performance Expectations.
Do NOT place any standard codes in the title or description; put the code ONLY in "performance_expectation".

COVERAGE REQUIREMENTS
• Prioritize one lesson per listed PE (1:1) before adding any additional lessons to reach the target count.
• Cover all Key Topics across the set without duplicating scope.
• Show progressive complexity from foundational → intermediate → advanced.
• Use framework-named exemplars/anchor phenomena and respect any assessment limits for the relevant PEs.

STYLE (strict, descriptive only)
• Register: expository, neutral, third-person, present tense.
• Absolutely avoid procedural/teacher phrasing: "students", "learners", "will", "investigate", "explore", "activity", "experiment", "demonstration", "worksheet", "lesson plan".
• No standards codes inside title or description.

WRITING RULES
• title: 1–4 words, Title Case, no colons, no codes. (e.g., "Molecules & Lattices", "Reaction Evidence")
• description: 60–90 words, purely descriptive (content summary), standards-faithful, passage-ready.
  – Include framework canonical exemplars/phenomena when applicable.
  – Keep to grade-appropriate scope.

VALIDATION CHECKLIST (self-check before returning)
1) Exactly ${targetLessonCount} lessons; all distinct; progressive complexity is evident.
2) Each lesson maps to ≥1 code from Performance Expectations (code goes ONLY in "performance_expectation").
3) All Key Topics are represented across the set without duplicating scope.
4) Each description is 60–90 words, descriptive (no procedural language), and uses framework exemplars/limits where applicable.
5) Total description word count: ${targetLessonCount * 60}–${targetLessonCount * 90} words (${targetLessonCount} × 60–90).

OUTPUT FORMAT (strict)
Respond with ONLY a JSON array with EXACTLY ${targetLessonCount} objects:
[
  {
    "title": "string (1–4 words)",
    "description": "string (60–90 words)",
    "performance_expectation": "CODE"
  },
  ...
]

Rules:
• EXACTLY ${targetLessonCount} objects (not fewer, not more)
• JSON array only; no markdown, no comments, no extra keys or text`
        break

      case 'lessons':
        userPrompt = `ROLE: You are a standards-aligned curriculum generator.

INPUTS
- Subject: "${subject}"
- Framework: "${framework}"
- Grade Level: "${grade}"
- Optional notes: "${context || ''}"

GOAL
Generate lesson entries tightly aligned to the specified framework/grade.
When the framework publishes named exemplars/anchor phenomena/texts or assessment limits, USE those same examples/limits in the description.

COVERAGE
Generate 12-20 lessons that span all major strands/domains for this subject/grade in this framework.

WRITING RULES
- title: 1–4 words, Title Case, no codes, no colons. (e.g., "Molecules & Lattices", "Text Evidence")
- description: 55–90 words, instruction-free (no "students will..."), passage-ready, precise, and aligned to the framework/grade.
  • Include the framework's named exemplars/anchor phenomena/texts when available.
  • Respect any assessment limits the framework states.
  • Keep to grade-appropriate depth.

VALIDATION
1) Each description reflects the correct strand/code intent and includes canonical examples/phenomena/texts if published.
2) Each description honors grade-level scope and any stated assessment boundaries.
3) No procedural/teacher language; no activities; no metadata in output.

OUTPUT FORMAT
Respond with ONLY a JSON array of objects:
[
  { "title": "string", "description": "string" },
  ...
]

No markdown, no comments, no extra keys—JSON array only.`
        break

      default:
        return res.status(400).json({ error: 'Invalid type. Must be: subjects, frameworks, grades, lesson-discovery, lesson-generation-by-strand, or lessons' })
    }

    // Call OpenAI Responses API with prompt ID
    // Use LESSON_PROMPT_ID for lesson types, PROMPT_ID for others
    const selectedPromptId = (type === 'lesson-discovery' || type === 'lesson-generation-by-strand' || type === 'lessons') 
      ? LESSON_PROMPT_ID 
      : PROMPT_ID
    
    const response = await client.responses.create({
      prompt: {
        id: selectedPromptId,
      },
      input: userPrompt,
    })

    // Extract the response text from Responses API output structure
    let responseText = ''

    if (response?.output_text) {
      // output_text is already an aggregated string
      responseText = Array.isArray(response.output_text)
        ? response.output_text.join('\n')
        : response.output_text
    } else if (Array.isArray(response?.output)) {
      const messageBlock = response.output.find((block) => block.type === 'message')
      const content = messageBlock?.content || []
      const textChunks = content
        .filter((item) => item.type === 'output_text' && item.text)
        .map((item) => item.text)

      responseText = textChunks.join('\n')
    }

    if (!responseText) {
      console.error('Unexpected AI response format:', response)
      return res.status(500).json({
        error: 'AI response was empty or unreadable. Please try again.',
      })
    }

    // Parse JSON from response
    let parsedData = null
    try {
      // Try to find JSON array in the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
      } else {
        // Fallback: try to parse the entire response as JSON object or array
        parsedData = JSON.parse(responseText)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText)
      return res.status(500).json({
        error: 'Failed to parse AI response. Please try again.',
        details: parseError.message
      })
    }

    // Special handling for lesson-discovery: return object as-is
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

    // For other types, expect an array
    let items = parsedData
    if (!Array.isArray(items)) {
      return res.status(500).json({ error: 'AI did not return an array of items' })
    }

    // Ensure each item has required fields
    items = items.map((item, index) => ({
      name: item.title || item.name || `Item ${index + 1}`,
      title: item.title,
      description: item.description || '',
      objectives: item.objectives || '',
      topics: item.topics || '',
      duration: item.duration || '',
      materials: item.materials || ''
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
      details: error.message
    })
  }
}
