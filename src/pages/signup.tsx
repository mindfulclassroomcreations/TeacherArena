import React from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import SignupForm from '@/components/SignupForm'

export default function SignupPage() {
  const router = useRouter()

  const handleSignupSuccess = () => {
    // Redirect to login page after successful signup
    router.push('/login?message=Please check your email to verify your account')
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <SignupForm onSuccess={handleSignupSuccess} showLoginLink={true} />
        </div>
      </div>
    </Layout>
  )
}
