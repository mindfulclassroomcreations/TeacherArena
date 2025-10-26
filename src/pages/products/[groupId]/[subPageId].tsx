import React, { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Button from '@/components/Button'
import Link from 'next/link'
import { useRouter } from 'next/router'

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

export default function ProductPage() {
  const router = useRouter()
  const { groupId, subPageId } = router.query
  const [lessons, setLessons] = useState<LessonItem[]>([])
  const [summary, setSummary] = useState<SelectionSummary | null>(null)
  const [loading, setLoading] = useState(true)

  // Format the display name from URL
  const groupName = groupId ? (typeof groupId === 'string' ? groupId.replace('group-', '').toUpperCase() : '') : ''
  const subPageName = subPageId ? (typeof subPageId === 'string' ? subPageId.replace(/-/g, ' ').toUpperCase() : '') : ''

  // Fetch lessons from localStorage when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && groupId && subPageId) {
      try {
        const storageKey = `ta_product_${groupId}_${subPageId}_lessons`
        const summaryKey = `ta_product_${groupId}_${subPageId}_summary`
        
        const lessonsData = window.localStorage.getItem(storageKey)
        const summaryData = window.localStorage.getItem(summaryKey)
        
        if (lessonsData) {
          setLessons(JSON.parse(lessonsData) || [])
        }
        if (summaryData) {
          setSummary(JSON.parse(summaryData) || null)
        }
      } catch (e) {
        console.error('Error loading lessons:', e)
      }
      setLoading(false)
    }
  }, [groupId, subPageId])

  if (!groupId || !subPageId) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="max-w-6xl mx-auto text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="max-w-6xl mx-auto text-center py-12">
            <p className="text-gray-600">Loading lessons...</p>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Link href="/product-generation">
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  ← Back to Categories
                </button>
              </Link>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {groupName} - {subPageName}
            </h1>
            <p className="text-gray-600">Product content for {groupName} {subPageName}</p>
          </div>

          {/* Context Summary */}
          {summary && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <h3 className="font-semibold text-blue-900 mb-3">Selection Context</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {summary.country && (
                  <div>
                    <p className="text-xs font-semibold text-blue-900 uppercase">Country</p>
                    <p className="text-sm text-blue-800">{summary.country}</p>
                  </div>
                )}
                {summary.state && (
                  <div>
                    <p className="text-xs font-semibold text-blue-900 uppercase">State</p>
                    <p className="text-sm text-blue-800">{summary.state}</p>
                  </div>
                )}
                {summary.curriculum_name && (
                  <div>
                    <p className="text-xs font-semibold text-blue-900 uppercase">Curriculum</p>
                    <p className="text-sm text-blue-800">{summary.curriculum_name}</p>
                  </div>
                )}
                {summary.grade && (
                  <div>
                    <p className="text-xs font-semibold text-blue-900 uppercase">Grade</p>
                    <p className="text-sm text-blue-800">{summary.grade}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lessons Content */}
          {lessons.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Added Lessons ({lessons.length})</h2>
              <div className="space-y-3">
                {lessons.map((lesson, idx) => (
                  <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {lesson.title || lesson.name || `Lesson ${idx + 1}`}
                        </h4>
                        {lesson.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{lesson.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {lesson.standard_code && (
                            <span className="text-[11px] font-mono text-blue-800 bg-blue-100 px-2 py-1 rounded">
                              {lesson.standard_code}
                            </span>
                          )}
                          {lesson.code && (
                            <span className="text-[11px] font-mono text-gray-800 bg-gray-200 px-2 py-1 rounded">
                              {lesson.code}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  {groupName} {subPageName}
                </h2>
                <p className="text-gray-600 mb-6">
                  No lessons added yet. Go back to the lesson builder and add lessons to this sub-page.
                </p>
              </div>
            </div>
          )}

          {/* Product Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Product Details</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• <strong>Group:</strong> {groupName}</li>
                <li>• <strong>Sub-Page:</strong> {subPageName}</li>
                <li>• <strong>Lessons:</strong> {lessons.length}</li>
                <li>• <strong>Type:</strong> Educational Product</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                  📥 Download Product
                </button>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  👁️ Preview
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/product-generation">
                <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium">
                  ← Back to Categories
                </button>
              </Link>
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
              <Link href="/">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  🏠 Back to Builder
                </button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
