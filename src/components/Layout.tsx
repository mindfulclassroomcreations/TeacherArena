import React, { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/router'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, session, signOut } = useAuth()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [tokens, setTokens] = useState<number | null>(null)
  const [loadingTokens, setLoadingTokens] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  // Fetch current tokens via profile init endpoint
  const fetchTokens = async () => {
    try {
      if (!user) { setTokens(null); return }
      setLoadingTokens(true)
      // Get access token from AuthContext session
      const token = session?.access_token
      if (!token) { setTokens(null); return }
      // Use POST to ensure profile exists and returns latest tokens
      const resp = await fetch('/api/profile/init', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!resp.ok) {
        // Fallback to GET in case POST is blocked
        const alt = await fetch('/api/profile/init', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })
        const altData = await alt.json().catch(() => null)
        if (altData?.profile?.tokens != null) setTokens(altData.profile.tokens)
        else setTokens(null)
        return
      }
      const data = await resp.json().catch(() => null)
      if (data?.profile?.tokens != null) setTokens(data.profile.tokens)
      else setTokens(null)
    } catch {
      // ignore errors
    } finally {
      setLoadingTokens(false)
    }
  }

  // Prefetch tokens when user/session becomes available
  useEffect(() => {
    if (user && session?.access_token) {
      fetchTokens()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, session?.access_token])

  // Refresh when opening the user menu
  useEffect(() => {
    if (showUserMenu) fetchTokens()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showUserMenu])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <span className="text-3xl">🎓</span>
              <h1 className="text-2xl font-bold text-gray-900">Teacher Arena Lesson Generator</h1>
            </Link>
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <a
                    href="/tables"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span>📋</span>
                    <span>Tables</span>
                  </a>
                  <a
                    href="/product-generation"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span>🛍️</span>
                    <span>Products</span>
                  </a>
                </>
              )}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                      {user.email?.[0].toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {user.email}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{user.user_metadata?.full_name || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-gray-600">Tokens</span>
                          <span className="text-xs font-mono text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                            {loadingTokens ? '…' : (tokens != null ? tokens.toLocaleString() : '—')}
                          </span>
                        </div>
                        <button onClick={fetchTokens} className="mt-2 text-xs text-blue-700 underline">Refresh</button>
                      </div>
                      <Link
                        href="/credits"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Buy Credits
                      </Link>
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/my-lessons"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        My Lessons
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Settings
                      </Link>
                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:underline transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 hover:underline rounded-lg transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>© 2025 Teacher Arena Lesson Generator</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
