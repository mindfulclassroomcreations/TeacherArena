import React, { useState } from 'react'
import Link from 'next/link'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Button from '@/components/Button'
import Card from '@/components/Card'

interface SubPage {
  id: string
  name: string
}

interface CategoryGroup {
  id: string
  name: string
  label: string
  subPages: SubPage[]
}

const PRODUCTION_CATEGORIES: CategoryGroup[] = [
  {
    id: 'group-t',
    name: 'Group T',
    label: 'T',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `T-${String(i + 1).padStart(2, '0')}`,
      name: `T - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-a',
    name: 'Group A',
    label: 'A',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `A-${String(i + 1).padStart(2, '0')}`,
      name: `A - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-b',
    name: 'Group B',
    label: 'B',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `B-${String(i + 1).padStart(2, '0')}`,
      name: `B - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-c',
    name: 'Group C',
    label: 'C',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `C-${String(i + 1).padStart(2, '0')}`,
      name: `C - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-d',
    name: 'Group D',
    label: 'D',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `D-${String(i + 1).padStart(2, '0')}`,
      name: `D - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-e',
    name: 'Group E',
    label: 'E',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `E-${String(i + 1).padStart(2, '0')}`,
      name: `E - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-f',
    name: 'Group F',
    label: 'F',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `F-${String(i + 1).padStart(2, '0')}`,
      name: `F - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-g',
    name: 'Group G',
    label: 'G',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `G-${String(i + 1).padStart(2, '0')}`,
      name: `G - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-h',
    name: 'Group H',
    label: 'H',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `H-${String(i + 1).padStart(2, '0')}`,
      name: `H - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-i',
    name: 'Group I',
    label: 'I',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `I-${String(i + 1).padStart(2, '0')}`,
      name: `I - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
]

const getCategoryColor = (index: number): string => {
  const colors = [
    'bg-purple-50 border-purple-200',
    'bg-blue-50 border-blue-200',
    'bg-green-50 border-green-200',
    'bg-yellow-50 border-yellow-200',
    'bg-red-50 border-red-200',
    'bg-pink-50 border-pink-200',
    'bg-indigo-50 border-indigo-200',
    'bg-teal-50 border-teal-200',
    'bg-orange-50 border-orange-200',
    'bg-cyan-50 border-cyan-200',
  ]
  return colors[index % colors.length]
}

const getCategoryTextColor = (index: number): string => {
  const colors = [
    'text-purple-900',
    'text-blue-900',
    'text-green-900',
    'text-yellow-900',
    'text-red-900',
    'text-pink-900',
    'text-indigo-900',
    'text-teal-900',
    'text-orange-900',
    'text-cyan-900',
  ]
  return colors[index % colors.length]
}

export default function ProductionPage() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('group-t')

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">🏭 Production</h1>
            <p className="text-gray-600 text-lg">
              Access and manage production categories and sub-pages for content organization and distribution.
            </p>
          </div>

          {/* Navigation Tabs for Quick Access */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {PRODUCTION_CATEGORIES.map((category, idx) => (
                <Button
                  key={category.id}
                  variant={expandedCategory === category.id ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                  className={expandedCategory === category.id ? '' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}
                >
                  {category.label}
                </Button>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              Click any group button to expand/collapse its sub-pages
            </p>
          </div>

          {/* Production Categories Grid */}
          <div className="space-y-6">
            {PRODUCTION_CATEGORIES.map((category, categoryIndex) => {
              const isExpanded = expandedCategory === category.id
              const colorClasses = getCategoryColor(categoryIndex)
              const textColor = getCategoryTextColor(categoryIndex)

              return (
                <div
                  key={category.id}
                  className={`border-2 rounded-lg p-6 transition-all duration-300 ${colorClasses}`}
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setExpandedCategory(isExpanded ? null : category.id)}>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg ${colorClasses} flex items-center justify-center`}>
                        <span className={`text-2xl font-bold ${textColor}`}>{category.label}</span>
                      </div>
                      <div>
                        <h2 className={`text-2xl font-bold ${textColor}`}>{category.name}</h2>
                        <p className={`text-sm ${textColor.replace('900', '700')}`}>
                          {category.subPages.length} sub-pages
                        </p>
                      </div>
                    </div>
                    <div className={`text-2xl transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </div>
                  </div>

                  {/* Sub-pages Grid - Expanded */}
                  {isExpanded && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t-2 border-opacity-30">
                      {category.subPages.map((subPage, idx) => (
                        <Link
                          key={subPage.id}
                          href={`/production/${category.id}/${subPage.id.toLowerCase()}`}
                        >
                          <a className="block">
                            <div
                              className={`p-4 rounded-lg border-2 ${colorClasses} hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-1`}
                            >
                              <div className={`text-center`}>
                                <p className={`text-sm font-semibold ${textColor}`}>{subPage.name}</p>
                                <p className={`text-xs ${textColor.replace('900', '700')} mt-1`}>
                                  Click to view
                                </p>
                              </div>
                            </div>
                          </a>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer Summary */}
          <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📊 Production Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Categories</p>
                <p className="text-3xl font-bold text-gray-900">{PRODUCTION_CATEGORIES.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Sub-pages</p>
                <p className="text-3xl font-bold text-gray-900">
                  {PRODUCTION_CATEGORIES.reduce((sum, cat) => sum + cat.subPages.length, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sub-pages per Category</p>
                <p className="text-3xl font-bold text-gray-900">11</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
