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

interface GroupedLesson {
  subStandard: string
  lessons: LessonItem[]
}

interface LessonSelection {
  [key: string]: boolean
}

interface SentToProduct {
  [key: string]: number[] // Map of lesson keys to product type numbers
}

export default function ProductPage() {
  const router = useRouter()
  const { groupId, subPageId } = router.query
  const [groupedLessons, setGroupedLessons] = useState<GroupedLesson[]>([])
  const [archivedGroupedLessons, setArchivedGroupedLessons] = useState<GroupedLesson[]>([])
  const [summary, setSummary] = useState<SelectionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [lessonSelections, setLessonSelections] = useState<LessonSelection>({})
  const [sentToProducts, setSentToProducts] = useState<SentToProduct>({})
  const [showProductTypes, setShowProductTypes] = useState(false)
  const [showProductTypeModal, setShowProductTypeModal] = useState(false)

  // Format the display name from URL
  const groupName = groupId ? (typeof groupId === 'string' ? groupId.replace('group-', '').toUpperCase() : '') : ''
  const subPageName = subPageId ? (typeof subPageId === 'string' ? subPageId.replace(/-/g, ' ').toUpperCase() : '') : ''

  // Load lessons from localStorage
  const loadLessons = React.useCallback(() => {
    if (typeof window !== 'undefined' && groupId && subPageId) {
      try {
        const groupedKey = `ta_product_${groupId}_${subPageId}_grouped`
        const archivedKey = `ta_product_${groupId}_${subPageId}_archived`
        const summaryKey = `ta_product_${groupId}_${subPageId}_summary`
        const sentKey = `ta_product_${groupId}_${subPageId}_sent`
        
        const groupedData = window.localStorage.getItem(groupedKey)
        const archivedData = window.localStorage.getItem(archivedKey)
        const summaryData = window.localStorage.getItem(summaryKey)
        const sentData = window.localStorage.getItem(sentKey)
        
        if (groupedData) {
          setGroupedLessons(JSON.parse(groupedData) || [])
        }
        if (archivedData) {
          setArchivedGroupedLessons(JSON.parse(archivedData) || [])
        }
        if (summaryData) {
          setSummary(JSON.parse(summaryData) || null)
        }
        if (sentData) {
          setSentToProducts(JSON.parse(sentData) || {})
        }
      } catch (e) {
        console.error('Error loading lessons:', e)
      }
      setLoading(false)
    }
  }, [groupId, subPageId])

  // Save lessons to localStorage
  const saveLessons = (grouped: GroupedLesson[], archived: GroupedLesson[], sent?: SentToProduct) => {
    if (typeof window !== 'undefined' && groupId && subPageId) {
      try {
        const groupedKey = `ta_product_${groupId}_${subPageId}_grouped`
        const archivedKey = `ta_product_${groupId}_${subPageId}_archived`
        const sentKey = `ta_product_${groupId}_${subPageId}_sent`
        window.localStorage.setItem(groupedKey, JSON.stringify(grouped))
        window.localStorage.setItem(archivedKey, JSON.stringify(archived))
        if (sent) {
          window.localStorage.setItem(sentKey, JSON.stringify(sent))
        }
      } catch (e) {
        console.error('Error saving lessons:', e)
      }
    }
  }

  useEffect(() => {
    loadLessons()
  }, [loadLessons])

  const handleArchiveLessons = () => {
    const newArchived = [...archivedGroupedLessons, ...groupedLessons]
    setArchivedGroupedLessons(newArchived)
    setGroupedLessons([])
    saveLessons([], newArchived)
  }

  const handleDeleteLessons = () => {
    if (confirm('Are you sure you want to delete all lessons? This cannot be undone.')) {
      setGroupedLessons([])
      saveLessons([], archivedGroupedLessons)
    }
  }

  const handleUnarchiveLessons = () => {
    const newGrouped = [...groupedLessons, ...archivedGroupedLessons]
    setGroupedLessons(newGrouped)
    setArchivedGroupedLessons([])
    saveLessons(newGrouped, [])
    setShowArchived(false)
  }

  const handleDeleteArchivedLesson = (indexToRemove: number) => {
    const newArchived = archivedGroupedLessons.filter((_, idx) => idx !== indexToRemove)
    setArchivedGroupedLessons(newArchived)
    saveLessons(groupedLessons, newArchived)
  }

  const getLessonKey = (subStandard: string, lessonIdx: number) => {
    return `${subStandard}_${lessonIdx}`
  }

  const handleLessonToggle = (subStandard: string, lessonIdx: number) => {
    const key = getLessonKey(subStandard, lessonIdx)
    setLessonSelections((prev) => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSelectAllLessons = () => {
    const newSelections: LessonSelection = {}
    groupedLessons.forEach((group) => {
      group.lessons.forEach((_, lessonIdx) => {
        newSelections[getLessonKey(group.subStandard, lessonIdx)] = true
      })
    })
    setLessonSelections(newSelections)
  }

  const handleDeselectAllLessons = () => {
    setLessonSelections({})
  }

  const handleSelectCategory = (subStandard: string) => {
    const newSelections = { ...lessonSelections }
    const group = groupedLessons.find((g) => g.subStandard === subStandard)
    if (group) {
      const allSelected = group.lessons.every((_, lessonIdx) => 
        newSelections[getLessonKey(subStandard, lessonIdx)]
      )
      if (allSelected) {
        // Deselect all in this category
        group.lessons.forEach((_, lessonIdx) => {
          delete newSelections[getLessonKey(subStandard, lessonIdx)]
        })
      } else {
        // Select all in this category
        group.lessons.forEach((_, lessonIdx) => {
          newSelections[getLessonKey(subStandard, lessonIdx)] = true
        })
      }
    }
    setLessonSelections(newSelections)
  }

  const getSelectedLessonCount = () => {
    return Object.values(lessonSelections).filter(Boolean).length
  }

  const isCategoryFullySelected = (subStandard: string) => {
    const group = groupedLessons.find((g) => g.subStandard === subStandard)
    if (!group) return false
    return group.lessons.every((_, lessonIdx) => 
      lessonSelections[getLessonKey(subStandard, lessonIdx)]
    )
  }

  const handleArchiveSelectedLessons = () => {
    if (getSelectedLessonCount() === 0) {
      alert('Please select at least one lesson to archive.')
      return
    }
    
    const newGrouped: GroupedLesson[] = []
    const selectedToArchive: GroupedLesson[] = []
    
    groupedLessons.forEach((group) => {
      const remainingLessons = group.lessons.filter((_, lessonIdx) => 
        !lessonSelections[getLessonKey(group.subStandard, lessonIdx)]
      )
      const archivedLessons = group.lessons.filter((_, lessonIdx) => 
        lessonSelections[getLessonKey(group.subStandard, lessonIdx)]
      )
      
      if (remainingLessons.length > 0) {
        newGrouped.push({ subStandard: group.subStandard, lessons: remainingLessons })
      }
      if (archivedLessons.length > 0) {
        selectedToArchive.push({ subStandard: group.subStandard, lessons: archivedLessons })
      }
    })
    
    const newArchived = [...archivedGroupedLessons, ...selectedToArchive]
    setGroupedLessons(newGrouped)
    setArchivedGroupedLessons(newArchived)
    saveLessons(newGrouped, newArchived)
    setLessonSelections({})
  }

  const handleDeleteSelectedLessons = () => {
    if (getSelectedLessonCount() === 0) {
      alert('Please select at least one lesson to delete.')
      return
    }
    
    if (!confirm(`Delete ${getSelectedLessonCount()} selected lesson(s)? This cannot be undone.`)) {
      return
    }
    
    const newGrouped: GroupedLesson[] = []
    
    groupedLessons.forEach((group) => {
      const remainingLessons = group.lessons.filter((_, lessonIdx) => 
        !lessonSelections[getLessonKey(group.subStandard, lessonIdx)]
      )
      
      if (remainingLessons.length > 0) {
        newGrouped.push({ subStandard: group.subStandard, lessons: remainingLessons })
      }
    })
    
    setGroupedLessons(newGrouped)
    saveLessons(newGrouped, archivedGroupedLessons)
    setLessonSelections({})
  }

  const handleGenerateProductType = (typeNum: number) => {
    console.log(`Generating product type ${typeNum} with ${getSelectedLessonCount()} selected lessons`)
    // TODO: Implement product generation logic
  }

  const handleSendToProductType = (typeNum: number) => {
    if (getSelectedLessonCount() === 0) {
      alert('Please select at least one lesson to send to product generation.')
      return
    }

    const newSent = { ...sentToProducts }
    groupedLessons.forEach((group) => {
      group.lessons.forEach((_, lessonIdx) => {
        const key = getLessonKey(group.subStandard, lessonIdx)
        if (lessonSelections[key]) {
          if (!newSent[key]) {
            newSent[key] = []
          }
          if (!newSent[key].includes(typeNum)) {
            newSent[key].push(typeNum)
          }
        }
      })
    })

    setSentToProducts(newSent)
    saveLessons(groupedLessons, archivedGroupedLessons, newSent)
    setLessonSelections({})
    setShowProductTypeModal(false)
    alert(`${getSelectedLessonCount()} lesson(s) sent to PRODUCT TYPE - ${String(typeNum).padStart(2, '0')}`)
  }

  const totalLessons = groupedLessons.reduce((sum, g) => sum + g.lessons.length, 0)
  const totalArchived = archivedGroupedLessons.reduce((sum, g) => sum + g.lessons.length, 0)

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

          {/* Current Lessons Section */}
          {!showArchived && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Added Lessons ({totalLessons})</h2>
                {totalLessons > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleArchiveLessons}
                    >
                      📦 Archive All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteLessons}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      🗑️ Delete All
                    </Button>
                  </div>
                )}
              </div>

              {totalLessons > 0 ? (
                <>
                  {/* Lesson Selection Controls */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="font-semibold text-blue-900">Select Lessons ({getSelectedLessonCount()})</h3>
                      <div className="flex gap-1 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAllLessons}
                        >
                          ✓ Select All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDeselectAllLessons}
                        >
                          ✗ Deselect All
                        </Button>
                        {getSelectedLessonCount() > 0 && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleArchiveSelectedLessons}
                              className="text-orange-600 border-orange-300 hover:bg-orange-50"
                            >
                              📦 Archive Selected
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDeleteSelectedLessons}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              🗑️ Delete Selected
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowProductTypeModal(true)}
                              className="text-purple-600 border-purple-300 hover:bg-purple-50"
                            >
                              ➕ Add to Product Generation
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Product Type Modal */}
                  {showProductTypeModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-96 overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Select Product Type - Send {getSelectedLessonCount()} Lesson(s)
                          </h3>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-2">
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((typeNum) => (
                            <button
                              key={typeNum}
                              onClick={() => handleSendToProductType(typeNum)}
                              className="px-3 py-2 bg-purple-100 text-purple-900 rounded hover:bg-purple-200 transition-colors font-medium text-sm"
                            >
                              PRODUCT TYPE - {String(typeNum).padStart(2, '0')}
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-gray-200 p-4 flex justify-end gap-2">
                          <button
                            onClick={() => setShowProductTypeModal(false)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lessons Display */}
                  <div className="space-y-4">
                    {groupedLessons.map((group, groupIdx) => (
                      <div key={groupIdx} className="bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-yellow-100 border-b border-yellow-200 flex items-center justify-between flex-wrap gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-yellow-900">
                              Sub-Standard: {group.subStandard}
                            </h3>
                            <p className="text-xs text-yellow-800">{group.lessons.length} lesson{group.lessons.length !== 1 ? 's' : ''}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectCategory(group.subStandard)}
                            className={`whitespace-nowrap ${
                              isCategoryFullySelected(group.subStandard)
                                ? 'bg-yellow-300 text-yellow-900 border-yellow-400'
                                : 'text-yellow-700 border-yellow-300'
                            }`}
                          >
                            {isCategoryFullySelected(group.subStandard) ? '✓ Selected' : 'Select Category'}
                          </Button>
                        </div>
                        <div className="p-4 space-y-3">
                          {group.lessons.map((lesson, lessonIdx) => {
                            const key = getLessonKey(group.subStandard, lessonIdx)
                            const isSelected = lessonSelections[key]
                            return (
                              <div
                                key={lessonIdx}
                                className={`p-3 rounded border-2 transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-yellow-100 border-yellow-400'
                                    : 'bg-white border-yellow-200 hover:bg-gray-50'
                                }`}
                                onClick={() => handleLessonToggle(group.subStandard, lessonIdx)}
                              >
                                <div className="flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleLessonToggle(group.subStandard, lessonIdx)}
                                    className="mt-1 w-5 h-5 cursor-pointer flex-shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-1">
                                      {lesson.title || lesson.name || `Lesson ${lessonIdx + 1}`}
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
                                      {sentToProducts[key] && sentToProducts[key].length > 0 && (
                                        <div className="w-full">
                                          <p className="text-[10px] font-semibold text-green-700 mb-1">Sent to:</p>
                                          <div className="flex flex-wrap gap-1">
                                            {sentToProducts[key].map((typeNum) => (
                                              <span
                                                key={typeNum}
                                                className="text-[10px] font-mono text-white bg-green-600 px-2 py-1 rounded"
                                              >
                                                TYPE-{String(typeNum).padStart(2, '0')}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No lessons added yet. Go back to the lesson builder and add lessons to this sub-page.</p>
                </div>
              )}
            </div>
          )}

          {/* Archived Lessons Section */}
          {showArchived && (
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">📦 Archived Lessons ({totalArchived})</h2>
                {totalArchived > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleUnarchiveLessons}
                  >
                    ↩️ Unarchive All
                  </Button>
                )}
              </div>

              {totalArchived > 0 ? (
                <div className="space-y-4">
                  {archivedGroupedLessons.map((group, groupIdx) => (
                    <div key={groupIdx} className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                      <div className="px-4 py-3 bg-gray-200 border-b border-gray-300 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Sub-Standard: {group.subStandard}
                          </h3>
                          <p className="text-xs text-gray-700">{group.lessons.length} lesson{group.lessons.length !== 1 ? 's' : ''}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteArchivedLesson(groupIdx)}
                          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="p-4 space-y-3">
                        {group.lessons.map((lesson, lessonIdx) => (
                          <div key={lessonIdx} className="p-3 bg-gray-50 border border-gray-200 rounded">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {lesson.title || lesson.name || `Lesson ${lessonIdx + 1}`}
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
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No archived lessons yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Toggle Archived View Button */}
          <div className="mb-8">
            <Button
              variant="outline"
              onClick={() => setShowArchived(!showArchived)}
            >
              {showArchived ? '📝 Back to Current Lessons' : `📦 View Archived (${totalArchived})`}
            </Button>
          </div>

          {/* Product Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Product Details</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• <strong>Group:</strong> {groupName}</li>
                <li>• <strong>Sub-Page:</strong> {subPageName}</li>
                <li>• <strong>Current Lessons:</strong> {totalLessons}</li>
                <li>• <strong>Archived Lessons:</strong> {totalArchived}</li>
                <li>• <strong>Selected Lessons:</strong> {getSelectedLessonCount()}</li>
              </ul>
            </div>

            {/* Actions Section */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">Actions</h3>
              
              {/* Generate Products Button with Dropdown */}
              <div className="mb-4 relative">
                <button
                  onClick={() => setShowProductTypes(!showProductTypes)}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-between"
                >
                  <span>🔧 Generate Products</span>
                  <span className={`transform transition-transform ${showProductTypes ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {/* Product Type Dropdown */}
                {showProductTypes && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-purple-300 rounded-lg shadow-lg z-10 p-2 grid grid-cols-2 gap-2">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((typeNum) => (
                      <Link key={typeNum} href={`/product-types/${typeNum}`}>
                        <button
                          onClick={() => setShowProductTypes(false)}
                          className="w-full px-3 py-2 bg-purple-100 text-purple-900 rounded hover:bg-purple-200 transition-colors text-sm font-medium"
                        >
                          PRODUCT TYPE - {String(typeNum).padStart(2, '0')}
                        </button>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Download Products Button */}
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                📥 Download Products
              </button>
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
