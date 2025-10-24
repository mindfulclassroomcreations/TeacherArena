import React from 'react'

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8 mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to AI Lesson Generator</h2>
        <p className="text-lg text-gray-600 mb-4">
          Create curriculum-aligned lessons powered by AI. Select a subject, framework, and grade level to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">📚 Subjects</h3>
          <p className="text-gray-600">Select from a wide range of educational subjects.</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">📋 Frameworks</h3>
          <p className="text-gray-600">Choose curriculum frameworks aligned with standards.</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">🎯 Lessons</h3>
          <p className="text-gray-600">Generate standards-aligned lessons instantly.</p>
        </div>
      </div>
    </div>
  )
}
