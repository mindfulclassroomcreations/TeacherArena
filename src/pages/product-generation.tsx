import React, { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Button from '@/components/Button'
import Link from 'next/link'

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

interface CategoryGroup {
  id: string
  name: string
  color: string
  icon: string
  subPages: Array<{ id: string; name: string }>
}

const categoryGroups: CategoryGroup[] = [
  {
    id: 'group-t',
    name: 'Group T',
    color: 'blue',
    icon: '📘',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `t-${String(i + 1).padStart(2, '0')}`,
      name: `T - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-a',
    name: 'Group A',
    color: 'red',
    icon: '🔴',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `a-${String(i + 1).padStart(2, '0')}`,
      name: `A - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-b',
    name: 'Group B',
    color: 'green',
    icon: '🟢',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `b-${String(i + 1).padStart(2, '0')}`,
      name: `B - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-c',
    name: 'Group C',
    color: 'yellow',
    icon: '🟡',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `c-${String(i + 1).padStart(2, '0')}`,
      name: `C - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-d',
    name: 'Group D',
    color: 'purple',
    icon: '🟣',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `d-${String(i + 1).padStart(2, '0')}`,
      name: `D - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-e',
    name: 'Group E',
    color: 'pink',
    icon: '🎀',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `e-${String(i + 1).padStart(2, '0')}`,
      name: `E - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-f',
    name: 'Group F',
    color: 'orange',
    icon: '🟠',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `f-${String(i + 1).padStart(2, '0')}`,
      name: `F - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-g',
    name: 'Group G',
    color: 'cyan',
    icon: '🔵',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `g-${String(i + 1).padStart(2, '0')}`,
      name: `G - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-h',
    name: 'Group H',
    color: 'teal',
    icon: '💎',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `h-${String(i + 1).padStart(2, '0')}`,
      name: `H - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-i',
    name: 'Group I',
    color: 'indigo',
    icon: '⭐',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `i-${String(i + 1).padStart(2, '0')}`,
      name: `I - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
]

const colorClasses: Record<string, { card: string; title: string; border: string }> = {
  blue: { card: 'bg-blue-50', title: 'text-blue-900', border: 'border-blue-200' },
  red: { card: 'bg-red-50', title: 'text-red-900', border: 'border-red-200' },
  green: { card: 'bg-green-50', title: 'text-green-900', border: 'border-green-200' },
  yellow: { card: 'bg-yellow-50', title: 'text-yellow-900', border: 'border-yellow-200' },
  purple: { card: 'bg-purple-50', title: 'text-purple-900', border: 'border-purple-200' },
  pink: { card: 'bg-pink-50', title: 'text-pink-900', border: 'border-pink-200' },
  orange: { card: 'bg-orange-50', title: 'text-orange-900', border: 'border-orange-200' },
  cyan: { card: 'bg-cyan-50', title: 'text-cyan-900', border: 'border-cyan-200' },
  teal: { card: 'bg-teal-50', title: 'text-teal-900', border: 'border-teal-200' },
  indigo: { card: 'bg-indigo-50', title: 'text-indigo-900', border: 'border-indigo-200' },
}

export default function ProductGenerationPage() {
  const [lessons, setLessons] = useState<LessonItem[]>([])
  const [summary, setSummary] = useState<SelectionSummary | null>(null)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

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
    <ProtectedRoute>
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{title}</h1>
            <p className="text-gray-600">Select a category and sub-page to generate your products.</p>
          </div>

          {/* Summary */}
          {summary && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
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
            </div>
          )}

          {/* Selected Lessons */}
          {lessons.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Selected Lessons ({lessons.length})</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {lessons.map((ls, idx) => (
                  <div key={idx} className="p-3 border border-gray-200 rounded bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{ls.title || ls.name || `Lesson ${idx + 1}`}</p>
                        {ls.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{ls.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        {ls.standard_code && (
                          <span className="text-[11px] font-mono text-blue-800 bg-blue-100 px-2 py-1 rounded whitespace-nowrap">
                            {ls.standard_code}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Groups */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryGroups.map((group) => {
                const colors = colorClasses[group.color]
                const isExpanded = expandedGroup === group.id

                return (
                  <div
                    key={group.id}
                    className={`${colors.card} border-2 ${colors.border} rounded-lg overflow-hidden transition-all`}
                  >
                    {/* Group Header - Always Visible */}
                    <button
                      onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                      className="w-full px-4 py-4 flex items-center justify-between hover:bg-opacity-80 transition-all"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{group.icon}</span>
                        <div className="text-left">
                          <h3 className={`text-lg font-bold ${colors.title}`}>{group.name}</h3>
                          <p className={`text-xs ${colors.title} opacity-75`}>{group.subPages.length} sub-pages</p>
                        </div>
                      </div>
                      <span className={`text-xl transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                    </button>

                    {/* Sub-pages Grid - Expandable */}
                    {isExpanded && (
                      <div className="border-t-2 border-opacity-20 px-4 py-4">
                        <div className="grid grid-cols-3 gap-2">
                          {group.subPages.map((subPage) => (
                            <Link
                              key={subPage.id}
                              href={`/products/${group.id}/${subPage.id}`}
                            >
                              <button className="w-full px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors text-xs font-medium text-gray-900">
                                {subPage.name}
                              </button>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  ← Back to Builder
                </button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
