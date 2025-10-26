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

interface ProductTypeLesson {
  lesson: LessonItem
  source: {
    groupId: string
    subPageId: string
    subStandard: string
  }
}

export default function ProductTypePage() {
  const router = useRouter()
  const { typeNum } = router.query
  const [lessons, setLessons] = useState<ProductTypeLesson[]>([])
  const [loading, setLoading] = useState(true)

  const typeNumber = typeNum ? String(typeNum).padStart(2, '0') : ''

  // Load all lessons sent to this product type from all sub-pages
  const loadLessons = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const allLessons: ProductTypeLesson[] = []
        const allKeys = Object.keys(window.localStorage)

        allKeys.forEach((key) => {
          if (key.includes('ta_product_') && key.includes('_sent')) {
            const match = key.match(/ta_product_(.+?)_(.+?)_sent/)
            if (match) {
              const groupId = match[1]
              const subPageId = match[2]

              const sentData = window.localStorage.getItem(key)
              if (sentData) {
                const sent = JSON.parse(sentData) as Record<string, number[]>

                // Find lessons that were sent to this product type
                Object.keys(sent).forEach((lessonKey) => {
                  const typeNumbers = sent[lessonKey]
                  if (typeNumbers.includes(Number(typeNum))) {
                    // Get the actual lesson data
                    const groupedKey = `ta_product_${groupId}_${subPageId}_grouped`
                    const groupedData = window.localStorage.getItem(groupedKey)
                    if (groupedData) {
                      const grouped = JSON.parse(groupedData)
                      const [subStandard, lessonIdx] = lessonKey.split('_')
                      const group = grouped.find((g: any) => g.subStandard === subStandard)
                      if (group && group.lessons[Number(lessonIdx)]) {
                        allLessons.push({
                          lesson: group.lessons[Number(lessonIdx)],
                          source: {
                            groupId,
                            subPageId,
                            subStandard
                          }
                        })
                      }
                    }
                  }
                })
              }
            }
          }
        })

        setLessons(allLessons)
      } catch (e) {
        console.error('Error loading lessons:', e)
      }
      setLoading(false)
    }
  }, [typeNum])

  useEffect(() => {
    loadLessons()
  }, [loadLessons])

  if (!typeNum) {
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
            <p className="text-gray-600">Loading product type...</p>
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
                  ← Back to Products
                </button>
              </Link>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              PRODUCT TYPE - {typeNumber}
            </h1>
            <p className="text-gray-600">Lessons sent for this product type</p>
          </div>

          {/* Product Type Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">Product Type</h3>
              <ul className="space-y-2 text-sm text-purple-800">
                <li>• <strong>Type:</strong> {typeNumber}</li>
                <li>• <strong>Total Lessons:</strong> {lessons.length}</li>
                <li>• <strong>Status:</strong> Active</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                  📝 Edit Product
                </button>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
                  📥 Download
                </button>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-orange-900 mb-3">Product Stats</h3>
              <ul className="space-y-2 text-sm text-orange-800">
                <li>• <strong>Date Created:</strong> Today</li>
                <li>• <strong>Last Modified:</strong> Now</li>
                <li>• <strong>Version:</strong> 1.0</li>
              </ul>
            </div>
          </div>

          {/* Lessons Section */}
          {lessons.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Lessons ({lessons.length})</h2>
              <div className="space-y-4">
                {lessons.map((item, idx) => (
                  <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {item.lesson.title || item.lesson.name || `Lesson ${idx + 1}`}
                        </h3>
                        {item.lesson.description && (
                          <p className="text-sm text-gray-600 mb-3">{item.lesson.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {item.lesson.standard_code && (
                            <span className="text-xs font-mono text-blue-800 bg-blue-100 px-2 py-1 rounded">
                              {item.lesson.standard_code}
                            </span>
                          )}
                          {item.lesson.code && (
                            <span className="text-xs font-mono text-gray-800 bg-gray-200 px-2 py-1 rounded">
                              {item.lesson.code}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          <p><strong>Source:</strong> {item.source.groupId.toUpperCase()} &gt; {item.source.subPageId.toUpperCase()}</p>
                          <p><strong>Sub-Standard:</strong> {item.source.subStandard}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                          Edit
                        </button>
                        <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center mb-8">
              <div className="text-6xl mb-4">📭</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Lessons Yet</h2>
              <p className="text-gray-600 mb-6">
                This product type doesn&apos;t have any lessons yet. Go back to the product sub-pages and send lessons here.
              </p>
              <Link href="/product-generation">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  Back to Product Categories
                </button>
              </Link>
            </div>
          )}

          {/* Footer Actions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/product-generation">
                <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium">
                  ← Back to Categories
                </button>
              </Link>
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
