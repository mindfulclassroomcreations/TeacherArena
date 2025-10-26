import React, { useEffect } from 'react'
import Link from 'next/link'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  message?: string
  redirectTo?: string
}

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  message = 'Insufficient tokens. Please buy more credits to continue.',
  redirectTo = '/credits'
}: PaymentModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-md">
          <div className="bg-white px-6 py-8">
            {/* Close button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>

            {/* Icon and message */}
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <span className="text-3xl text-red-600">💳</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Payment Required
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {message}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
              <Link
                href={redirectTo}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
              >
                Buy Credits
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
