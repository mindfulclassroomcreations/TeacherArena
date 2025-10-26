import React, { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Input from '@/components/Input'
import Textarea from '@/components/Textarea'
import Button from '@/components/Button'
import { useAuth } from '@/contexts/AuthContext'

type EditableProfile = {
  full_name: string
  school: string
  grade_level: string
  subjects_taught: string[]
}

export default function SettingsPage() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState<EditableProfile>({ full_name: '', school: '', grade_level: '', subjects_taught: [] })

  useEffect(() => {
    const load = async () => {
      if (!session?.access_token) return
      setLoading(true); setError(null); setSaved(false)
      try {
        const res = await fetch('/api/profile/me', { headers: { Authorization: `Bearer ${session.access_token}` } })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        const p = data?.profile || {}
        setProfile({
          full_name: p.full_name || '',
          school: p.school || '',
          grade_level: p.grade_level || '',
          subjects_taught: Array.isArray(p.subjects_taught) ? p.subjects_taught : [],
        })
      } catch (e: any) {
        setError(String(e?.message || e))
      } finally { setLoading(false) }
    }
    load()
  }, [session?.access_token])

  const handleSave = async () => {
    if (!session?.access_token) return
    setSaving(true); setError(null); setSaved(false)
    try {
      const res = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(profile),
      })
      if (!res.ok) throw new Error(await res.text())
      setSaved(true)
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally { setSaving(false) }
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>
          {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
          {saved && <div className="mb-4 text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 text-sm">Profile saved</div>}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <Input
              label="Full name"
              value={profile.full_name}
              onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
              disabled={loading || saving}
            />
            <Input
              label="School"
              value={profile.school}
              onChange={(e) => setProfile(p => ({ ...p, school: e.target.value }))}
              disabled={loading || saving}
            />
            <Input
              label="Grade level"
              value={profile.grade_level}
              onChange={(e) => setProfile(p => ({ ...p, grade_level: e.target.value }))}
              disabled={loading || saving}
              placeholder="e.g., 3, 4-5, Middle School"
            />
            <Textarea
              label="Subjects taught (comma-separated)"
              value={profile.subjects_taught.join(', ')}
              onChange={(e) => setProfile(p => ({ ...p, subjects_taught: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
              disabled={loading || saving}
              rows={3}
            />
            <div className="pt-2">
              <Button onClick={handleSave} isLoading={saving} disabled={loading || saving}>Save</Button>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
