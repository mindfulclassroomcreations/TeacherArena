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
