import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [message, setMessage] = useState<string>('Completing sign-in…')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      // Wait for router to have query params
      if (!router.isReady) return
      const { error: errParam, error_description, code, redirect } = router.query as Record<string, string>

      if (errParam) {
        const msg = decodeURIComponent(error_description || errParam)
        setError(msg || 'Sign-in link invalid or expired.')
        setMessage('')
        return
      }

      try {
        // Prefer PKCE code exchange when present
        if (code) {
          const { data, error: exErr } = await supabase.auth.exchangeCodeForSession(code)
          if (exErr) throw exErr
        } else {
          // Legacy hash token fallback (?access_token/#access_token)
          if (typeof window !== 'undefined') {
            const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
            const access_token = hash.get('access_token')
            const refresh_token = hash.get('refresh_token')
            if (access_token && refresh_token) {
              const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token })
              if (setErr) throw setErr
            }
          }
        }

        // Seed profile/tokens on first login
        const { data: sessRes } = await supabase.auth.getSession()
        const token = sessRes?.session?.access_token
        if (token) {
          try { await fetch('/api/profile/init', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }) } catch {}
        }

        setMessage('Success! Redirecting…')
        const to = (redirect && typeof redirect === 'string') ? redirect : '/'
        // Small delay for UX
        setTimeout(() => router.replace(to), 600)
      } catch (e: any) {
        setError(String(e?.message || e) || 'Failed to complete sign-in.')
        setMessage('')
      }
    }
    run()
  }, [router])

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication</h1>
        {message && <p className="text-gray-700">{message}</p>}
        {error && (
          <div className="text-left">
            <p className="text-red-600 mb-2">{error}</p>
            <p className="text-sm text-gray-700">The verification link may have expired. Try requesting a new login link, or sign in with your email and password.</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
