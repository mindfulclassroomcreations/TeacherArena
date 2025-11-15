// Server-only OpenAI client. Do NOT import this from client-side code.
import { OpenAI } from 'openai'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// OpenAI Prompt IDs created with custom system instructions
export const PROMPT_ID = 'pmpt_68fa404d58b08190a2e2c32770b4f59806857d16f04d704a'
export const LESSON_PROMPT_ID = 'pmpt_68fafd15edc08197806351f71c1b39cb086c40b5fe347771'
export const PROMPT_VERSION = '2'

// Default chat model used across the app (display-only for UI badges)
export const DEFAULT_MODEL = 'gpt-5-mini-2025-08-07'

export default client
