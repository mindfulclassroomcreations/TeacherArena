// Database schema types based on curriculum hierarchy
export interface Subject {
  id: string
  name: string
  description: string
  created_at: string
}

export interface Framework {
  id: string
  subject_id: string
  name: string
  description: string
  created_at: string
}

export interface Grade {
  id: string
  framework_id: string
  name: string
  description: string
  created_at: string
}

export interface Strand {
  id: string
  grade_id: string
  strand_code: string
  strand_name: string
  num_standards: number
  key_topics: string[]
  target_lesson_count: number
  performance_expectations: string[]
  created_at: string
}

export interface Lesson {
  id: string
  strand_id: string
  title: string
  description: string
  performance_expectation: string
  created_at: string
}

export interface AIGenerationRequest {
  type: 'subjects' | 'frameworks' | 'grades' | 'lessons' | 'lesson-discovery' | 'lesson-generation-by-strand' | 'state-curricula' | 'state-standard' | 'section-standards' | 'lessons-by-substandards' | 'unit-topics'
  country?: string
  subject?: string
  framework?: string
  grade?: string
  context?: string
  subjectsCount?: number
  totalLessonCount?: number
  strandCode?: string
  strandName?: string
  targetLessonCount?: number
  keyTopics?: string[]
  performanceExpectations?: string[]
  // Optional model override for each step
  model?: string
  // For state-standard
  region?: string
  // For all steps: selected curriculum grouping (e.g., TEKS, SOL)
  stateCurriculum?: string
  // For frameworks (to help anchor official sections)
  stateStandardName?: string
  // For section-standards
  section?: string
  // For lessons-by-substandards
  subStandards?: Array<{ code?: string; name?: string; title?: string; description?: string }>
  lessonsPerStandard?: number
}

// User roles and profile
export type UserRole = 'user' | 'manager' | 'designer' | 'admin'

export interface UserProfile {
  id: string // uuid (matches auth.users.id)
  email?: string | null
  role: UserRole
  tokens: number
  created_at?: string
  updated_at?: string
}
