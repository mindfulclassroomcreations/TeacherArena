import React from 'react'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Button from '@/components/Button'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function ProductPage() {
  const router = useRouter()
  const { groupId, subPageId } = router.query

  // Format the display name from URL
  const groupName = groupId ? (typeof groupId === 'string' ? groupId.replace('group-', '').toUpperCase() : '') : ''
  const subPageName = subPageId ? (typeof subPageId === 'string' ? subPageId.replace(/-/g, ' ').toUpperCase() : '') : ''

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

          {/* Content Area */}
          <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                {groupName} {subPageName}
              </h2>
              <p className="text-gray-600 mb-6">
                Product content for <strong>{groupName} {subPageName}</strong> will be displayed here.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block max-w-md">
                <p className="text-sm text-blue-900">
                  <strong>Category:</strong> {groupName}<br />
                  <strong>Sub-Page:</strong> {subPageName}
                </p>
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Product Details</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• <strong>Group:</strong> {groupName}</li>
                <li>• <strong>Sub-Page:</strong> {subPageName}</li>
                <li>• <strong>Type:</strong> Educational Product</li>
                <li>• <strong>Status:</strong> Template</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                  Download Product
                </button>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Preview
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
                  Back to Builder
                </button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
