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

interface GroupedProductLesson {
  subStandard: string
  lessons: ProductTypeLesson[]
}

interface EditingLesson {
  [key: string]: LessonItem
}

export default function ProductTypePage() {
  const router = useRouter()
  const { typeNum } = router.query
  const [groupedLessons, setGroupedLessons] = useState<GroupedProductLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingLessons, setEditingLessons] = useState<EditingLesson>({})
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showLessonGenerateModal, setShowLessonGenerateModal] = useState(false)
  const [generatingLessonKey, setGeneratingLessonKey] = useState<string | null>(null)
  const [allSources, setAllSources] = useState<Set<{ categoryId: string; subPageId: string }>>(new Set())

  const typeNumber = typeNum ? String(typeNum).padStart(2, '0') : ''

  // Save lessons to persistent storage for this product type
  const saveLessonsToProductType = (lessons: GroupedProductLesson[]) => {
    if (typeof window !== 'undefined' && typeNum) {
      try {
        const storageKey = `ta_product_type_${typeNum}_lessons`
        window.localStorage.setItem(storageKey, JSON.stringify(lessons))
      } catch (e) {
        console.error('Error saving product type lessons:', e)
      }
    }
  }

  // Load all lessons sent to this product type from all sub-pages
  const loadLessons = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        // First check if there are persisted lessons for this product type
        const persistedKey = `ta_product_type_${typeNum}_lessons`
        const persistedData = window.localStorage.getItem(persistedKey)
        
        if (persistedData) {
          try {
            const persistedLessons = JSON.parse(persistedData) as GroupedProductLesson[]
            setGroupedLessons(persistedLessons)
            setLoading(false)
            return
          } catch (e) {
            console.warn('Could not parse persisted lessons, loading from sent data')
          }
        }

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

        // Group lessons by sub-standard
        const grouped: GroupedProductLesson[] = []
        const sources = new Set<string>()
        allLessons.forEach((lessonItem) => {
          const subStandard = lessonItem.source.subStandard
          let group = grouped.find((g) => g.subStandard === subStandard)
          if (!group) {
            group = { subStandard, lessons: [] }
            grouped.push(group)
          }
          group.lessons.push(lessonItem)
          // Track unique sources
          sources.add(JSON.stringify({ categoryId: lessonItem.source.groupId, subPageId: lessonItem.source.subPageId }))
        })

        setGroupedLessons(grouped)
        // Store sources for breadcrumb navigation
        setAllSources(new Set(Array.from(sources).map(s => JSON.parse(s))))
        // Save to persistent storage
        if (grouped.length > 0) {
          saveLessonsToProductType(grouped)
        }
      } catch (e) {
        console.error('Error loading lessons:', e)
      }
      setLoading(false)
    }
  }, [typeNum])

  useEffect(() => {
    loadLessons()
  }, [loadLessons])

  const getLessonKey = (index: number, subStandard: string) => `${subStandard}_${index}`

  const handleStartEdit = (lessonKey: string, lesson: LessonItem) => {
    setEditingId(lessonKey)
    setEditingLessons({
      [lessonKey]: { ...lesson }
    })
  }

  const handleEditChange = (lessonKey: string, field: keyof LessonItem, value: string) => {
    setEditingLessons({
      [lessonKey]: {
        ...editingLessons[lessonKey],
        [field]: value
      }
    })
  }

  const handleSaveEdit = (groupIdx: number, lessonIdx: number) => {
    const lessonKey = getLessonKey(lessonIdx, groupedLessons[groupIdx].subStandard)
    if (editingLessons[lessonKey]) {
      const newGrouped = [...groupedLessons]
      newGrouped[groupIdx].lessons[lessonIdx].lesson = editingLessons[lessonKey]
      setGroupedLessons(newGrouped)
      saveLessonsToProductType(newGrouped)
    }
    setEditingId(null)
    setEditingLessons({})
    alert('Lesson updated successfully!')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingLessons({})
  }

  const handleRemoveLesson = (groupIdx: number, lessonIdx: number) => {
    if (confirm('Are you sure you want to remove this lesson?')) {
      const newGrouped = [...groupedLessons]
      newGrouped[groupIdx].lessons.splice(lessonIdx, 1)
      if (newGrouped[groupIdx].lessons.length === 0) {
        newGrouped.splice(groupIdx, 1)
      }
      setGroupedLessons(newGrouped)
      saveLessonsToProductType(newGrouped)
    }
  }

  const handleGenerateLesson = (lessonKey: string) => {
    setGeneratingLessonKey(lessonKey)
    setShowLessonGenerateModal(true)
  }

  // Get unique categories and sub-pages from all sources
  const getCategorySubPageLinks = () => {
    const sourceArray = Array.from(allSources)
    const uniqueCategories = new Map<string, Set<string>>()
    sourceArray.forEach((source: any) => {
      if (!uniqueCategories.has(source.categoryId)) {
        uniqueCategories.set(source.categoryId, new Set())
      }
      uniqueCategories.get(source.categoryId)!.add(source.subPageId)
    })
    return uniqueCategories
  }

  const getCategoryName = (categoryId: string) => {
    const categoryMap: Record<string, string> = {
      'group-t': 'Group T',
      'group-a': 'Group A',
      'group-b': 'Group B',
      'group-c': 'Group C',
      'group-d': 'Group D',
      'group-e': 'Group E',
      'group-f': 'Group F',
      'group-g': 'Group G',
      'group-h': 'Group H',
      'group-i': 'Group I',
      'group-j': 'Group J',
    }
    return categoryMap[categoryId] || categoryId
  }

  const totalLessons = groupedLessons.reduce((sum, g) => sum + g.lessons.length, 0)

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

            {/* Breadcrumb Navigation */}
            {allSources.size > 0 && (
              <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Source Navigation</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(getCategorySubPageLinks().entries()).map(([categoryId, subPages]) => (
                    <div key={categoryId} className="flex gap-2 items-center">
                      <Link href={`/products/${categoryId}`}>
                        <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium">
                          📁 {getCategoryName(categoryId)}
                        </button>
                      </Link>
                      {Array.from(subPages).map((subPageId) => (
                        <Link key={subPageId} href={`/products/${categoryId}/${subPageId}`}>
                          <button className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors font-medium">
                            📄 {subPageId.toUpperCase()}
                          </button>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                <li>• <strong>Total Lessons:</strong> {totalLessons}</li>
                <li>• <strong>Status:</strong> Active</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  🔧 Generate Product
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

          {/* Generate Product Modal */}
          {showGenerateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Product</h3>
                <p className="text-gray-600 mb-6">
                  This will generate a product document from all {totalLessons} lesson(s) in this product type.
                </p>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                    Generate PDF
                  </button>
                  <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                    Generate Excel
                  </button>
                  <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
                    Generate Word
                  </button>
                </div>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Generate Individual Lesson Modal */}
          {showLessonGenerateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Lesson</h3>
                <p className="text-gray-600 mb-6">
                  Generate this lesson as a standalone document in your preferred format.
                </p>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                    📄 Generate PDF
                  </button>
                  <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                    📊 Generate Excel
                  </button>
                  <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
                    📝 Generate Word
                  </button>
                </div>
                <button
                  onClick={() => setShowLessonGenerateModal(false)}
                  className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Lessons Section */}
          {totalLessons > 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Lessons ({totalLessons})</h2>
              <div className="space-y-4">
                {groupedLessons.map((group, groupIdx) => (
                  <div key={groupIdx} className="bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-yellow-100 border-b border-yellow-200">
                      <h3 className="font-semibold text-yellow-900">
                        Sub-Standard: {group.subStandard}
                      </h3>
                      <p className="text-xs text-yellow-800">{group.lessons.length} lesson{group.lessons.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="p-4 space-y-3">
                      {group.lessons.map((item, lessonIdx) => {
                        const lessonKey = getLessonKey(lessonIdx, group.subStandard)
                        const isEditing = editingId === lessonKey
                        const editLesson = editingLessons[lessonKey] || item.lesson

                        return (
                          <div key={lessonIdx} className="p-4 border border-gray-200 rounded-lg bg-white">
                            {isEditing ? (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                                  <input
                                    type="text"
                                    value={editLesson.title || ''}
                                    onChange={(e) => handleEditChange(lessonKey, 'title', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                  <textarea
                                    value={editLesson.description || ''}
                                    onChange={(e) => handleEditChange(lessonKey, 'description', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Standard Code</label>
                                    <input
                                      type="text"
                                      value={editLesson.standard_code || ''}
                                      onChange={(e) => handleEditChange(lessonKey, 'standard_code', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Code</label>
                                    <input
                                      type="text"
                                      value={editLesson.code || ''}
                                      onChange={(e) => handleEditChange(lessonKey, 'code', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSaveEdit(groupIdx, lessonIdx)}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                                  >
                                    ✓ Save
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium text-sm"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-start justify-between gap-4 mb-2">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 mb-1">
                                      {item.lesson.title || item.lesson.name || `Lesson ${lessonIdx + 1}`}
                                    </h3>
                                    {item.lesson.description && (
                                      <p className="text-sm text-gray-600 mb-2">{item.lesson.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-2 mb-2">
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
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded mb-3">
                                  <p><strong>Source:</strong> {item.source.groupId.toUpperCase()} &gt; {item.source.subPageId.toUpperCase()}</p>
                                  <p><strong>Sub-Standard:</strong> {item.source.subStandard}</p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleStartEdit(lessonKey, item.lesson)}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    onClick={() => handleGenerateLesson(lessonKey)}
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm"
                                  >
                                    🔧 Generate
                                  </button>
                                  <button
                                    onClick={() => handleRemoveLesson(groupIdx, lessonIdx)}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
                                  >
                                    🗑️ Remove
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
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
