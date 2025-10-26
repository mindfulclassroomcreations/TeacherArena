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
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({})

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

  useEffect(() => { load() }, [])

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

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <div>
          <Button variant="outline" onClick={load} isLoading={loading}>Refresh</Button>
        </div>
      </div>
      {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}
      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-2 px-3 font-bold text-gray-700">Email</th>
              <th className="text-left py-2 px-3 font-bold text-gray-700">Role</th>
              <th className="text-left py-2 px-3 font-bold text-gray-700">Tokens</th>
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
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => addTokens(u.id, 1000)} disabled={loading}>+1K</Button>
                    <Button size="sm" variant="outline" onClick={() => addTokens(u.id, 5000)} disabled={loading}>+5K</Button>
                    <Button size="sm" variant="outline" onClick={() => addTokens(u.id, 10000)} disabled={loading}>+10K</Button>
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
                      <Button size="sm" variant="outline" onClick={() => applyCustomAdd(u.id, 1)} disabled={loading}>Add</Button>
                      <Button size="sm" variant="primary" onClick={() => applyCustomSet(u.id)} disabled={loading}>Set</Button>
                    </span>
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
