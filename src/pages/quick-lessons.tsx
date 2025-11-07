import React, { useState } from 'react'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Input from '@/components/Input'
import Textarea from '@/components/Textarea'
import Alert from '@/components/Alert'

export default function QuickLessonsPage() {
  const [country, setCountry] = useState('')
  const [stateCurriculum, setStateCurriculum] = useState('')
  const [grade, setGrade] = useState('')
  const [subject, setSubject] = useState('')
  const [subs, setSubs] = useState<Array<{ title?: string; rows: Array<{ code: string; description: string }>; lessons: number }>>([
    { title: '', rows: [{ code: '', description: '' }], lessons: 1 },
  ])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<any[]>([])

  const addSubRow = () => setSubs((prev) => [...prev, { title: '', rows: [{ code: '', description: '' }], lessons: 1 }])
  const updateSubLessons = (i: number, v: any) => {
    setSubs(prev => prev.map((s, idx) => idx === i ? { ...s, lessons: Math.max(1, Number(v)||1) } : s))
  }
  const updateSubTitle = (i: number, v: string) => {
    setSubs(prev => prev.map((s, idx) => idx === i ? { ...s, title: v } : s))
  }
  const removeSub = (i: number) => setSubs((prev) => prev.filter((_, idx) => idx !== i))
  const addCodeRow = (i: number) => {
    setSubs(prev => prev.map((s, idx) => idx === i ? { ...s, rows: [...s.rows, { code: '', description: '' }] } : s))
  }
  const updateCodeRow = (subIdx: number, rowIdx: number, field: 'code' | 'description', value: string) => {
    setSubs(prev => prev.map((s, i) => {
      if (i !== subIdx) return s
      const rows = s.rows.map((r, ri) => ri === rowIdx ? { ...r, [field]: value } : r)
      return { ...s, rows }
    }))
  }
  const removeCodeRow = (subIdx: number, rowIdx: number) => {
    setSubs(prev => prev.map((s, i) => {
      if (i !== subIdx) return s
      const rows = s.rows.filter((_, ri) => ri !== rowIdx)
      return { ...s, rows: rows.length > 0 ? rows : [{ code: '', description: '' }] }
    }))
  }

  function countCodes(rows: Array<{ code: string }>): number {
    return rows.map(r => r.code.trim()).filter(c => c).length
  }

  function expandRows(rows: Array<{ code: string; description: string }>, lessons: number, title?: string) {
    return rows
      .map(r => ({ code: r.code.trim(), description: r.description.trim(), lessons: Math.max(1, Number(lessons)||1), title: String(title||'').trim() }))
      .filter(r => r.code)
  }

  const generateFor = async (indices: number[]) => {
    try {
      setBusy(true); setError(null)
      // Expand selected rows into individual sub-standard objects (support multiple codes per row)
  const subStandardsExpanded = indices.flatMap((i) => expandRows(subs[i]?.rows || [], subs[i]?.lessons || 1, subs[i]?.title || ''))
      if (subStandardsExpanded.length === 0) {
        setError('Please enter at least one valid code to generate lessons.')
        setBusy(false)
        return
      }
      const payload = {
        country: country || undefined,
        stateCurriculum: stateCurriculum || undefined,
        grade: grade || '',
        subject: subject || '',
        subStandards: subStandardsExpanded
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
      const lsRaw = window.localStorage.getItem('ta_tables_data')
      const data = lsRaw ? JSON.parse(lsRaw) : {}
      const lessonsBySection: Record<string, any[]> = data.lessonsBySection || {}
      const subStandardsBySection: Record<string, Array<{ code?: string; title?: string; name?: string }>> = data.subStandardsBySection || {}
      const names: Record<string, string> = data.sectionNamesByKey || {}
      const order: string[] = Array.isArray(data.sectionOrder) ? data.sectionOrder.slice() : []
      // Group items by original row (_subIndex) and compute a section title per group
      const groups: Record<string, { title: string; items: any[] }> = {}
      const makeSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const makeTitle = (sample: any): string => {
        const t = String(sample?._rowTitle || '').trim()
        if (t) return t
        const code = String(sample?.standard_code || sample?.code || '').trim()
        if (subject && code) return `${subject} - ${code}`
        if (code) return `Lessons for ${code}`
        return 'Quick Lessons Group'
      }
      // Fallback if items array is empty
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('No generated lessons to move.')
      }
      items.forEach((it: any) => {
        const key = String(it?._subIndex ?? 0)
        if (!groups[key]) groups[key] = { title: makeTitle(it), items: [] }
        groups[key].items.push(it)
      })

      // Create or merge a section per group using the computed title
      const usedKeys = new Set(order)
      Object.keys(groups).forEach((gid) => {
        const group = groups[gid]
        const baseKey = `quick-lessons-${makeSlug(group.title) || `group-${gid}`}`
        let sectionKey = baseKey
        let n = 2
        while (usedKeys.has(sectionKey)) { sectionKey = `${baseKey}-${n++}` }
        usedKeys.add(sectionKey)

        if (!order.includes(sectionKey)) order.push(sectionKey)
        names[sectionKey] = group.title

        const existing = Array.isArray(lessonsBySection[sectionKey]) ? lessonsBySection[sectionKey] : []
        const existingKeys = new Set(existing.map((l: any) => (String(l.title || l.name || '').toLowerCase() + '|' + String(l.standard_code || l.code || '').toLowerCase())))
        const toAdd = group.items.filter((l: any) => {
          const k = (String(l.title || '').toLowerCase() + '|' + String(l.standard_code || '').toLowerCase())
          return !existingKeys.has(k)
        })
        lessonsBySection[sectionKey] = [...existing, ...toAdd]

        const prevSubs = Array.isArray(subStandardsBySection[sectionKey]) ? subStandardsBySection[sectionKey] : []
        const prevCodes = new Set(prevSubs.map((s: any) => String(s.code || '').toLowerCase()))
        const newSubs: Array<{ code: string; title?: string }> = []
        group.items.forEach((l: any) => {
          const c = String(l.standard_code || l.code || '').trim()
          if (!c) return
          const key = c.toLowerCase()
          if (prevCodes.has(key)) return
          prevCodes.add(key)
          newSubs.push({ code: c })
        })
        subStandardsBySection[sectionKey] = [...prevSubs, ...newSubs]
      })

      const nextPayload = {
        ...data,
        lessonsBySection,
        subStandardsBySection,
        sectionNamesByKey: names,
        sectionOrder: order,
        subject,
        framework: subject, // keep compatibility labels
        grade,
        headerSubjectName: subject,
        headerCurriculum: stateCurriculum || country || '',
        headerGradeLevel: grade,
        userCleared: false,
      }
  window.localStorage.setItem('ta_tables_data', JSON.stringify(nextPayload))
      // Clear deletion markers to allow showing content
      try {
        window.localStorage.removeItem('ta_tables_deleted')
        window.localStorage.removeItem('ta_tables_deleted_signature')
      } catch {}
      // Navigate to tables in a new tab (after synchronous localStorage save)
      try {
        window.open('/tables', '_blank')
      } catch {
        window.location.href = '/tables'
      }
      // Clear generated items from this page to avoid duplicates and reflect move
      try { setItems([]) } catch {}
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
            <div className="space-y-6">
              {subs.map((s, i) => (
                <div key={i} className="border rounded-md p-3 bg-white/50 space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">Main Title (optional)</label>
                      <span className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-0.5">Codes: {countCodes(s.rows)}</span>
                    </div>
                    <Input
                      value={s.title || ''}
                      onChange={(e: any) => updateSubTitle(i, e.target.value)}
                      placeholder="e.g., Cell Biology Inquiry Series"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Codes & Descriptions (one per row)</label>
                    <div className="overflow-x-auto border border-gray-300 rounded">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr>
                            <th className="border border-gray-300 bg-gray-50 text-gray-700 font-medium w-10 text-center px-2 py-1">#</th>
                            <th className="border border-gray-300 bg-gray-50 text-gray-700 font-medium w-56 px-2 py-1">A</th>
                            <th className="border border-gray-300 bg-gray-50 text-gray-700 font-medium px-2 py-1">B</th>
                            <th className="border border-gray-300 bg-gray-50 w-12 px-2 py-1"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.rows.map((r, ri) => (
                            <tr key={ri}>
                              <td className="border border-gray-300 text-center text-xs text-gray-600 px-2 py-1">{ri + 1}</td>
                              <td className="border border-gray-300 px-0 py-0 align-top">
                                <input
                                  value={r.code}
                                  onChange={(e: any) => updateCodeRow(i, ri, 'code', e.target.value)}
                                  placeholder="HS-LS1-6"
                                  className="w-full border-0 rounded-none focus:ring-0 focus:outline-none bg-transparent px-2 py-1 text-sm"
                                  onPaste={(e) => {
                                    const text = e.clipboardData.getData('text')
                                    if (!text.includes('\n')) return
                                    e.preventDefault()
                                    // Parse lines: code[TAB or spaces]description
                                    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
                                    if (lines.length === 0) return
                                    setSubs(prev => prev.map((group, gi) => {
                                      if (gi !== i) return group
                                      const before = group.rows.slice(0, ri)
                                      const after = group.rows.slice(ri + 1)
                                      const parsed = lines.map(line => {
                                        const parts = line.split(/\t|\s{2,}|\s-\s/)
                                        // Fallback: first token up to first space, rest description
                                        let code = ''
                                        let desc = ''
                                        if (parts.length >= 2) {
                                          code = parts[0].trim()
                                          desc = parts.slice(1).join(' ').trim()
                                        } else {
                                          const m = line.match(/^(\S+)(?:\s+)(.*)$/)
                                          if (m) { code = m[1]; desc = m[2] } else { code = line }
                                        }
                                        return { code, description: desc }
                                      })
                                      return { ...group, rows: [...before, ...parsed, ...after] }
                                    }))
                                  }}
                                />
                              </td>
                              <td className="border border-gray-300 px-0 py-0">
                                <Textarea
                                  value={r.description}
                                  onChange={(e: any) => updateCodeRow(i, ri, 'description', e.target.value)}
                                  rows={1}
                                  placeholder="Brief focus or clarification"
                                  className="w-full min-h-[36px] border-0 rounded-none focus:ring-0 focus:outline-none bg-transparent px-2 py-1"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-1 align-top text-center">
                                <Button size="sm" variant="outline" onClick={() => removeCodeRow(i, ri)} disabled={s.rows.length === 1 || busy}>✕</Button>
                              </td>
                            </tr>
                          ))}
                          <tr>
                            <td className="border border-gray-300 px-2 py-1 text-center text-xs text-gray-400">{s.rows.length + 1}</td>
                            <td className="border border-gray-300 px-2 py-1" colSpan={2}>
                              <Button size="sm" variant="outline" onClick={() => addCodeRow(i)} disabled={busy}>+ Add row</Button>
                            </td>
                            <td className="border border-gray-300 px-2 py-1"></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Add each standard code on its own row with optional description.</p>
                  </div>
                  <div className="flex items-end gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Lessons per Code</label>
                      <Input type="number" min={1} value={s.lessons} onChange={(e: any) => updateSubLessons(i, e.target.value)} />
                    </div>
                    <div className="flex gap-2 pb-1">
                      <Button size="sm" onClick={() => handleGenerateOne(i)} disabled={busy || !subject || !grade || countCodes(s.rows)===0}>Generate</Button>
                      <Button size="sm" variant="outline" onClick={() => removeSub(i)} disabled={busy}>Remove Group</Button>
                    </div>
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
                    {it._rowTitle ? <div className="text-xs text-gray-400 italic">{it._rowTitle}</div> : null}
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
