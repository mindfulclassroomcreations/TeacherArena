import React, { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Button from '@/components/Button'

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

export default function ProductGenerationPage() {
  const [lessons, setLessons] = useState<LessonItem[]>([])
  const [summary, setSummary] = useState<SelectionSummary | null>(null)

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

  const title = '🛍️ Product Generation'

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600">Review your selected lessons and summary before generating products.</p>
        </div>

        {/* Summary */}
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
            <p className="text-sm text-blue-900">No summary found. Go back and select lessons.</p>
          )}
        </div>

        {/* Selected Lessons */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-900">Selected Lessons ({lessons.length})</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.open('/', '_blank')
                  }
                }}
                size="sm"
              >
                Open Builder
              </Button>
            </div>
          </div>
          {lessons.length === 0 ? (
            <p className="text-gray-600">No lessons selected.</p>
          ) : (
            <div className="space-y-3">
              {lessons.map((ls, idx) => (
                <div key={idx} className="p-3 border border-gray-200 rounded">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{ls.title || ls.name || `Lesson ${idx + 1}`}</p>
                      {ls.description && (
                        <p className="text-xs text-gray-600 mt-1">{ls.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {ls.standard_code && (
                        <span className="text-[11px] font-mono text-blue-800 bg-blue-100 px-2 py-1 rounded">{ls.standard_code}</span>
                      )}
                      {ls.lesson_code && (
                        <span className="text-[11px] font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">{ls.lesson_code}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Next Actions (placeholder for actual product generation workflow) */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Next: Generate Products</h3>
          <p className="text-sm text-green-900 mb-3">This is a placeholder. We can wire your product generation flow here (e.g., choose product types, formats, export settings).</p>
          <div className="flex items-center gap-2">
            <Button
              variant="success"
              onClick={() => alert('Product generation flow coming soon!')}
            >
              Generate Products
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.localStorage.removeItem('ta_selected_lessons')
                  window.localStorage.removeItem('ta_selection_context')
                  setLessons([])
                  setSummary(null)
                }
              }}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
