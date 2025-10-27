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
    const next = { ...payload, lessonsBySection: {}, sectionOrder: [] }
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
      arc.unshift({ savedAt: new Date().toISOString(), data: payload })
      if (arc.length > 10) arc.length = 10
      window.localStorage.setItem('ta_tables_archive', JSON.stringify(arc))
      setArchives(arc)
      alert('Current tables archived.')
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
                      ls.standard_code || ls.code || ''
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
                      ls.title || ls.name || ''
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
                      ls.description || ''
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
            <p className="text-gray-600 mb-4">No data loaded. From Step 5, click &quot;Open Tables (New Tab)&quot; to load your latest tables here.</p>
            <Button variant="primary" onClick={() => window.location.href = '/'}>Go to Generate Lessons</Button>
          </div>
        ) : sectionsWithLessons.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded p-6 text-center">
            <p className="text-gray-600 mb-2">All lessons have been deleted or archived.</p>
            <p className="text-gray-500 text-sm mb-4">Generate new lessons from Step 5 to populate the tables.</p>
            <Button variant="primary" onClick={() => window.location.href = '/'}>Go to Generate Lessons</Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={toggleSelectAllSections}>Select All Tables</Button>
                <span className="text-sm text-gray-600">
                  {Object.values(selectedSections).filter(Boolean).length} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleArchiveCurrent}>Archive Current Tables</Button>
                <Button size="sm" variant="outline" onClick={askDeleteAll} className="border-red-300 text-red-600 hover:bg-red-50 focus:ring-red-400">Delete All Tables</Button>
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
                  </div>
                </div>
                {renderSectionTable(sec.key, sec.items)}
              </div>
            ))}

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
    </ProtectedRoute>
  )
}
