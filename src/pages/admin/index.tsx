import React, { useEffect } from 'react'
import Layout from '@/components/Layout'
import Button from '@/components/Button'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export default function AdminDashboard() {
  const { isAuthed, ready, logout } = useAdminAuth()
  const router = useRouter()

  useEffect(() => {
    if (ready && !isAuthed) router.replace('/admin/login')
  }, [ready, isAuthed, router])

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/')}>Home</Button>
          <Button variant="danger" onClick={logout}>Log out</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Selected Lessons</h2>
          <p className="text-gray-600 mb-3">Review the lessons users selected for product generation.</p>
          <Link href="/admin/selected-lessons" className="inline-block">
            <Button>Open</Button>
          </Link>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Users Management</h2>
          <p className="text-gray-600 mb-3">Manage roles and tokens for user accounts.</p>
          <Link href="/admin/users" className="inline-block">
            <Button>Open</Button>
          </Link>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Product Generation</h2>
          <p className="text-gray-600 mb-3">Open the product generation workspace in a new tab.</p>
          <Button onClick={() => { if (typeof window !== 'undefined') window.open('/product-generation', '_blank') }}>Open</Button>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Curriculum Context</h2>
          <p className="text-gray-600 mb-3">Shows the current curriculum summary saved from Step 5.</p>
          <Button onClick={() => router.push('/admin/selected-lessons')}>View Summary</Button>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Settings</h2>
          <p className="text-gray-600 mb-3">Basic admin settings (coming soon).</p>
          <Button variant="outline" disabled>Configure</Button>
        </div>
      </div>
    </Layout>
  )
}
