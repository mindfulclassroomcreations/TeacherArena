import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Button from '@/components/Button'

const GROUPS = ['T', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']

const getCategoryColor = (letter: string): string => {
  const colorMap: Record<string, string> = {
    T: 'bg-purple-50 border-purple-200 text-purple-900',
    A: 'bg-blue-50 border-blue-200 text-blue-900',
    B: 'bg-green-50 border-green-200 text-green-900',
    C: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    D: 'bg-red-50 border-red-200 text-red-900',
    E: 'bg-pink-50 border-pink-200 text-pink-900',
    F: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    G: 'bg-teal-50 border-teal-200 text-teal-900',
    H: 'bg-orange-50 border-orange-200 text-orange-900',
    I: 'bg-cyan-50 border-cyan-200 text-cyan-900',
  }
  return colorMap[letter] || 'bg-gray-50 border-gray-200 text-gray-900'
}

export default function ProductionSubPage() {
  const router = useRouter()
  const { group, subpage } = router.query
  const [groupLetter, setGroupLetter] = useState<string>('')
  const [subPageName, setSubPageName] = useState<string>('')

  useEffect(() => {
    if (typeof group === 'string' && typeof subpage === 'string') {
      // Extract letter from group-x format
      const letter = group.replace('group-', '').toUpperCase()
      if (GROUPS.includes(letter)) {
        setGroupLetter(letter)
        setSubPageName(subpage.toUpperCase())
      }
    }
  }, [group, subpage])

  if (!groupLetter) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="max-w-6xl mx-auto text-center py-12">
            <div className="animate-spin text-4xl mb-4">⌛</div>
            <p className="text-gray-600">Loading production sub-page...</p>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  const colorClasses = getCategoryColor(groupLetter)
  const [r, g, b] = groupLetter === 'T' ? [168, 85, 247] : 
                    groupLetter === 'A' ? [59, 130, 246] :
                    groupLetter === 'B' ? [34, 197, 94] :
                    groupLetter === 'C' ? [202, 138, 4] :
                    groupLetter === 'D' ? [220, 38, 38] :
                    groupLetter === 'E' ? [236, 72, 153] :
                    groupLetter === 'F' ? [79, 70, 229] :
                    groupLetter === 'G' ? [20, 184, 166] :
                    groupLetter === 'H' ? [249, 115, 22] :
                    [34, 211, 238]

  // Get previous and next sub-pages
  const currentNum = parseInt(subPageName.split('-')[1])
  const prevNum = currentNum > 1 ? currentNum - 1 : 11
  const nextNum = currentNum < 11 ? currentNum + 1 : 1
  const prevSubPage = `${groupLetter}-${String(prevNum).padStart(2, '0')}`
  const nextSubPage = `${groupLetter}-${String(nextNum).padStart(2, '0')}`

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-6xl mx-auto">
          {/* Header with Navigation */}
          <div className="mb-8">
            <Link href="/production">
              <a className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
                ← Back to Production
              </a>
            </Link>

            <div className="flex items-center gap-4 mb-6">
              <div className={`w-16 h-16 rounded-lg ${colorClasses} flex items-center justify-center`}>
                <span className="text-3xl font-bold">{groupLetter}</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Group {groupLetter}</h1>
                <p className="text-lg text-gray-600">Sub-page {subPageName}</p>
              </div>
            </div>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
              <span>Production</span>
              <span>/</span>
              <span>Group {groupLetter}</span>
              <span>/</span>
              <span className="font-semibold">{subPageName}</span>
            </div>
          </div>

          {/* Content Area */}
          <div className={`border-2 rounded-lg p-8 mb-8 ${colorClasses}`}>
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">📄</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {groupLetter} - {subPageName}
              </h2>
              <p className="text-gray-600">
                This is the production sub-page for Group {groupLetter}, Sub-page {subPageName}
              </p>
            </div>

            {/* Content Placeholder */}
            <div className="bg-white rounded-lg p-8 border-2 border-dashed border-gray-300 text-center mb-8">
              <p className="text-gray-500 mb-4">
                📝 Content area for {groupLetter} - {subPageName}
              </p>
              <p className="text-sm text-gray-400">
                Add your production content, materials, or resources here
              </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                <p className="text-gray-600 text-sm">Group</p>
                <p className="text-2xl font-bold text-gray-900">Group {groupLetter}</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                <p className="text-gray-600 text-sm">Sub-Page</p>
                <p className="text-2xl font-bold text-gray-900">{subPageName}</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                <p className="text-gray-600 text-sm">Total Sub-Pages</p>
                <p className="text-2xl font-bold text-gray-900">11</p>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
            <Link href={`/production/group-${groupLetter.toLowerCase()}/${prevSubPage.toLowerCase()}`}>
              <a>
                <Button variant="outline" className="w-full sm:w-auto">
                  ← Previous: {prevSubPage}
                </Button>
              </a>
            </Link>

            <Link href="/production">
              <a>
                <Button variant="primary" className="w-full sm:w-auto">
                  🏠 Back to All Groups
                </Button>
              </a>
            </Link>

            <Link href={`/production/group-${groupLetter.toLowerCase()}/${nextSubPage.toLowerCase()}`}>
              <a>
                <Button variant="outline" className="w-full sm:w-auto">
                  Next: {nextSubPage} →
                </Button>
              </a>
            </Link>
          </div>

          {/* Quick Navigation - All Sub-pages in Group */}
          <div className={`border-2 rounded-lg p-6 ${colorClasses}`}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              📋 All Sub-pages in Group {groupLetter}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {Array.from({ length: 11 }, (_, i) => {
                const num = i + 1
                const subNum = String(num).padStart(2, '0')
                const isCurrentPage = num === currentNum
                return (
                  <Link
                    key={`${groupLetter}-${subNum}`}
                    href={`/production/group-${groupLetter.toLowerCase()}/${groupLetter}-${subNum}`.toLowerCase()}
                  >
                    <a>
                      <div
                        className={`p-3 rounded-lg text-center font-semibold transition-all ${
                          isCurrentPage
                            ? 'bg-white border-2 border-gray-900 text-gray-900 shadow-lg'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {subNum}
                      </div>
                    </a>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
