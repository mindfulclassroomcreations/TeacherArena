import React from 'react'

interface Step {
  label: string
  completed: boolean
  active: boolean
}

interface ProgressIndicatorProps {
  steps: Step[]
}

export default function ProgressIndicator({ steps }: ProgressIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                  step.completed
                    ? 'bg-green-500 text-white'
                    : step.active
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step.completed ? '✓' : index + 1}
              </div>
              <span
                className={`mt-2 text-sm font-medium ${
                  step.active ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-4 transition-colors ${
                  step.completed ? 'bg-green-500' : 'bg-gray-200'
                }`}
                style={{ maxWidth: '100px' }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
