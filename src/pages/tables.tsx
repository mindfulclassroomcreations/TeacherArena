import React, { useEffect, useMemo, useState } from 'react'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Button from '@/components/Button'
import Modal from '@/components/Modal'
import { downloadStep5OrganizedExcel, downloadStep5SectionExcel, downloadStep5CombinedExcel } from '@/lib/excelExport'

type LessonsBySection = Record<string, Array<{ title?: string; name?: string; description?: string; standard_code?: string; code?: string }>>
type SubStandardsBySection = Record<string, Array<{ code?: string; title?: string; name?: string }>>

export default function TablesPage() {
  const [payload, setPayload] = useState<any | null>(null)
  const [archives, setArchives] = useState<any[]>([])
  const [editingRow, setEditingRow] = useState<Record<string, number | null>>({})
  const [drafts, setDrafts] = useState<Record<string, Record<number, { standard: string; title: string; notes: string }>>>({})
  const [selectedSections, setSelectedSections] = useState<Record<string, boolean>>({})
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; secKey?: string; secTitle?: string; all?: boolean }>({ open: false })
  // AI Assist State
  const [aiOpen, setAiOpen] = useState(false)
  const [aiScope, setAiScope] = useState<'lesson' | 'section' | 'standard'>('lesson')
  const [aiTarget, setAiTarget] = useState<{ secKey: string; idx?: number | null; secTitle?: string }>({ secKey: '', idx: null, secTitle: '' })
  const [aiStandard, setAiStandard] = useState<string>('')
  const [aiModel, setAiModel] = useState<string>('gpt-5-mini-2025-08-07')
  const [aiWebSearch, setAiWebSearch] = useState<boolean>(false)
  const [aiPrompt, setAiPrompt] = useState<string>('')
  const [aiBusy, setAiBusy] = useState<boolean>(false)
  const [aiSuggestion, setAiSuggestion] = useState<any | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiChanged, setAiChanged] = useState<Record<string, Record<number, { standard?: boolean; title?: boolean; notes?: boolean }>>>({})

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('ta_tables_data')
      if (!raw) return
      const data = JSON.parse(raw)
      setPayload(data)
    } catch {
      // ignore parse errors
    }
    try {
      const arc = window.localStorage.getItem('ta_tables_archive')
      const list = Array.isArray(JSON.parse(arc || '[]')) ? JSON.parse(arc || '[]') : []
      setArchives(list)
    } catch {
      // ignore
    }
  }, [])

  const sectionsWithLessons = useMemo(() => {
    if (!payload?.lessonsBySection) return [] as Array<{ key: string; title: string; items: any[] }>
    const names: Record<string, string> = payload.sectionNamesByKey || {}
    const order: string[] = Array.isArray(payload.sectionOrder) ? payload.sectionOrder : Object.keys(payload.lessonsBySection)
    const added = new Set<string>()
    const result: Array<{ key: string; title: string; items: any[] }> = []
    order.forEach((key) => {
      const items = Array.isArray(payload.lessonsBySection[key]) ? payload.lessonsBySection[key] : []
      if (items.length > 0) {
        result.push({ key, title: names[key] || key, items })
        added.add(key)
      }
    })
    // Append any leftover sections with lessons not captured in order (edge cases)
    Object.keys(payload.lessonsBySection).forEach((key) => {
      if (added.has(key)) return
      const items = Array.isArray(payload.lessonsBySection[key]) ? payload.lessonsBySection[key] : []
      if (items.length > 0) {
        result.push({ key, title: names[key] || key, items })
        added.add(key)
      }
    })
    return result
  }, [payload])

  const handleExportAll = () => {
    if (!payload) return
    // Export into a single combined sheet
    downloadStep5CombinedExcel(
      payload.lessonsBySection as LessonsBySection,
      payload.sectionNamesByKey as Record<string, string>,
      (payload.headerSubjectName || payload.framework || payload.subject),
      (payload.headerCurriculum || payload.subject || payload.framework),
      (payload.headerGradeLevel || payload.grade),
      payload.sectionOrder
    )
  }

  const handleExportSelected = () => {
    if (!payload) return
    const selectedKeys = sectionsWithLessons.map(s => s.key).filter(k => selectedSections[k])
    if (selectedKeys.length === 0) return
    // Build filtered structures preserving order
    const filteredLessons: LessonsBySection = {}
    const filteredNames: Record<string, string> = {}
    selectedKeys.forEach((k) => {
      filteredLessons[k] = (payload.lessonsBySection || {})[k] || []
      filteredNames[k] = (payload.sectionNamesByKey || {})[k] || k
    })
    // Export into a single combined sheet
    downloadStep5CombinedExcel(
      filteredLessons,
      filteredNames,
      (payload.headerSubjectName || payload.framework || payload.subject),
      (payload.headerCurriculum || payload.subject || payload.framework),
      (payload.headerGradeLevel || payload.grade),
      selectedKeys
    )
  }

  const handleExportSection = (key: string, title: string, items: any[]) => {
    if (!payload) return
    const subs = (payload.subStandardsBySection || {})[key] || []
    downloadStep5SectionExcel(
      key,
      title,
      items,
      subs,
      payload.subject,
      payload.framework,
      payload.grade
    )
  }

  const handleExportArchive = (idx: number) => {
    const snap = archives[idx]
    if (!snap?.data) return
    downloadStep5OrganizedExcel(
      snap.data.lessonsBySection,
      snap.data.subStandardsBySection,
      snap.data.sectionNamesByKey,
      snap.data.subject,
      snap.data.framework,
      snap.data.grade,
      snap.data.sectionOrder
    )
  }

  const handleRestoreArchive = (idx: number) => {
    const snap = archives[idx]
    if (!snap?.data) return
    try {
      window.localStorage.setItem('ta_tables_data', JSON.stringify(snap.data))
      setPayload(snap.data)
      // Clearing deletion markers since we're restoring content
      try {
        window.localStorage.removeItem('ta_tables_deleted')
        window.localStorage.removeItem('ta_tables_deleted_signature')
      } catch {}
    } catch {
      // ignore
    }
  }

  const handleDeleteArchive = (idx: number) => {
    const next = archives.slice()
    next.splice(idx, 1)
    setArchives(next)
    try { window.localStorage.setItem('ta_tables_archive', JSON.stringify(next)) } catch {}
  }

  const renderTable = (items: any[]) => {
    // Kept for backward compat; replaced by renderSectionTable with edit support
    // but retain the structure if needed elsewhere
    const sorted = items.slice().sort((a: any, b: any) => {
      const ac = String(a.standard_code || a.code || '').localeCompare(String(b.standard_code || b.code || ''))
      if (ac !== 0) return ac
      return String(a.title || a.name || '').localeCompare(String(b.title || b.name || ''))
    })
    return (
      <div className="overflow-x-auto border border-gray-200 rounded">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-2 px-3 font-bold text-gray-700 w-10">No</th>
              <th className="text-left py-2 px-3 font-bold text-gray-700 w-40">STANDARD</th>
              <th className="text-left py-2 px-3 font-bold text-gray-700">TITLE</th>
              <th className="text-left py-2 px-3 font-bold text-gray-700 w-2/5">NOTES</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((ls: any, idx: number) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-white">
                <td className="py-2 px-3 text-gray-900">{idx + 1}</td>
                <td className="py-2 px-3 font-mono text-blue-600 text-xs">{ls.standard_code || ls.code || ''}</td>
                <td className="py-2 px-3 text-gray-900 font-medium">{ls.title || ls.name || ''}</td>
                <td className="py-2 px-3 text-gray-700">{ls.description || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const handleStartEdit = (secKey: string, idx: number, item: any) => {
    setEditingRow((prev) => ({ ...prev, [secKey]: idx }))
    setDrafts((prev) => {
      const prevSec = prev[secKey] || {}
      const nextSec = {
        ...prevSec,
        [idx]: {
          standard: String(item.standard_code || item.code || ''),
          title: String(item.title || item.name || ''),
          notes: String(item.description || ''),
        },
      }
      return { ...prev, [secKey]: nextSec }
    })
  }

  const getLessonKey = (it: any) => {
    const code = String(it?.standard_code || it?.code || '').toLowerCase().trim()
    const title = String(it?.title || it?.name || '').toLowerCase().trim()
    return `${code}__${title}`
  }

  const openAiForLesson = (secKey: string, idx: number, item: any) => {
    // Translate sorted idx to original array index to ensure correct updates
    let trueIdx = idx
    try {
      const arr: any[] = Array.isArray(payload?.lessonsBySection?.[secKey]) ? payload!.lessonsBySection[secKey] : []
      const k = getLessonKey(item)
      const found = arr.findIndex((x: any) => getLessonKey(x) === k)
      if (found >= 0) trueIdx = found
    } catch {}
    setAiScope('lesson')
    setAiTarget({ secKey, idx: trueIdx, secTitle: String(payload?.sectionNamesByKey?.[secKey] || secKey) })
    setAiPrompt('')
    setAiSuggestion(null)
    setAiError(null)
    setAiOpen(true)
  }

  const openAiForSection = (secKey: string) => {
    setAiScope('section')
    setAiTarget({ secKey, idx: null, secTitle: String(payload?.sectionNamesByKey?.[secKey] || secKey) })
    try {
      const arr: any[] = Array.isArray(payload?.lessonsBySection?.[secKey]) ? payload!.lessonsBySection[secKey] : []
      const firstCode = (arr.find((it) => (it?.standard_code || it?.code))?.standard_code || arr.find((it) => (it?.standard_code || it?.code))?.code || '') as string
      setAiStandard(String(firstCode || ''))
    } catch { setAiStandard('') }
    setAiPrompt('')
    setAiSuggestion(null)
    setAiError(null)
    setAiOpen(true)
  }

  const askAi = async () => {
    try {
      if (!payload) return
      setAiBusy(true)
      setAiError(null)
      setAiSuggestion(null)
      const secKey = aiTarget.secKey
      const sectionName = String(payload.sectionNamesByKey?.[secKey] || secKey)
      const body: any = {
        model: aiModel,
        webSearch: aiWebSearch,
        scope: aiScope,
        subject: payload.headerSubjectName || payload.framework || payload.subject,
        framework: payload.headerCurriculum || payload.subject || payload.framework,
        grade: payload.headerGradeLevel || payload.grade,
        region: payload.headerRegion || payload.region || undefined,
        sectionKey: secKey,
        sectionName,
        userInstructions: aiPrompt || undefined,
      }
      if (aiScope === 'lesson') {
        const idx = aiTarget.idx || 0
        const arr: any[] = Array.isArray(payload.lessonsBySection?.[secKey]) ? payload.lessonsBySection[secKey] : []
        body.lesson = arr[idx] || {}
      } else if (aiScope === 'section') {
        body.lessons = Array.isArray(payload.lessonsBySection?.[secKey]) ? payload.lessonsBySection[secKey] : []
      } else {
        // standard-level: filter lessons to those matching selected standard code (case-insensitive)
        body.standardCode = aiStandard
        const all: any[] = Array.isArray(payload.lessonsBySection?.[secKey]) ? payload.lessonsBySection[secKey] : []
        const codeN = String(aiStandard || '').trim().toLowerCase()
        body.lessons = all
          .map((it: any, i: number) => ({ ...it, __index: i }))
          .filter((it: any) => String(it.standard_code || it.code || '').trim().toLowerCase() === codeN)
          .map(({ __index, ...rest }: any) => Object.assign(rest, { index: __index }))
      }
      const resp = await fetch('/api/tables/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'AI request failed')
      setAiSuggestion(data)
    } catch (e: any) {
      setAiError(String(e?.message || e))
    } finally {
      setAiBusy(false)
    }
  }

  const applyAiSuggestion = () => {
    if (!payload || !aiSuggestion) return
    const secKey = aiTarget.secKey
    const next = JSON.parse(JSON.stringify(payload))
    const changedMap: Record<number, { standard?: boolean; title?: boolean; notes?: boolean }> = {}
    if (aiSuggestion.type === 'lessonUpdate' && aiTarget.idx != null) {
      const idx = aiTarget.idx
      const updates = aiSuggestion.updates || {}
      const arr: any[] = Array.isArray(next.lessonsBySection?.[secKey]) ? next.lessonsBySection[secKey] : []
      const item = { ...(arr[idx] || {}) }
      if ('standard' in updates) {
        if ('standard_code' in item || !('code' in item)) item.standard_code = updates.standard
        else item.code = updates.standard
        changedMap[idx] = { ...(changedMap[idx] || {}), standard: true }
      }
      if ('title' in updates) {
        if ('title' in item || !('name' in item)) item.title = updates.title
        else item.name = updates.title
        changedMap[idx] = { ...(changedMap[idx] || {}), title: true }
      }
      if ('notes' in updates) {
        item.description = updates.notes
        changedMap[idx] = { ...(changedMap[idx] || {}), notes: true }
      }
      arr[idx] = item
      next.lessonsBySection[secKey] = arr
    } else if (aiSuggestion.type === 'sectionBulkUpdate' && Array.isArray(aiSuggestion.sectionUpdates)) {
      const arr: any[] = Array.isArray(next.lessonsBySection?.[secKey]) ? next.lessonsBySection[secKey] : []
      aiSuggestion.sectionUpdates.forEach((u: any) => {
        const i = Number(u.index)
        if (!Number.isFinite(i) || i < 0 || i >= arr.length) return
        const item = { ...(arr[i] || {}) }
        if ('standard' in u) {
          if ('standard_code' in item || !('code' in item)) item.standard_code = u.standard
          else item.code = u.standard
          changedMap[i] = { ...(changedMap[i] || {}), standard: true }
        }
        if ('title' in u) {
          if ('title' in item || !('name' in item)) item.title = u.title
          else item.name = u.title
          changedMap[i] = { ...(changedMap[i] || {}), title: true }
        }
        if ('notes' in u) {
          item.description = u.notes
          changedMap[i] = { ...(changedMap[i] || {}), notes: true }
        }
        arr[i] = item
      })
      next.lessonsBySection[secKey] = arr
    }
    persistPayload(next)
    // Merge changedMap into aiChanged state for highlighting
    setAiChanged((prev) => ({
      ...prev,
      [secKey]: {
        ...(prev[secKey] || {}),
        ...changedMap,
      },
    }))
    setAiOpen(false)
    setAiSuggestion(null)
  }

  const buildAiSuggestionRows = (): Array<{ no: number; standard: string; title: string; notes: string }> => {
    const rows: Array<{ no: number; standard: string; title: string; notes: string }> = []
    if (!payload || !aiSuggestion) return rows
    const secKey = aiTarget.secKey
    const arr: any[] = Array.isArray(payload.lessonsBySection?.[secKey]) ? payload.lessonsBySection[secKey] : []
    const toDisplay = (item: any, updates?: any) => {
      const standard = (updates?.standard ?? (item?.standard_code || item?.code || ''))
      const title = (updates?.title ?? (item?.title || item?.name || ''))
      const notes = (updates?.notes ?? (item?.description || ''))
      return { standard: String(standard || ''), title: String(title || ''), notes: String(notes || '') }
    }
    if (aiSuggestion.type === 'lessonUpdate' && aiTarget.idx != null) {
      const idx = aiTarget.idx
      const item = arr[idx] || {}
      const merged = toDisplay(item, aiSuggestion.updates)
      rows.push({ no: idx + 1, ...merged })
    } else if (aiSuggestion.type === 'sectionBulkUpdate' && Array.isArray(aiSuggestion.sectionUpdates)) {
      aiSuggestion.sectionUpdates.forEach((u: any) => {
        const i = Number(u.index)
        if (!Number.isFinite(i) || i < 0 || i >= arr.length) return
        const item = arr[i] || {}
        const merged = toDisplay(item, u)
        rows.push({ no: i + 1, ...merged })
      })
      // Stable sort by row number
      rows.sort((a, b) => a.no - b.no)
    }
    return rows
  }

  const handleChangeDraft = (secKey: string, idx: number, field: 'standard' | 'title' | 'notes', value: string) => {
    setDrafts((prev) => {
      const sec = { ...(prev[secKey] || {}) }
      const row = { ...(sec[idx] || { standard: '', title: '', notes: '' }) }
      row[field] = value
      sec[idx] = row
      return { ...prev, [secKey]: sec }
    })
  }

  const handleCancelEdit = (secKey: string) => {
    setEditingRow((prev) => ({ ...prev, [secKey]: null }))
    setDrafts((prev) => ({ ...prev, [secKey]: {} }))
  }

  const persistPayload = (next: any) => {
    setPayload(next)
    try { window.localStorage.setItem('ta_tables_data', JSON.stringify(next)) } catch {}
  }

  const handleSaveEdit = (secKey: string, idx: number) => {
    if (!payload) return
    const draft = drafts[secKey]?.[idx]
    if (!draft) return
    const next = JSON.parse(JSON.stringify(payload))
    const arr: any[] = Array.isArray(next.lessonsBySection?.[secKey]) ? next.lessonsBySection[secKey] : []
    const item = { ...(arr[idx] || {}) }
    // Update fields
    if ('standard_code' in item || !('code' in item)) item.standard_code = draft.standard
    else item.code = draft.standard
    if ('title' in item || !('name' in item)) item.title = draft.title
    else item.name = draft.title
    item.description = draft.notes
    arr[idx] = item
    next.lessonsBySection[secKey] = arr
    persistPayload(next)
    setEditingRow((prev) => ({ ...prev, [secKey]: null }))
    setDrafts((prev) => ({ ...prev, [secKey]: {} }))
  }

  const doDeleteSection = (secKey: string) => {
    if (!payload) return
    const next = JSON.parse(JSON.stringify(payload))
    if (next.lessonsBySection) delete next.lessonsBySection[secKey]
    if (Array.isArray(next.sectionOrder)) next.sectionOrder = next.sectionOrder.filter((k: string) => k !== secKey)
    persistPayload(next)
  }

  const doDeleteAll = () => {
    if (!payload) return
    // Persist a signature so Step 5 "Open Tables" can avoid re-populating
    try {
      const deletedSig = JSON.stringify(payload?.lessonsBySection || {})
      window.localStorage.setItem('ta_tables_deleted_signature', deletedSig)
      window.localStorage.setItem('ta_tables_deleted', '1')
    } catch {
      // ignore
    }
    const next = { ...payload, lessonsBySection: {}, sectionOrder: [], userCleared: true }
    persistPayload(next)
  }

  const askDeleteSection = (secKey: string, secTitle: string) => {
    setDeleteConfirm({ open: true, secKey, secTitle, all: false })
  }

  const askDeleteAll = () => {
    setDeleteConfirm({ open: true, all: true })
  }

  const handleArchiveCurrent = () => {
    if (!payload) return
    try {
      const arcRaw = window.localStorage.getItem('ta_tables_archive')
      const arc = Array.isArray(JSON.parse(arcRaw || '[]')) ? JSON.parse(arcRaw || '[]') : []
      // Save a snapshot of the current tables first
      arc.unshift({ savedAt: new Date().toISOString(), data: payload })
      if (arc.length > 10) arc.length = 10
      window.localStorage.setItem('ta_tables_archive', JSON.stringify(arc))
      setArchives(arc)
      // After archiving, clear current tables from view and persist deletion markers
      try {
        const deletedSig = JSON.stringify(payload?.lessonsBySection || {})
        window.localStorage.setItem('ta_tables_deleted_signature', deletedSig)
        window.localStorage.setItem('ta_tables_deleted', '1')
      } catch {}
      const next = { ...payload, lessonsBySection: {}, sectionOrder: [], userCleared: true }
      persistPayload(next)
      // Optional: provide a subtle confirmation without blocking UX
      try { console.info('Archived current tables and cleared current view.') } catch {}
    } catch {
      // ignore
    }
  }

  const toggleSelectSection = (key: string) => {
    setSelectedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleSelectAllSections = () => {
    const all = sectionsWithLessons.map(s => s.key)
    const allSelected = all.every(k => !!selectedSections[k])
    if (allSelected) {
      // Clear all
      const next: Record<string, boolean> = {}
      setSelectedSections(next)
    } else {
      const next: Record<string, boolean> = {}
      all.forEach(k => { next[k] = true })
      setSelectedSections(next)
    }
  }

  const renderSectionTable = (secKey: string, items: any[]) => {
    const sorted = items.slice().sort((a: any, b: any) => {
      const ac = String(a.standard_code || a.code || '').localeCompare(String(b.standard_code || b.code || ''))
      if (ac !== 0) return ac
      return String(a.title || a.name || '').localeCompare(String(b.title || b.name || ''))
    })
    const editingIdx = editingRow[secKey]
    return (
      <div className="overflow-x-auto border border-gray-200 rounded">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-2 px-3 font-bold text-gray-700 w-10">No</th>
              <th className="text-left py-2 px-3 font-bold text-gray-700 w-40">STANDARD</th>
              <th className="text-left py-2 px-3 font-bold text-gray-700">TITLE</th>
              <th className="text-left py-2 px-3 font-bold text-gray-700 w-2/5">NOTES</th>
              <th className="text-left py-2 px-3 font-bold text-gray-700 w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((ls: any, idx: number) => {
              const isEditing = editingIdx === idx
              const draft = drafts[secKey]?.[idx]
              // Find original array index for highlighting (since this view is sorted)
              let origIdx = -1
              try {
                const arr: any[] = Array.isArray(payload?.lessonsBySection?.[secKey]) ? payload!.lessonsBySection[secKey] : []
                const k = getLessonKey(ls)
                origIdx = arr.findIndex((x: any) => getLessonKey(x) === k)
              } catch {}
              const changed = (origIdx >= 0 ? (aiChanged[secKey]?.[origIdx] || {}) : {}) as { standard?: boolean; title?: boolean; notes?: boolean }
              return (
                <tr key={idx} className="border-b border-gray-100 hover:bg-white">
                  <td className="py-2 px-3 text-gray-900">{idx + 1}</td>
                  <td className="py-2 px-3 font-mono text-blue-600 text-xs">
                    {isEditing ? (
                      <input
                        className="w-36 px-2 py-1 border border-gray-300 rounded text-xs"
                        value={draft?.standard ?? String(ls.standard_code || ls.code || '')}
                        onChange={(e) => handleChangeDraft(secKey, idx, 'standard', e.target.value)}
                      />
                    ) : (
                      <span className={changed.standard ? 'text-blue-600' : ''}>{String(ls.standard_code || ls.code || '')}</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-gray-900 font-medium">
                    {isEditing ? (
                      <input
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        value={draft?.title ?? String(ls.title || ls.name || '')}
                        onChange={(e) => handleChangeDraft(secKey, idx, 'title', e.target.value)}
                      />
                    ) : (
                      <span className={changed.title ? 'text-blue-600' : ''}>{String(ls.title || ls.name || '')}</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-gray-700">
                    {isEditing ? (
                      <textarea
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        rows={2}
                        value={draft?.notes ?? String(ls.description || '')}
                        onChange={(e) => handleChangeDraft(secKey, idx, 'notes', e.target.value)}
                      />
                    ) : (
                      <span className={changed.notes ? 'text-blue-600' : ''}>{String(ls.description || '')}</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="primary" onClick={() => handleSaveEdit(secKey, idx)}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => handleCancelEdit(secKey)}>Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleStartEdit(secKey, idx, ls)}>Edit</Button>
                        <Button size="sm" variant="outline" onClick={() => openAiForLesson(secKey, idx, ls)}>🪄 AI Fix</Button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">📋 Tables</h1>
          </div>
          <p className="text-gray-600 mt-2">View generated lessons as tables. Use the export buttons to download Excel files.</p>
        </div>

        {!payload ? (
          <div className="bg-white border border-gray-200 rounded p-6 text-center">
            <p className="text-gray-600 mb-4">No data loaded. From Step 5, click &quot;Move Lessons to Tables&quot; to load your latest tables here.</p>
            <Button variant="purple" onClick={() => window.location.href = '/'}>Go to Generate Lessons</Button>
          </div>
        ) : sectionsWithLessons.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded p-6 text-center">
            <p className="text-gray-600 mb-2">All lessons have been deleted or archived.</p>
            <p className="text-gray-500 text-sm mb-4">Generate new lessons from Step 5 to populate the tables.</p>
            <Button variant="purple" onClick={() => window.location.href = '/'}>Go to Generate Lessons</Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                {(() => {
                  const all = sectionsWithLessons.map(s => s.key)
                  const allSelected = all.length > 0 && all.every(k => !!selectedSections[k])
                  return (
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={allSelected} onChange={toggleSelectAllSections} />
                      <span className="text-sm text-gray-800">Select All Sections</span>
                    </label>
                  )
                })()}
                <Button size="sm" variant="purple" onClick={toggleSelectAllSections}>Select All Sections</Button>
                <span className="text-sm text-gray-600">
                  {Object.values(selectedSections).filter(Boolean).length} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => {
                  // Prefer first selected section; fallback to first available
                  const selected = sectionsWithLessons.find(s => !!selectedSections[s.key]) || sectionsWithLessons[0]
                  if (!selected) return
                  setAiScope('section')
                  setAiTarget({ secKey: selected.key, idx: null, secTitle: selected.title })
                  setAiPrompt('')
                  setAiSuggestion(null)
                  setAiError(null)
                  setAiOpen(true)
                }}>🤖 AI Assist…</Button>
                <Button size="sm" variant="success" onClick={handleExportSelected} disabled={Object.values(selectedSections).every(v => !v)}>
                  Export Selected Tables (Excel)
                  {(() => { const c = Object.values(selectedSections).filter(Boolean).length; return c > 0 ? ` (${c})` : '' })()}
                </Button>
                <Button size="sm" variant="success" onClick={handleExportAll}>Export All Tables (Excel)</Button>
              </div>
            </div>

            {/* Included Sections Summary */}
            <div className="bg-white border border-gray-200 rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900">Included Sections</h2>
                <span className="text-sm text-gray-600">{sectionsWithLessons.length} total</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {sectionsWithLessons.map((sec) => {
                  const count = Array.isArray(sec.items) ? sec.items.length : 0
                  const selected = !!selectedSections[sec.key]
                  return (
                    <button
                      key={`summary-${sec.key}`}
                      className={`flex items-center justify-between w-full text-left border rounded px-3 py-2 transition-colors ${selected ? 'bg-purple-50 border-purple-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                      onClick={() => toggleSelectSection(sec.key)}
                    >
                      <div className="flex items-center gap-2">
                        <input type="checkbox" readOnly checked={selected} />
                        <span className="font-medium text-gray-900">{sec.title}</span>
                      </div>
                      <span className="text-sm text-gray-600">{count} lesson{count !== 1 ? 's' : ''}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {sectionsWithLessons.map((sec) => (
              <div key={sec.key} className={`${selectedSections[sec.key] ? 'bg-purple-50 border-purple-300' : 'bg-white border-gray-200'} border rounded p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={!!selectedSections[sec.key]}
                      onChange={() => toggleSelectSection(sec.key)}
                    />
                    <h2 className="text-lg font-semibold text-gray-900">Section: {sec.title}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => handleExportSection(sec.key, sec.title, sec.items)} size="sm" variant="success">Export Section (Excel)</Button>
                    <Button onClick={() => askDeleteSection(sec.key, sec.title)} size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 focus:ring-red-400">Delete Table</Button>
                    <Button onClick={() => openAiForSection(sec.key)} size="sm" variant="outline">🪄 AI Fix (Section)</Button>
                  </div>
                </div>
                {renderSectionTable(sec.key, sec.items)}
              </div>
            ))}

            {/* Maintenance Actions */}
            <div className="bg-white border border-gray-200 rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900">Maintenance</h2>
              </div>
              <p className="text-sm text-gray-600 mb-3">Archive the current tables for safekeeping, or clear all tables from the view.</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleArchiveCurrent}>Archive Current Tables</Button>
                <Button size="sm" variant="outline" onClick={askDeleteAll} className="border-red-300 text-red-600 hover:bg-red-50 focus:ring-red-400">Delete All Tables</Button>
              </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false })} title="Confirm Deletion" size="sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 2a10 10 0 100 20 10 10 0 000-20z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">{deleteConfirm.all ? 'Delete all tables?' : 'Delete this table?'}</h4>
                  <p className="text-gray-700 mb-4">
                    {deleteConfirm.all
                      ? 'This will clear the current Tables view for all sections.'
                      : (<>
                          This will remove <span className="font-semibold">{deleteConfirm.secTitle}</span> from the current Tables view.
                        </>)}
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDeleteConfirm({ open: false })}>Cancel</Button>
                    <Button variant="danger" size="sm" onClick={() => {
                      if (deleteConfirm.all) {
                        doDeleteAll()
                      } else if (deleteConfirm.secKey) {
                        doDeleteSection(deleteConfirm.secKey)
                      }
                      setDeleteConfirm({ open: false })
                    }}>Delete{deleteConfirm.all ? ' All' : ''}</Button>
                  </div>
                </div>
              </div>
            </Modal>

            {/* Archive Panel moved to bottom */}
            <div className="bg-white border border-gray-200 rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900">Archive</h2>
                <span className="text-sm text-gray-600">{archives.length} snapshot{archives.length !== 1 ? 's' : ''}</span>
              </div>
              {archives.length === 0 ? (
                <p className="text-sm text-gray-600">No archived snapshots yet. Opening Tables with new data or archiving here will add snapshots.</p>
              ) : (
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-bold text-gray-700">Saved At</th>
                        <th className="text-left py-2 px-3 font-bold text-gray-700">Sections</th>
                        <th className="text-left py-2 px-3 font-bold text-gray-700">Lessons</th>
                        <th className="text-left py-2 px-3 font-bold text-gray-700 w-60">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {archives.map((snap, idx) => {
                        const lsBySec = snap?.data?.lessonsBySection || {}
                        const secCount = Object.values(lsBySec).filter((a: any) => Array.isArray(a) && a.length > 0).length
                        const lessonCount = Object.values(lsBySec).reduce((sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
                        return (
                          <tr key={idx} className="border-b border-gray-100">
                            <td className="py-2 px-3 text-gray-900">{new Date(snap.savedAt).toLocaleString()}</td>
                            <td className="py-2 px-3 text-gray-700">{secCount}</td>
                            <td className="py-2 px-3 text-gray-700">{lessonCount}</td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="success" onClick={() => handleExportArchive(idx)}>Export</Button>
                                <Button size="sm" variant="outline" onClick={() => handleRestoreArchive(idx)}>Restore</Button>
                                <Button size="sm" variant="outline" onClick={() => handleDeleteArchive(idx)}>Delete</Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Layout>
      {/* AI Assist Modal */}
      <Modal isOpen={aiOpen} onClose={() => setAiOpen(false)} title="AI Assist" size="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
              <select className="w-full border rounded px-2 py-1" value={aiScope} onChange={(e) => setAiScope(e.target.value as any)}>
                <option value="lesson">Single Lesson</option>
                <option value="section">Whole Section</option>
                <option value="standard">Standard</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Target: {aiTarget.secTitle || aiTarget.secKey}{aiScope==='lesson' && aiTarget.idx!=null ? ` • Row ${aiTarget.idx+1}` : ''}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">🤖 Model</label>
              <select className="w-full border rounded px-2 py-1" value={aiModel} onChange={(e) => setAiModel(e.target.value)}>
                <option value="gpt-5-mini-2025-08-07">gpt-5-mini-2025-08-07 (default)</option>
                <option value="gpt-5-mini-2025-08-07">gpt-5-mini-2025-08-07</option>
                <option value="o1-mini">o1-mini</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={aiWebSearch} onChange={(e) => setAiWebSearch(e.target.checked)} />
                <span className="text-sm text-gray-700">🌐 Enable web search (experimental)</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <select
                className="w-full border rounded px-2 py-1"
                value={aiTarget.secKey}
                onChange={(e) => {
                  const secKey = e.target.value
                  setAiTarget({ secKey, idx: aiScope === 'lesson' ? 0 : null, secTitle: String(payload?.sectionNamesByKey?.[secKey] || secKey) })
                  try {
                    const arr: any[] = Array.isArray(payload?.lessonsBySection?.[secKey]) ? payload!.lessonsBySection[secKey] : []
                    const firstCode = (arr.find((it) => (it?.standard_code || it?.code))?.standard_code || arr.find((it) => (it?.standard_code || it?.code))?.code || '') as string
                    setAiStandard(String(firstCode || ''))
                  } catch { setAiStandard('') }
                }}
              >
                {sectionsWithLessons.map((s) => (
                  <option key={s.key} value={s.key}>{s.title}</option>
                ))}
              </select>
            </div>
            {aiScope === 'lesson' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lesson</label>
                <select
                  className="w-full border rounded px-2 py-1"
                  value={String(aiTarget.idx ?? 0)}
                  onChange={(e) => setAiTarget((prev) => ({ ...prev, idx: Number(e.target.value) }))}
                >
                  {(Array.isArray(payload?.lessonsBySection?.[aiTarget.secKey]) ? payload!.lessonsBySection[aiTarget.secKey] : []).map((it: any, i: number) => (
                    <option key={i} value={String(i)}>{String(it.title || it.name || `Lesson ${i+1}`)}</option>
                  ))}
                </select>
              </div>
            )}
            {aiScope === 'standard' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Standard</label>
                <select
                  className="w-full border rounded px-2 py-1"
                  value={aiStandard}
                  onChange={(e) => setAiStandard(e.target.value)}
                >
                  {(() => {
                    const arr: any[] = Array.isArray(payload?.lessonsBySection?.[aiTarget.secKey]) ? payload!.lessonsBySection[aiTarget.secKey] : []
                    const codes = Array.from(new Set(arr.map((it: any) => String(it.standard_code || it.code || '').trim()).filter(Boolean)))
                    return codes.map((c, i) => <option key={i} value={c}>{c}</option>)
                  })()}
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Optional instructions</label>
            <textarea className="w-full border rounded px-2 py-1" rows={3} placeholder="e.g., tighten titles, fix NGSS codes, clarify notes about inquiry emphasis" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
          </div>
          {aiError && <div className="text-sm text-red-600">{aiError}</div>}
          {aiSuggestion && (
            <div className="bg-white border rounded p-3">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-2 px-3 font-bold text-gray-700 w-12">No</th>
                      <th className="text-left py-2 px-3 font-bold text-gray-700 w-40">STANDARD</th>
                      <th className="text-left py-2 px-3 font-bold text-gray-700">TITLE</th>
                      <th className="text-left py-2 px-3 font-bold text-gray-700 w-2/5">NOTES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildAiSuggestionRows().map((r, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-2 px-3 text-gray-900">{r.no}</td>
                        <td className="py-2 px-3 font-mono text-blue-600 text-xs">{r.standard}</td>
                        <td className="py-2 px-3 text-gray-900 font-medium">{r.title}</td>
                        <td className="py-2 px-3 text-gray-700">{r.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <details className="mt-3 text-xs text-gray-500">
                <summary className="cursor-pointer">View raw JSON</summary>
                <pre className="whitespace-pre-wrap break-words mt-2">{JSON.stringify(aiSuggestion, null, 2)}</pre>
              </details>
            </div>
          )}
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setAiOpen(false)}>Close</Button>
            <Button variant="primary" onClick={askAi} disabled={aiBusy}>{aiBusy ? 'Thinking…' : 'Ask AI'}</Button>
            <Button variant="success" onClick={applyAiSuggestion} disabled={!aiSuggestion}>Apply Changes</Button>
          </div>
        </div>
      </Modal>
    </ProtectedRoute>
  )
}
