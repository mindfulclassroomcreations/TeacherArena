import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import Input from '@/components/Input'
import Button from '@/components/Button'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState<string>('Loading…')
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setError('Password reset link is invalid or expired. Please request a new link.')
        setMessage('')
      } else {
        setMessage('')
        setReady(true)
      }
    }
    checkSession()
  }, [])

  const submit = async () => {
    setError(null)
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      return
    }
    setMessage('Password updated. Redirecting to login…')
    setTimeout(() => router.replace('/login'), 800)
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
        {message && <p className="text-gray-700">{message}</p>}
        {error && <p className="text-red-600">{error}</p>}
        {ready && (
          <div className="space-y-3 mt-2">
            <Input label="New Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
            <Input label="Confirm Password" type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} />
            <div className="text-right">
              <Button onClick={submit}>Update Password</Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
