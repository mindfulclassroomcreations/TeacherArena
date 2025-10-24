import React from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import LoginForm from '@/components/LoginForm'

export default function LoginPage() {
  const router = useRouter()

  const handleLoginSuccess = () => {
    // Redirect to home page or dashboard after successful login
    const redirectTo = (router.query.redirect as string) || '/'
    router.push(redirectTo)
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <LoginForm onSuccess={handleLoginSuccess} showSignupLink={true} />
        </div>
      </div>
    </Layout>
  )
}
