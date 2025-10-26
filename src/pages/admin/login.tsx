import React, { useState } from 'react'
import Layout from '@/components/Layout'
import Input from '@/components/Input'
import Button from '@/components/Button'
import { useRouter } from 'next/router'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export default function AdminLogin() {
  const { isAuthed, ready, login } = useAdminAuth()
  const router = useRouter()
  const [key, setKey] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (ready && isAuthed) {
    if (typeof window !== 'undefined') router.replace('/admin')
  }

  const handleLogin = () => {
    setError(null)
    const ok = login(key.trim())
    if (ok) {
      router.replace('/admin')
    } else {
      setError('Invalid admin key')
    }
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Login</h1>
        <Input
          label="Admin key"
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Enter admin key"
          error={error || undefined}
          helperText={!error ? 'Ask the site owner for the admin key.' : undefined}
        />
        <div className="mt-4 flex justify-end">
          <Button onClick={handleLogin} variant="primary">Login</Button>
        </div>
      </div>
    </Layout>
  )
}
