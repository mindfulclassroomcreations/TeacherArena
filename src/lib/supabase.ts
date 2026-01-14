import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Basic runtime validation to surface misconfigured env values early
const isLikelyValidSupabaseUrl = (url: string) => {
  // Expect: https://<project-ref>.supabase.co
  const re = /^https:\/\/[a-z0-9-]{20,}\.supabase\.co\/?$/
  return re.test(url)
}

if (typeof window !== 'undefined') {
  const urlOk = Boolean(supabaseUrl) && isLikelyValidSupabaseUrl(supabaseUrl)
  const keyOk = Boolean(supabaseAnonKey) && supabaseAnonKey.length > 20
  if (!urlOk || !keyOk) {
    console.error('Supabase config invalid', {
      urlPresent: Boolean(supabaseUrl),
      urlValidFormat: isLikelyValidSupabaseUrl(supabaseUrl),
      anonKeyPresent: Boolean(supabaseAnonKey),
    })
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)
