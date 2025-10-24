import { useState } from 'react'
import { generateContent } from '@/lib/api'
import { AIGenerationRequest } from '@/types'

interface UseAIGenerationReturn {
  isLoading: boolean
  error: string | null
  success: string | null
  generate: (request: AIGenerationRequest) => Promise<any>
  clearError: () => void
  clearSuccess: () => void
}

export function useAIGeneration(): UseAIGenerationReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const generate = async (request: AIGenerationRequest) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const response = await generateContent(request)
      
      if (response.success && response.items) {
        setSuccess(`Successfully generated ${response.items.length} items!`)
        return response
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => setError(null)
  const clearSuccess = () => setSuccess(null)

  return {
    isLoading,
    error,
    success,
    generate,
    clearError,
    clearSuccess
  }
}
