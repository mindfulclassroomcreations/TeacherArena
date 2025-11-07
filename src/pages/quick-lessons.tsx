import React, { useState } from 'react'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Input from '@/components/Input'
import Alert from '@/components/Alert'

export default function QuickLessonsPage() {
  const [country, setCountry] = useState('')
  const [stateCurriculum, setStateCurriculum] = useState('')
  const [grade, setGrade] = useState('')
  const [subject, setSubject] = useState('')
  const [subs, setSubs] = useState<Array<{ code: string; description: string; lessons: number }>>([
    { code: '', description: '', lessons: 1 },
  ])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<any[]>([])

  const addSubRow = () => setSubs((prev) => [...prev, { code: '', description: '', lessons: 1 }])
  const updateSub = (i: number, k: 'code'|'description'|'lessons', v: any) => {
    setSubs((prev) => prev.map((s, idx) => idx === i ? { ...s, [k]: k==='lessons' ? Math.max(1, Number(v)||1) : v } : s))
  }
  const removeSub = (i: number) => setSubs((prev) => prev.filter((_, idx) => idx !== i))

  const generateFor = async (indices: number[]) => {
    try {
      setBusy(true); setError(null)
      const payload = {
        country: country || undefined,
        stateCurriculum: stateCurriculum || undefined,
        grade: grade || '',
        subject: subject || '',
        subStandards: subs.filter((_, i) => indices.includes(i)).map(s => ({ code: s.code, description: s.description, lessons: s.lessons }))
      }
      const r = await fetch('/api/quick-lessons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || 'Failed to generate')
      const generated: any[] = Array.isArray(j?.items) ? j.items : []
      // Group back under sub-index
      setItems((prev) => {
        const next = [...prev]
        generated.forEach((it) => next.push(it))
        return next
      })
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally { setBusy(false) }
  }

  const handleGenerateAll = () => generateFor(subs.map((_, i) => i))
  const handleGenerateOne = (i: number) => generateFor([i])

  const moveToTables = () => {
    try {
      const sectionKey = 'quick-lessons'
      const sectionTitle = 'Quick Lessons'
      const lsRaw = window.localStorage.getItem('ta_tables_data')
      const data = lsRaw ? JSON.parse(lsRaw) : {}
      const lessonsBySection: Record<string, any[]> = data.lessonsBySection || {}
      const names: Record<string, string> = data.sectionNamesByKey || {}
      const order: string[] = Array.isArray(data.sectionOrder) ? data.sectionOrder.slice() : []

      if (!order.includes(sectionKey)) order.push(sectionKey)
      names[sectionKey] = sectionTitle

      const existing = Array.isArray(lessonsBySection[sectionKey]) ? lessonsBySection[sectionKey] : []
      const existingKeys = new Set(existing.map((l: any) => (String(l.title || l.name || '').toLowerCase() + '|' + String(l.standard_code || l.code || '').toLowerCase())))
      const toAdd = items.filter((l) => {
        const key = (String(l.title || '').toLowerCase() + '|' + String(l.standard_code || '').toLowerCase())
        return !existingKeys.has(key)
      })
      lessonsBySection[sectionKey] = [...existing, ...toAdd]

      const nextPayload = {
        ...data,
        lessonsBySection,
        sectionNamesByKey: names,
        sectionOrder: order,
        subject,
        framework: subject, // keep compatibility labels
        grade,
        headerSubjectName: subject,
        headerCurriculum: stateCurriculum || country || '',
        headerGradeLevel: grade,
      }
      window.localStorage.setItem('ta_tables_data', JSON.stringify(nextPayload))
      // Clear deletion markers to allow showing content
      try {
        window.localStorage.removeItem('ta_tables_deleted')
        window.localStorage.removeItem('ta_tables_deleted_signature')
      } catch {}
      // Navigate to tables
      window.location.href = '/tables'
    } catch (e) {
      setError('Failed to move to Tables. Please try again.')
    }
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
          <h1 className="text-2xl font-semibold">Quick Lessons Generator (One Step)</h1>
          {error && <Alert type="error" message={error} />}
          <Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <Input value={country} onChange={(e: any) => setCountry(e.target.value)} placeholder="e.g., USA" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State Curriculum</label>
                <Input value={stateCurriculum} onChange={(e: any) => setStateCurriculum(e.target.value)} placeholder="e.g., TEKS, SOL, NGSS" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Grade</label>
                <Input value={grade} onChange={(e: any) => setGrade(e.target.value)} placeholder="e.g., Grade 5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subject</label>
                <Input value={subject} onChange={(e: any) => setSubject(e.target.value)} placeholder="e.g., Science" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-medium">Sub-standards</h2>
              <Button size="sm" variant="outline" onClick={addSubRow}>+ Add another</Button>
            </div>
            <div className="space-y-3">
              {subs.map((s, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Code</label>
                    <Input value={s.code} onChange={(e: any) => updateSub(i, 'code', e.target.value)} placeholder="e.g., HS-LS1.A" />
                  </div>
                  <div className="sm:col-span-7">
                    <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
                    <Input value={s.description} onChange={(e: any) => updateSub(i, 'description', e.target.value)} placeholder="Short description to guide lesson focus" />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">Lessons</label>
                    <Input type="number" min={1} value={s.lessons} onChange={(e: any) => updateSub(i, 'lessons', e.target.value)} />
                  </div>
                  <div className="sm:col-span-1 flex gap-2">
                    <Button size="sm" onClick={() => handleGenerateOne(i)} disabled={busy || !subject || !grade}>Generate</Button>
                    <Button size="sm" variant="outline" onClick={() => removeSub(i)} disabled={busy}>Remove</Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Button onClick={handleGenerateAll} disabled={busy || !subject || !grade}>Generate All</Button>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-medium">Generated Lessons</h2>
              <Button size="sm" variant="primary" onClick={moveToTables} disabled={items.length===0}>Move to Tables</Button>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-gray-500">No lessons yet. Generate to see results here.</p>
            ) : (
              <div className="divide-y">
                {items.map((it, idx) => (
                  <div key={idx} className="py-2">
                    <div className="text-sm text-gray-500">{it.standard_code}</div>
                    <div className="font-medium">{it.title}</div>
                    <div className="text-sm text-gray-700">{it.description}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
