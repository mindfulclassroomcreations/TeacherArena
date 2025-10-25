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
  type: 'subjects' | 'sub-subjects' | 'frameworks' | 'grades' | 'lessons' | 'lesson-discovery' | 'lesson-generation-by-strand' | 'state-curricula'
  country?: string
  subject?: string
  framework?: string
  grade?: string
  context?: string
  totalLessonCount?: number
  strandCode?: string
  strandName?: string
  targetLessonCount?: number
  keyTopics?: string[]
  performanceExpectations?: string[]
}
