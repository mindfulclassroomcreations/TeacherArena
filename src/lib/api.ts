import axios from 'axios'
import { AIGenerationRequest } from '@/types'
import { supabase } from '@/lib/supabase'

const api = axios.create({
  baseURL: '/api',
})

export const generateContent = async (request: AIGenerationRequest) => {
  const response = await api.post('/generate-with-ai', request)
  return response.data
}

export const createSubject = async (data: any) => {
  const response = await api.post('/subjects', data)
  return response.data
}

export const getSubjects = async () => {
  const response = await api.get('/subjects')
  return response.data
}

export const getFrameworks = async (subjectId: string) => {
  const response = await api.get(`/frameworks?subject_id=${subjectId}`)
  return response.data
}

export const getGrades = async (frameworkId: string) => {
  const response = await api.get(`/grades?framework_id=${frameworkId}`)
  return response.data
}

export const getLessonsByStrand = async (strandId: string) => {
  const response = await api.get(`/lessons?strand_id=${strandId}`)
  return response.data
}

export default api

// Attach Supabase access token to API requests (browser only)
api.interceptors.request.use(async (config) => {
  try {
    if (typeof window !== 'undefined') {
      // Skip auth attachment for public AI endpoint to avoid noisy refresh attempts
      const url = String(config?.url || '')
      if (url.includes('/generate-with-ai')) {
        return config
      }
      const { data } = await supabase.auth.getSession()
      const token = data?.session?.access_token
      if (token) {
        config.headers = config.headers || {}
        ;(config.headers as any)['Authorization'] = `Bearer ${token}`
      }
    }
  } catch {
    // Silently ignore auth issues on client; requests still proceed unauthenticated
  }
  return config
})

// Normalize error messages, especially for insufficient tokens
api.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const status = error?.response?.status
    const msg = error?.response?.data?.error || error?.message
    if (status === 402) {
      // Payment required / insufficient tokens
      throw new Error(msg || 'Insufficient tokens. Please add tokens to continue.')
    }
    if (msg) throw new Error(msg)
    throw error
  }
)
