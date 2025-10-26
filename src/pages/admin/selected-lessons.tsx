import React, { useEffect, useMemo, useState } from 'react'
import Layout from '@/components/Layout'
import Button from '@/components/Button'
import { useRouter } from 'next/router'
import { useAdminAuth } from '@/hooks/useAdminAuth'

interface LessonItem {
  title?: string
  name?: string
  description?: string
  standard_code?: string
  code?: string
  lesson_code?: string
}

interface SelectionSummary {
  country?: string | null
  state?: string | null
  curriculum_name?: string | null
  grade?: string | null
  section?: string | null
  sub_standards?: string[]
}

export default function AdminSelectedLessons() {
  const { isAuthed, ready } = useAdminAuth()
  const router = useRouter()
  const [lessons, setLessons] = useState<LessonItem[]>([])
  const [summary, setSummary] = useState<SelectionSummary | null>(null)

  useEffect(() => {
    if (ready && !isAuthed) router.replace('/admin/login')
  }, [ready, isAuthed, router])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const rawLessons = window.localStorage.getItem('ta_selected_lessons')
        const rawSummary = window.localStorage.getItem('ta_selection_context')
        if (rawLessons) setLessons(JSON.parse(rawLessons) || [])
        if (rawSummary) setSummary(JSON.parse(rawSummary) || null)
      } catch {
        // ignore
      }
    }
  }, [])

  const grouped = useMemo(() => {
    const map = new Map<string, LessonItem[]>()
    lessons.forEach((ls) => {
      const code = String(ls.standard_code || ls.code || 'Unknown')
      if (!map.has(code)) map.set(code, [])
      map.get(code)!.push(ls)
    })
    return Array.from(map.entries()).map(([code, list]) => ({ code, list }))
  }, [lessons])

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Selected Lessons</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/admin')}>Back</Button>
          <Button variant="primary" onClick={() => { if (typeof window !== 'undefined') window.open('/product-generation', '_blank') }}>Open Product Generation</Button>
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        {summary ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-semibold text-blue-900 uppercase">Country</p>
              <p className="text-sm text-blue-800">{summary.country || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-900 uppercase">State/Region</p>
              <p className="text-sm text-blue-800">{summary.state || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-900 uppercase">Curriculum</p>
              <p className="text-sm text-blue-800">{summary.curriculum_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-900 uppercase">Grade</p>
              <p className="text-sm text-blue-800">{summary.grade || '—'}</p>
            </div>
            <div className="sm:col-span-2 md:col-span-3">
              <p className="text-xs font-semibold text-blue-900 uppercase">Sub-standards</p>
              {summary.sub_standards && summary.sub_standards.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-1">
                  {summary.sub_standards.map((s, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-blue-800">—</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-blue-900">No summary found.</p>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Lessons ({lessons.length})</h2>
        {lessons.length === 0 ? (
          <p className="text-gray-600">No lessons selected.</p>
        ) : (
          <div className="space-y-4">
            {grouped.map((g, gi) => (
              <div key={gi} className="border border-gray-200 rounded">
                <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-blue-800 bg-blue-100 px-2 py-1 rounded">{g.code}</span>
                    <span className="text-xs text-gray-600">{g.list.length} lesson{g.list.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  {g.list.map((ls, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium text-gray-900">{ls.title || ls.name || `Lesson ${idx + 1}`}</p>
                        {ls.lesson_code && (
                          <span className="text-[11px] font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">{ls.lesson_code}</span>
                        )}
                      </div>
                      {ls.description && <p className="text-xs text-gray-600 mt-1">{ls.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
