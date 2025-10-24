import { create } from 'zustand'
import { Subject, Framework, Grade, Lesson } from '@/types'

interface CurriculumState {
  // UI state
  selectedSubject: Subject | null
  selectedFramework: Framework | null
  selectedGrade: Grade | null

  // Data
  subjects: Subject[]
  frameworks: Framework[]
  grades: Grade[]
  lessons: Lesson[]

  // Loading states
  isLoading: boolean
  error: string | null
  success: string | null

  // Actions
  setSelectedSubject: (subject: Subject | null) => void
  setSelectedFramework: (framework: Framework | null) => void
  setSelectedGrade: (grade: Grade | null) => void
  
  setSubjects: (subjects: Subject[]) => void
  setFrameworks: (frameworks: Framework[]) => void
  setGrades: (grades: Grade[]) => void
  setLessons: (lessons: Lesson[]) => void
  
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSuccess: (success: string | null) => void
}

export const useCurriculumStore = create<CurriculumState>((set) => ({
  selectedSubject: null,
  selectedFramework: null,
  selectedGrade: null,

  subjects: [],
  frameworks: [],
  grades: [],
  lessons: [],

  isLoading: false,
  error: null,
  success: null,

  setSelectedSubject: (subject) => set({ selectedSubject: subject }),
  setSelectedFramework: (framework) => set({ selectedFramework: framework }),
  setSelectedGrade: (grade) => set({ selectedGrade: grade }),

  setSubjects: (subjects) => set({ subjects }),
  setFrameworks: (frameworks) => set({ frameworks }),
  setGrades: (grades) => set({ grades }),
  setLessons: (lessons) => set({ lessons }),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),
}))
