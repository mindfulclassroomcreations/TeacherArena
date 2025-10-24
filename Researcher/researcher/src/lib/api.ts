import axios from 'axios'
import { AIGenerationRequest } from '@/types'

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

export const getLessons = async (gradeId: string) => {
  const response = await api.get(`/lessons?grade_id=${gradeId}`)
  return response.data
}

export default api
