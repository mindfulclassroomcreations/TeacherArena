import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Button from '@/components/Button'
import { useAuth } from '@/contexts/AuthContext'

export default function DashboardPage() {
  const { user, session } = useAuth()
  const [tokens, setTokens] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!user || !session?.access_token) return
      setLoading(true)
      try {
        // Ensure profile exists and fetch latest tokens
        const resp = await fetch('/api/profile/init', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (!resp.ok) {
          const alt = await fetch('/api/profile/init', {
            method: 'GET',
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
          const altData = await alt.json().catch(() => null)
          setTokens(altData?.profile?.tokens ?? null)
        } else {
          const data = await resp.json().catch(() => null)
          setTokens(data?.profile?.tokens ?? null)
        }
      } finally { setLoading(false) }
    }
    load()
  }, [user, session?.access_token])

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600">Token Balance</div>
              <div className="text-2xl font-extrabold text-blue-700 mt-1">{loading ? '…' : (tokens != null ? tokens.toLocaleString() : '—')}</div>
              <div className="mt-3 flex gap-2">
                <Link href="/credits"><Button size="sm">Buy Credits</Button></Link>
                <Link href="/product-generation"><Button size="sm" variant="outline">Generate</Button></Link>
                <Button size="sm" variant="outline" onClick={() => {
                  // re-run effect
                  if (user && session?.access_token) {
                    (async () => {
                      setLoading(true)
                      try {
                        const resp = await fetch('/api/profile/init', {
                          method: 'POST',
                          headers: { Authorization: `Bearer ${session.access_token}` },
                        })
                        if (!resp.ok) {
                          const alt = await fetch('/api/profile/init', {
                            method: 'GET',
                            headers: { Authorization: `Bearer ${session.access_token}` },
                          })
                          const altData = await alt.json().catch(() => null)
                          setTokens(altData?.profile?.tokens ?? null)
                        } else {
                          const data = await resp.json().catch(() => null)
                          setTokens(data?.profile?.tokens ?? null)
                        }
                      } finally { setLoading(false) }
                    })()
                  }
                }}>Refresh</Button>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600">Account</div>
              <div className="text-lg font-semibold text-gray-900 mt-1">{user?.email}</div>
              <div className="mt-3">
                <Link href="/settings"><Button size="sm" variant="outline">Settings</Button></Link>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600">Shortcuts</div>
              <ul className="mt-2 text-sm list-disc list-inside text-gray-700">
                <li><Link href="/showcase" className="text-blue-700 underline">Showcase</Link></li>
                <li><Link href="/product-generation" className="text-blue-700 underline">Generate Lessons</Link></li>
                <li><Link href="/credits" className="text-blue-700 underline">Buy Tokens</Link></li>
              </ul>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            <p className="text-gray-600 mt-2">Coming soon: your recent generations and saved lessons.</p>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
