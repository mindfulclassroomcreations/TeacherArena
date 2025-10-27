import React, { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Button from '@/components/Button'
import Input from '@/components/Input'
import { UserProfile, UserRole } from '@/types'
import { supabase } from '@/lib/supabase'

async function api<T=any>(method: 'GET'|'POST'|'DELETE', body?: any): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  const headers: Record<string,string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY
  if (adminKey) headers['x-admin-key'] = adminKey

  const res = await fetch('/api/admin/users', {
    method,
    headers,
    body: method === 'GET' ? undefined : JSON.stringify(body || {}),
  })
  if (!res.ok) {
    let msg = 'Request failed'
    try { const txt = await res.text(); msg = txt } catch {}
    throw new Error(msg)
  }
  return res.json()
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [stats, setStats] = useState<{ todayCount: number; lifetimeCount: number; distinctTodayUsers: number; distinctLifetimeUsers: number } | null>(null)
  const [perUserStats, setPerUserStats] = useState<Record<string, { today: number; lifetime: number }> | null>(null)
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({})
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('user')
  const [newTokens, setNewTokens] = useState<string>('0')
  const [resetLinkByUser, setResetLinkByUser] = useState<Record<string, string>>({})

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const data = await api<{items: UserProfile[]}>('GET')
      setUsers(data.items || [])
    } catch (e: any) {
      const msg = String(e?.message || 'Failed to load users')
      setError(msg.includes('Unauthorized') ? 'Unauthorized: Admin access required' : `Failed to load users: ${msg}`)
    } finally { setLoading(false) }
  }

  const fetchStats = async () => {
    try {
      const { data } = await supabase.auth.getSession()
      const token = data?.session?.access_token
      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY
      if (adminKey) headers['x-admin-key'] = adminKey
      const res = await fetch('/api/admin/lesson-stats', { headers })
      if (res.ok) {
        const json = await res.json()
        setStats(json)
      }
      const res2 = await fetch('/api/admin/lesson-stats/by-user', { headers })
      if (res2.ok) {
        const json2 = await res2.json()
        setPerUserStats(json2)
      }
    } catch (e) {
      // ignore stats errors in UI, do not block users list
    }
  }

  useEffect(() => {
    load()
    fetchStats()
  }, [])

  const updateRole = async (id: string, role: UserRole) => {
    setLoading(true)
    try { await api('POST', { id, role }); await load() } finally { setLoading(false) }
  }

  const addTokens = async (id: string, delta: number) => {
    setLoading(true)
    try { await api('POST', { id, addTokens: delta }); await load() } finally { setLoading(false) }
  }

  const setCustomAmount = (id: string, value: string) => {
    // allow empty string; otherwise keep only digits
    const sanitized = value.replace(/[^0-9]/g, '')
    setCustomAmounts(prev => ({ ...prev, [id]: sanitized }))
  }

  const applyCustomAdd = async (id: string, sign: 1 | -1) => {
    const raw = customAmounts[id]
    const amt = raw ? parseInt(raw, 10) : 0
    if (!amt || amt <= 0) return
    await addTokens(id, sign * amt)
    // keep the amount for convenience; comment next line to clear after action
    // setCustomAmounts(prev => ({ ...prev, [id]: '' }))
  }

  const applyCustomSet = async (id: string) => {
    const raw = customAmounts[id]
    const amt = raw ? parseInt(raw, 10) : 0
    if (amt < 0 || Number.isNaN(amt)) return
    setLoading(true)
    try { await api('POST', { id, setTokens: amt }); await load() } finally { setLoading(false) }
  }

  const removeUser = async (id: string) => {
    if (!confirm('Remove this user?')) return
    setLoading(true)
    try { await api('DELETE', { id }); await load() } finally { setLoading(false) }
  }

  const createUser = async () => {
    if (!newEmail || !newPassword) { setError('Email and password are required'); return }
    setLoading(true); setError(null)
    try {
      const initialTokens = parseInt(newTokens || '0', 10) || 0
      await api('POST', { email: newEmail, password: newPassword, role: newRole, initialTokens })
      setNewEmail(''); setNewPassword(''); setNewTokens('0'); setNewRole('user')
      await load()
    } catch (e: any) {
      setError(String(e?.message || 'Failed to create user'))
    } finally { setLoading(false) }
  }

  const sendResetLink = async (email: string, id: string) => {
    setLoading(true)
    try {
      const resp = await api<{ resetUrl?: string }>('POST', { resetPasswordEmail: email })
      if (resp?.resetUrl) {
        setResetLinkByUser((prev) => ({ ...prev, [id]: resp.resetUrl! }))
        try {
          await navigator.clipboard.writeText(resp.resetUrl)
          alert('Reset link copied to clipboard')
        } catch { /* noop */ }
      }
    } finally { setLoading(false) }
  }

  return (
    <Layout>
      <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Add New User</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input label="Email" type="email" value={newEmail} onChange={(e)=> setNewEmail(e.target.value)} />
          <Input label="Temporary Password" type="password" value={newPassword} onChange={(e)=> setNewPassword(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select className="w-full border border-gray-300 rounded px-2 py-2" value={newRole} onChange={(e)=> setNewRole(e.target.value as UserRole)}>
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="designer">Designer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <Input label="Initial Tokens" type="number" value={newTokens} onChange={(e)=> setNewTokens(e.target.value)} />
        </div>
        <div className="mt-3">
          <Button variant="primary" onClick={createUser} isLoading={loading}>Create User</Button>
          <p className="text-xs text-gray-500 mt-2">Passwords are never visible after creation. You can send a reset link if needed.</p>
        </div>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <div>
          <Button variant="outline" onClick={load} isLoading={loading}>Refresh</Button>
        </div>
      </div>
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="rounded-lg border p-4 bg-white shadow-sm">
              <div className="text-sm text-gray-500">Lessons today</div>
              <div className="text-2xl font-semibold">{stats.todayCount}</div>
            </div>
            <div className="rounded-lg border p-4 bg-white shadow-sm">
              <div className="text-sm text-gray-500">Lessons lifetime</div>
              <div className="text-2xl font-semibold">{stats.lifetimeCount}</div>
            </div>
            <div className="rounded-lg border p-4 bg-white shadow-sm">
              <div className="text-sm text-gray-500">Active users today</div>
              <div className="text-2xl font-semibold">{stats.distinctTodayUsers}</div>
            </div>
            <div className="rounded-lg border p-4 bg-white shadow-sm">
              <div className="text-sm text-gray-500">Users lifetime</div>
              <div className="text-2xl font-semibold">{stats.distinctLifetimeUsers}</div>
            </div>
          </div>
        )}
      {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}
      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-2 px-3 font-bold text-gray-700">Email</th>
              <th className="text-left py-2 px-3 font-bold text-gray-700">Role</th>
              <th className="text-left py-2 px-3 font-bold text-gray-700">Tokens</th>
              <th className="text-left py-2 px-3 font-bold text-gray-700">Lessons Today</th>
              <th className="text-left py-2 px-3 font-bold text-gray-700">Lessons Lifetime</th>
              <th className="text-left py-2 px-3 font-bold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100">
                <td className="py-2 px-3">{u.email || u.id}</td>
                <td className="py-2 px-3">
                  <select
                    className="border border-gray-300 rounded px-2 py-1"
                    value={u.role}
                    onChange={(e) => updateRole(u.id, e.target.value as UserRole)}
                    disabled={loading}
                  >
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="designer">Designer</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="py-2 px-3 font-mono">{u.tokens}</td>
                <td className="py-2 px-3">{perUserStats?.[u.id]?.today ?? 0}</td>
                <td className="py-2 px-3">{perUserStats?.[u.id]?.lifetime ?? 0}</td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-20 border border-gray-300 rounded px-2 py-1"
                        placeholder="Amt"
                        value={customAmounts[u.id] ?? ''}
                        onChange={(e) => setCustomAmount(u.id, e.target.value)}
                        disabled={loading}
                      />
                      <Button size="sm" variant="primary" onClick={() => applyCustomSet(u.id)} disabled={loading}>Set</Button>
                    </span>
                    <Button size="sm" variant="outline" onClick={() => sendResetLink(u.email || '', u.id)} disabled={loading || !u.email}>Send Reset Link</Button>
                    {resetLinkByUser[u.id] && (
                      <a href={resetLinkByUser[u.id]} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-700 underline">Open Reset Link</a>
                    )}
                    <Button size="sm" variant="danger" onClick={() => removeUser(u.id)} disabled={loading}>Remove</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
