// Browser-safe AI constants for UI display and non-secret configuration.
// Do NOT import server clients (like OpenAI) from here.

// Default chat model used across the app (display-only for UI and request payloads)
export const DEFAULT_MODEL = 'gpt-5.1-2025-11-13'

// Allowed selectable models for the user (must also be permitted server-side)
export const ALLOWED_MODELS = [
	'gpt-5.2-2025-12-11',
	'gpt-5.1-2025-11-13',
	'gpt-5-mini-2025-08-07',
	'gpt-5-nano-2025-08-07',
	'gpt-4.1-2025-04-14',
	'gpt-4o-mini-search-preview-2025-03-11',
	'gpt-4.1-nano-2025-04-14'
] as const

export type AllowedModel = typeof ALLOWED_MODELS[number]

// Pricing and feature metadata used by the UI (browser-safe, non-secret)
// Prices are per 1M tokens and expressed in USD.
export const MODEL_PRICING: Record<string, { inputPerMillion: number; outputPerMillion: number }> = {
	'gpt-5.2-2025-12-11': { inputPerMillion: 1.75, outputPerMillion: 14.0 },
	'gpt-5.1-2025-11-13': { inputPerMillion: 1.25, outputPerMillion: 10.0 },
	'gpt-5-mini-2025-08-07': { inputPerMillion: 0.25, outputPerMillion: 2.0 },
	'gpt-5-nano-2025-08-07': { inputPerMillion: 0.05, outputPerMillion: 0.4 },
	'gpt-4.1-2025-04-14': { inputPerMillion: 2.0, outputPerMillion: 8.0 },
	'gpt-4o-mini-search-preview-2025-03-11': { inputPerMillion: 0.15, outputPerMillion: 0.6 },
	'gpt-4.1-nano-2025-04-14': { inputPerMillion: 0.4, outputPerMillion: 1.6 }
}

export const TOKEN_ASSUMPTION = {
	// Tokens assumed per lesson generation (adjust as needed)
	inputPerLesson: 1000,
	outputPerLesson: 400
}
