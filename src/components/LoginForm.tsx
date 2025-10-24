import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import Button from './Button'
import Input from './Input'
import Alert from './Alert'

interface LoginFormProps {
  onSuccess?: () => void
  showSignupLink?: boolean
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, showSignupLink = true }) => {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    try {
      const { error: signInError } = await signIn(email, password)

      if (signInError) {
        setError(signInError.message)
      } else {
        setSuccess('Login successful! Redirecting...')
        setTimeout(() => {
          if (onSuccess) {
            onSuccess()
          }
        }, 1000)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
          <p className="text-gray-600">Sign in to your account to continue</p>
        </div>

        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={loading}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={loading}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          isLoading={loading}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>

        {showSignupLink && (
          <div className="text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign up
            </Link>
          </div>
        )}

        <div className="text-center">
          <a href="/forgot-password" className="text-sm text-gray-600 hover:text-gray-900">
            Forgot your password?
          </a>
        </div>
      </form>
    </div>
  )
}

export default LoginForm
