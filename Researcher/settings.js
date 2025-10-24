import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import AdminLayout from '../../components/AdminLayout'

export default function AdminSettings({ initialSubjects }) {
  const router = useRouter()
  
  // Subjects (top level)
  const [subjects, setSubjects] = useState(initialSubjects || [])
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [newSubject, setNewSubject] = useState('')
  
  // Frameworks (level 2 - filtered by subject)
  const [frameworks, setFrameworks] = useState([])
  const [selectedFramework, setSelectedFramework] = useState(null)
  const [newFramework, setNewFramework] = useState('')
  
  // Grades (level 3 - filtered by framework)
  const [grades, setGrades] = useState([])
  const [selectedGrade, setSelectedGrade] = useState(null)
  const [newGrade, setNewGrade] = useState('')
  
  // Lessons (level 4 - filtered by grade)
  const [lessons, setLessons] = useState([])
  const [newLesson, setNewLesson] = useState('')
  const [newLessonDescription, setNewLessonDescription] = useState('')
  
  // AI-generated subjects
  const [generatedSubjects, setGeneratedSubjects] = useState([])
  
  // AI-generated frameworks
  const [generatedFrameworks, setGeneratedFrameworks] = useState([])
  
  // AI-generated grades
  const [generatedGrades, setGeneratedGrades] = useState([])
  
  // Phase 1: Lesson Discovery (Strands/Domains Analysis)
  const [customTotalLessonCount, setCustomTotalLessonCount] = useState(45)
  const [lessonDiscovery, setLessonDiscovery] = useState(null)
  const [discoveryLoading, setDiscoveryLoading] = useState(false)
  const [savedStrands, setSavedStrands] = useState([])
  const [savingStrands, setSavingStrands] = useState(false)
  
  // Phase 2: Per-Strand Generation
  const [strandGenerations, setStrandGenerations] = useState({}) // { strandCode: { lessons: [], isApproved: false, loading: false } }
  const [expandedStrands, setExpandedStrands] = useState({}) // Track which strands are expanded
  const [lessonGenerationPhase, setLessonGenerationPhase] = useState(null) // null, 'discovery', or 'by-strand'
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Helper function to show success message with auto-dismiss
  const showSuccess = (message, duration = 4000) => {
    setSuccess(message)
    setTimeout(() => setSuccess(''), duration)
  }

  // Helper function to show error message with auto-dismiss
  const showError = (message, duration = 4000) => {
    setError(message)
    setTimeout(() => setError(''), duration)
  }

  // Load system settings on mount
  useEffect(() => {
    // System settings loading removed
  }, [])

  // Load frameworks when subject is selected
  useEffect(() => {
    if (selectedSubject) {
      loadFrameworks(selectedSubject.id)
      setSelectedFramework(null)
      setSelectedGrade(null)
      setGrades([])
      setLessons([])
      setGeneratedFrameworks([])
    } else {
      setFrameworks([])
      setSelectedFramework(null)
      setSelectedGrade(null)
      setGrades([])
      setLessons([])
      setGeneratedFrameworks([])
    }
  }, [selectedSubject])

  // Load grades when framework is selected
  useEffect(() => {
    if (selectedFramework) {
      loadGrades(selectedFramework.id)
      setSelectedGrade(null)
      setLessons([])
      setGeneratedGrades([])
    } else {
      setGrades([])
      setSelectedGrade(null)
      setLessons([])
      setGeneratedGrades([])
    }
  }, [selectedFramework])

  // Load lessons when grade is selected
  useEffect(() => {
    if (selectedGrade) {
      loadLessons(selectedGrade.id)
    } else {
      setLessons([])
    }
  }, [selectedGrade])

  const loadFrameworks = async (subjectId) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin-settings?type=frameworks&parent_id=${subjectId}`)
      if (res.ok) {
        const data = await res.json()
        setFrameworks(data.frameworks || [])
      }
    } catch (err) {
      console.error('Failed to load frameworks:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadGrades = async (frameworkId) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin-settings?type=grades&parent_id=${frameworkId}`)
      if (res.ok) {
        const data = await res.json()
        setGrades(data.grades || [])
      }
    } catch (err) {
      console.error('Failed to load grades:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadLessons = async (gradeId) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin-settings?type=lessons&parent_id=${gradeId}`)
      if (res.ok) {
        const data = await res.json()
        setLessons(data.lessons || [])
      }
    } catch (err) {
      console.error('Failed to load lessons:', err)
    } finally {
      setLoading(false)
    }
  }

  const addItem = async (type, value, parentId = null, description = '') => {
    if (!value.trim()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/admin-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'add', type, value: value.trim(), parent_id: parentId, description })
      })

      if (res.ok) {
        const data = await res.json()
        setSuccess(`${type} added successfully!`)
        
        // Refresh the appropriate list
        if (type === 'subject') {
          const subjectsRes = await fetch('/api/admin-settings?type=subjects')
          if (subjectsRes.ok) {
            const subjectsData = await subjectsRes.json()
            setSubjects(subjectsData.subjects || [])
          }
          setNewSubject('')
        } else if (type === 'framework' && selectedSubject) {
          loadFrameworks(selectedSubject.id)
          setNewFramework('')
        } else if (type === 'grade' && selectedFramework) {
          loadGrades(selectedFramework.id)
          setNewGrade('')
        } else if (type === 'lesson' && selectedGrade) {
          loadLessons(selectedGrade.id)
          setNewLesson('')
          setNewLessonDescription('')
        }

        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add item')
      }
    } catch (err) {
      setError('Network error')
      console.error('Add item error:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteItem = async (type, id) => {
    if (!confirm(`Are you sure you want to delete this ${type}? This will also delete all child items.`)) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'delete', type, id })
      })

      if (res.ok) {
        // Refresh the appropriate list
        if (type === 'subject') {
          const subjectsRes = await fetch('/api/admin-settings?type=subjects')
          if (subjectsRes.ok) {
            const subjectsData = await subjectsRes.json()
            setSubjects(subjectsData.subjects || [])
          }
          if (selectedSubject?.id === id) {
            setSelectedSubject(null)
          }
        } else if (type === 'framework' && selectedSubject) {
          loadFrameworks(selectedSubject.id)
          if (selectedFramework?.id === id) {
            setSelectedFramework(null)
          }
        } else if (type === 'grade' && selectedFramework) {
          loadGrades(selectedFramework.id)
          if (selectedGrade?.id === id) {
            setSelectedGrade(null)
          }
        } else if (type === 'lesson' && selectedGrade) {
          loadLessons(selectedGrade.id)
        }
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to delete item')
      }
    } catch (err) {
      setError('Network error')
      console.error('Delete item error:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateSubjectsFromPrompt = async () => {
    if (!newSubject.trim()) {
      setError('Please provide a description for subject generation')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/generate-with-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subjects',
          context: newSubject,
          count: 'unlimited'
        })
      })

      if (res.ok) {
        const data = await res.json()
        const generated = (data.items || []).map((item, index) => ({
          id: `temp-${Date.now()}-${index}`,
          name: typeof item === 'string' ? item : item.name || item,
          approved: false,
          isGenerated: true
        }))
        setGeneratedSubjects(generated)
        showSuccess(`Generated ${generated.length} subjects`)
        setNewSubject('')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to generate subjects')
      }
    } catch (err) {
      setError('Failed to generate subjects: ' + err.message)
      console.error('Generate error:', err)
    } finally {
      setLoading(false)
    }
  }

  const approveGeneratedSubject = async (generatedItem) => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'add', 
          type: 'subject', 
          value: generatedItem.name.trim()
        })
      })

      if (res.ok) {
        setSuccess(`Subject "${generatedItem.name}" added successfully!`)
        setGeneratedSubjects(generatedSubjects.filter(item => item.id !== generatedItem.id))
        
        // Refresh subjects list
        const subjectsRes = await fetch('/api/admin-settings?type=subjects')
        if (subjectsRes.ok) {
          const subjectsData = await subjectsRes.json()
          setSubjects(subjectsData.subjects || [])
        }

        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to approve subject')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
      console.error('Approve error:', err)
    } finally {
      setLoading(false)
    }
  }

  const rejectGeneratedSubject = (generatedItem) => {
    setGeneratedSubjects(generatedSubjects.filter(item => item.id !== generatedItem.id))
    setSuccess(`Subject "${generatedItem.name}" rejected`)
    setTimeout(() => setSuccess(''), 3000)
  }

  const generateFrameworksFromPrompt = async () => {
    if (!selectedSubject) {
      setError('Please select a subject first')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const context = newFramework.trim() 
        ? `For subject "${selectedSubject.name}": ${newFramework}`
        : `Generate frameworks for subject "${selectedSubject.name}"`

      const res = await fetch('/api/generate-with-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'frameworks',
          subject: selectedSubject.name,
          context: context,
          count: 'unlimited'
        })
      })

      if (res.ok) {
        const data = await res.json()
        const generated = (data.items || []).map((item, index) => ({
          id: `temp-${Date.now()}-${index}`,
          name: typeof item === 'string' ? item : item.name || item,
          approved: false,
          isGenerated: true
        }))
        setGeneratedFrameworks(generated)
        showSuccess(`Generated ${generated.length} frameworks`)
        setNewFramework('')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to generate frameworks')
      }
    } catch (err) {
      setError('Failed to generate frameworks: ' + err.message)
      console.error('Generate error:', err)
    } finally {
      setLoading(false)
    }
  }

  const approveGeneratedFramework = async (generatedItem) => {
    if (!selectedSubject || !selectedSubject.id) return

    setLoading(true)
    setError('')

    try {
      // Get the latest subject data to ensure we have a valid ID
      const subjectsRes = await fetch('/api/admin-settings?type=subjects')
      let currentSubjectId = selectedSubject.id
      
      if (subjectsRes.ok) {
        const subjectsData = await subjectsRes.json()
        const latestSubject = subjectsData.subjects?.find(s => s.name === selectedSubject.name)
        if (latestSubject) {
          currentSubjectId = latestSubject.id
        }
      }

      const res = await fetch('/api/admin-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'add', 
          type: 'framework', 
          value: generatedItem.name.trim(),
          parent_id: currentSubjectId
        })
      })

      if (res.ok) {
        setSuccess(`Framework "${generatedItem.name}" added successfully!`)
        setGeneratedFrameworks(generatedFrameworks.filter(item => item.id !== generatedItem.id))
        
        // Refresh frameworks list with the valid subject ID
        if (currentSubjectId) {
          loadFrameworks(currentSubjectId)
          // Also update selectedSubject with the valid ID if it was different
          if (currentSubjectId !== selectedSubject.id) {
            setSelectedSubject({ ...selectedSubject, id: currentSubjectId })
          }
        }

        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to approve framework')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
      console.error('Approve error:', err)
    } finally {
      setLoading(false)
    }
  }

  const rejectGeneratedFramework = (generatedItem) => {
    setGeneratedFrameworks(generatedFrameworks.filter(item => item.id !== generatedItem.id))
    setSuccess(`Framework "${generatedItem.name}" rejected`)
    setTimeout(() => setSuccess(''), 3000)
  }

  const generateGradesFromPrompt = async () => {
    if (!selectedFramework || !selectedSubject) {
      setError('Please select a subject and framework first')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const context = newGrade.trim() 
        ? `For subject "${selectedSubject.name}" and framework "${selectedFramework.name}": ${newGrade}`
        : `Generate grades for subject "${selectedSubject.name}" with framework "${selectedFramework.name}"`

      const res = await fetch('/api/generate-with-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'grades',
          subject: selectedSubject.name,
          framework: selectedFramework.name,
          context: context,
          count: 'unlimited'
        })
      })

      if (res.ok) {
        const data = await res.json()
        const generated = (data.items || []).map((item, index) => ({
          id: `temp-${Date.now()}-${index}`,
          name: typeof item === 'string' ? item : item.name || item,
          approved: false,
          isGenerated: true
        }))
        setGeneratedGrades(generated)
        showSuccess(`Generated ${generated.length} grades`)
        setNewGrade('')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to generate grades')
      }
    } catch (err) {
      setError('Failed to generate grades: ' + err.message)
      console.error('Generate error:', err)
    } finally {
      setLoading(false)
    }
  }

  const approveGeneratedGrade = async (generatedItem) => {
    if (!selectedFramework || !selectedFramework.id) return

    setLoading(true)
    setError('')

    try {
      // Get the latest framework data to ensure we have a valid ID
      const frameworksRes = await fetch(`/api/admin-settings?type=frameworks&parent_id=${selectedSubject.id}`)
      let currentFrameworkId = selectedFramework.id
      
      if (frameworksRes.ok) {
        const frameworksData = await frameworksRes.json()
        const latestFramework = frameworksData.frameworks?.find(f => f.name === selectedFramework.name)
        if (latestFramework) {
          currentFrameworkId = latestFramework.id
        }
      }

      const res = await fetch('/api/admin-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'add', 
          type: 'grade', 
          value: generatedItem.name.trim(),
          parent_id: currentFrameworkId
        })
      })

      if (res.ok) {
        setSuccess(`Grade "${generatedItem.name}" added successfully!`)
        setGeneratedGrades(generatedGrades.filter(item => item.id !== generatedItem.id))
        
        // Refresh grades list with the valid framework ID
        if (currentFrameworkId) {
          loadGrades(currentFrameworkId)
          // Also update selectedFramework with the valid ID if it was different
          if (currentFrameworkId !== selectedFramework.id) {
            setSelectedFramework({ ...selectedFramework, id: currentFrameworkId })
          }
        }

        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to approve grade')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
      console.error('Approve error:', err)
    } finally {
      setLoading(false)
    }
  }

  const rejectGeneratedGrade = (generatedItem) => {
    setGeneratedGrades(generatedGrades.filter(item => item.id !== generatedItem.id))
    setSuccess(`Grade "${generatedItem.name}" rejected`)
    setTimeout(() => setSuccess(''), 3000)
  }

  // ===== PHASE 1: Lesson Discovery =====
  const discoverLessonStrands = async () => {
    if (!selectedGrade || !selectedFramework || !selectedSubject) {
      setError('Please select a subject, framework, and grade first')
      return
    }

    if (!customTotalLessonCount || customTotalLessonCount < 1) {
      setError('Please enter a valid total lesson count (minimum 1)')
      return
    }

    setDiscoveryLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/generate-with-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lesson-discovery',
          subject: selectedSubject.name,
          framework: selectedFramework.name,
          grade: selectedGrade.name,
          totalLessonCount: customTotalLessonCount,
          context: ''
        }),
        credentials: 'include'
      })

      if (res.ok) {
        const data = await res.json()
        
        // For discovery response, items[0] contains the framework analysis
        let discoveryData = {}
        if (data.items && data.items[0]) {
          const item = data.items[0]
          
          // Handle string response
          if (typeof item === 'string') {
            try {
              discoveryData = JSON.parse(item)
            } catch (e) {
              console.error('Failed to parse discovery response:', item)
              setError('Invalid response format from AI')
              setDiscoveryLoading(false)
              return
            }
          } else if (typeof item === 'object') {
            discoveryData = item
          }
        } else {
          discoveryData = data
        }
        
        // If the response is an array of strands, wrap it in the expected structure
        if (Array.isArray(discoveryData)) {
          discoveryData = {
            framework_summary: `Framework contains ${discoveryData.length} major strands with ${discoveryData.reduce((sum, s) => sum + s.target_lesson_count, 0)} total lessons planned.`,
            major_parts: discoveryData,
            total_lessons_planned: discoveryData.reduce((sum, s) => sum + s.target_lesson_count, 0),
            estimated_coverage: '90%'
          }
        }
        
        console.log('Parsed discovery data:', discoveryData)
        setLessonDiscovery(discoveryData)
        setLessonGenerationPhase('discovery')
        setExpandedStrands({})
        setStrandGenerations({})
        showSuccess('Framework analysis complete! Ready to generate lessons by strand.')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to analyze framework')
      }
    } catch (err) {
      setError('Failed to analyze framework: ' + err.message)
      console.error('Discovery error:', err)
    } finally {
      setDiscoveryLoading(false)
      setDiscoveryLoading(false)
    }
  }

  // Save strands to Supabase database
  const saveStrandsToDB = async () => {
    if (!lessonDiscovery || !lessonDiscovery.major_parts || lessonDiscovery.major_parts.length === 0) {
      setError('No strands to save. Please run framework analysis first.')
      return
    }

    if (!selectedFramework || !selectedFramework.id || !selectedGrade || !selectedGrade.id) {
      setError('Framework and grade must be selected')
      return
    }

    setSavingStrands(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/save-strands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameworkId: selectedFramework.id,
          gradeId: selectedGrade.id,
          strands: lessonDiscovery.major_parts
        }),
        credentials: 'include'
      })

      if (res.ok) {
        const data = await res.json()
        setSavedStrands(data.strands || [])
        showSuccess(`Saved ${data.strands.length} strands successfully!`)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save strands')
      }
    } catch (err) {
      setError('Failed to save strands: ' + err.message)
      console.error('Save strands error:', err)
    } finally {
      setSavingStrands(false)
    }
  }

  // Load saved strands for current framework/grade
  const loadSavedStrands = async () => {
    if (!selectedFramework || !selectedFramework.id || !selectedGrade || !selectedGrade.id) {
      setSavedStrands([])
      return
    }

    try {
      const res = await fetch(
        `/api/admin-settings?type=strands&framework_id=${selectedFramework.id}&grade_id=${selectedGrade.id}`
      )

      if (res.ok) {
        const data = await res.json()
        setSavedStrands(data.strands || [])
      } else {
        setSavedStrands([])
      }
    } catch (err) {
      console.error('Error loading strands:', err)
      setSavedStrands([])
    }
  }

  // Delete a strand (will cascade delete all associated lessons)
  const deleteStrand = async (strandId) => {
    if (!confirm('Are you sure you want to delete this strand? All associated lessons will also be deleted.')) {
      return
    }

    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/delete-strand', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strandId }),
        credentials: 'include'
      })

      if (res.ok) {
        showSuccess('Strand and associated lessons deleted successfully!')
        // Reload strands
        loadSavedStrands()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to delete strand')
      }
    } catch (err) {
      setError('Failed to delete strand: ' + err.message)
      console.error('Delete strand error:', err)
    }
  }

  // Load strands when grade is selected
  useEffect(() => {
    if (selectedGrade) {
      loadSavedStrands()
    } else {
      setSavedStrands([])
    }
  }, [selectedGrade])

  // ===== PHASE 2: Per-Strand Generation =====
  const generateLessonsForStrand = async (strand) => {
    if (!selectedGrade || !selectedFramework || !selectedSubject) {
      setError('Please select a subject, framework, and grade first')
      return
    }

    setStrandGenerations(prev => ({
      ...prev,
      [strand.strand_code]: { ...prev[strand.strand_code], loading: true }
    }))
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/generate-with-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lesson-generation-by-strand',
          subject: selectedSubject.name,
          framework: selectedFramework.name,
          grade: selectedGrade.name,
          strandCode: strand.strand_code,
          strandName: strand.strand_name,
          targetLessonCount: strand.target_lesson_count,
          keyTopics: strand.key_topics || [],
          performanceExpectations: strand.performance_expectations || [],
          context: ''
        }),
        credentials: 'include'
      })

      if (res.ok) {
        const data = await res.json()
        const items = data.items || []
        
        // Convert response items to generated lessons format
        const generatedStrandLessons = items.map((item, index) => ({
          id: `strand-${strand.strand_code}-${Date.now()}-${index}`,
          name: item.name || item.title,
          title: item.title,
          description: item.description || '',
          performance_expectation: item.performance_expectation || '',
          approved: false,
          isGenerated: true,
          strandCode: strand.strand_code
        }))

        setStrandGenerations(prev => ({
          ...prev,
          [strand.strand_code]: {
            ...prev[strand.strand_code],
            lessons: generatedStrandLessons,
            loading: false,
            isGenerated: true
          }
        }))

        setSuccess(`Generated ${generatedStrandLessons.length} lessons for ${strand.strand_name}`)
      } else {
        const data = await res.json()
        setError(data.error || `Failed to generate lessons for ${strand.strand_name}`)
        setStrandGenerations(prev => ({
          ...prev,
          [strand.strand_code]: { ...prev[strand.strand_code], loading: false }
        }))
      }
    } catch (err) {
      setError(`Failed to generate lessons for ${strand.strand_name}: ${err.message}`)
      console.error('Strand generation error:', err)
      setStrandGenerations(prev => ({
        ...prev,
        [strand.strand_code]: { ...prev[strand.strand_code], loading: false }
      }))
    }
  }

  // Approve all lessons in a strand at once
  const approveAllStrandLessons = async (strand) => {
    if (!selectedGrade || !selectedGrade.id || !selectedFramework) {
      setError('Please select a framework and grade first')
      return
    }

    const strandGen = strandGenerations[strand.strand_code]
    if (!strandGen?.lessons || strandGen.lessons.length === 0) {
      setError('No lessons to approve in this strand')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Get the latest grade data to ensure we have a valid ID
      const gradesRes = await fetch(`/api/admin-settings?type=grades&parent_id=${selectedFramework.id}`)
      let currentGradeId = selectedGrade.id
      
      if (gradesRes.ok) {
        const gradesData = await gradesRes.json()
        const latestGrade = gradesData.grades?.find(g => g.name === selectedGrade.name)
        if (latestGrade) {
          currentGradeId = latestGrade.id
        }
      }

      // Approve all lessons in the strand
      let successCount = 0
      let errorCount = 0

      for (const lesson of strandGen.lessons) {
        try {
          const res = await fetch('/api/admin-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ 
              action: 'add', 
              type: 'lesson', 
              value: lesson.name.trim(),
              parent_id: currentGradeId,
              description: lesson.description || '',
              performance_expectation: lesson.performance_expectation || '',
              // Include strand information
              strandCode: strand.strand_code,
              strandName: strand.strand_name,
              strandTopics: strand.key_topics || [],
              strandLessonCount: strand.target_lesson_count || 0,
              frameworkId: selectedFramework?.id,
              gradeId: currentGradeId
            })
          })

          if (res.ok) {
            successCount++
          } else {
            errorCount++
            console.error(`Failed to save lesson: ${lesson.name}`)
          }
        } catch (err) {
          errorCount++
          console.error(`Error saving lesson: ${lesson.name}`, err)
        }
      }

      // Clear approved lessons from pending
      setStrandGenerations(prev => ({
        ...prev,
        [strand.strand_code]: {
          ...prev[strand.strand_code],
          lessons: []
        }
      }))

      // Reload lessons for this grade
      await loadLessons(currentGradeId)
      // Reload saved strands
      await loadSavedStrands()

      if (errorCount === 0) {
        showSuccess(`✓ All ${successCount} lessons saved with strand "${strand.strand_name}"`)
      } else {
        setSuccess(`${successCount} lessons saved, ${errorCount} failed`)
      }
    } catch (err) {
      setError('Error approving lessons: ' + err.message)
      console.error('Approve all error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Reject all lessons in a strand
  const rejectAllStrandLessons = (strand) => {
    setStrandGenerations(prev => ({
      ...prev,
      [strand.strand_code]: {
        ...prev[strand.strand_code],
        lessons: []
      }
    }))
    showSuccess(`All lessons from "${strand.strand_name}" rejected`)
  }

  const approveStrandLesson = async (strandCode, lesson) => {
    if (!selectedGrade || !selectedGrade.id) return

    setLoading(true)
    setError('')

    try {
      // Get the latest grade data to ensure we have a valid ID
      const gradesRes = await fetch(`/api/admin-settings?type=grades&parent_id=${selectedFramework.id}`)
      let currentGradeId = selectedGrade.id
      
      if (gradesRes.ok) {
        const gradesData = await gradesRes.json()
        const latestGrade = gradesData.grades?.find(g => g.name === selectedGrade.name)
        if (latestGrade) {
          currentGradeId = latestGrade.id
        }
      }

      // Find the strand data from lessonDiscovery
      const strand = lessonDiscovery?.major_parts?.find(s => s.strand_code === strandCode)

      const res = await fetch('/api/admin-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'add', 
          type: 'lesson', 
          value: lesson.name.trim(),
          parent_id: currentGradeId,
          description: lesson.description || '',
          performance_expectation: lesson.performance_expectation || '',
          // Include strand information
          strandCode: strand?.strand_code || strandCode,
          strandName: strand?.strand_name || '',
          strandTopics: strand?.key_topics || [],
          strandLessonCount: strand?.target_lesson_count || 0,
          frameworkId: selectedFramework?.id,
          gradeId: currentGradeId
        })
      })

      if (res.ok) {
        // Remove approved lesson from pending
        setStrandGenerations(prev => ({
          ...prev,
          [strandCode]: {
            ...prev[strandCode],
            lessons: prev[strandCode].lessons.filter(l => l.id !== lesson.id)
          }
        }))
        
        // Reload lessons for this grade
        await loadLessons(currentGradeId)
        // Reload saved strands
        await loadSavedStrands()
        setSuccess(`Lesson "${lesson.name}" saved with strand`)
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save lesson')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
      console.error('Approve error:', err)
    } finally {
      setLoading(false)
    }
  }

  const rejectStrandLesson = (strandCode, lesson) => {
    setStrandGenerations(prev => ({
      ...prev,
      [strandCode]: {
        ...prev[strandCode],
        lessons: prev[strandCode].lessons.filter(l => l.id !== lesson.id)
      }
    }))
    setSuccess(`Lesson "${lesson.name}" rejected`)
    setTimeout(() => setSuccess(''), 3000)
  }

  const toggleStrandExpanded = (strandCode) => {
    setExpandedStrands(prev => ({
      ...prev,
      [strandCode]: !prev[strandCode]
    }))
  }

  const clearLessonDiscovery = () => {
    setLessonDiscovery(null)
    setStrandGenerations({})
    setExpandedStrands({})
    setLessonGenerationPhase(null)
  }

  return (
    <AdminLayout activePage="settings">
      <Head>
        <title>Admin Settings - MyTeachingSheets</title>
      </Head>

      <div className="admin-settings">
        {/* Compact Stats Header */}
        <div className="stats-header">
          <div className="stats-info">
            <span className="stat-item">
              <span className="stat-dot">•</span>
              <span className="stat-text">Subjects: {subjects.length}</span>
            </span>
            <span className="stat-item">
              <span className="stat-dot">•</span>
              <span className="stat-text">Frameworks: {frameworks.length}</span>
            </span>
            <span className="stat-item">
              <span className="stat-dot">•</span>
              <span className="stat-text">Grades: {grades.length}</span>
            </span>
            <span className="stat-item">
              <span className="stat-dot">•</span>
              <span className="stat-text">Lessons: {lessons.length}</span>
            </span>
          </div>
        </div>

        {error && (
          <div className="message error-message floating-notification">
            <svg className="message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="message success-message floating-notification">
            <svg className="message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>{success}</span>
          </div>
        )}

      <div className="hierarchy-container">
        {/* Level 1: Subjects */}
        <div className="hierarchy-level">
          <h2>1. Subjects</h2>
          
          {/* Manual Subject Addition + AI Subject Generation */}
          <div className="add-section">
            <input
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Add new subject or enter AI prompt"
              onKeyDown={(e) => e.key === 'Enter' && addItem('subject', newSubject)}
            />
            <button 
              onClick={generateSubjectsFromPrompt} 
              disabled={loading || !newSubject.trim()}
              title="Generate subjects with AI based on your prompt"
            >
              Generate
            </button>
            <button onClick={() => addItem('subject', newSubject)} disabled={loading || !newSubject.trim()}>
              Add
            </button>
          </div>

          {/* Generated Subjects Display */}
          {generatedSubjects.length > 0 && (
            <div style={{ marginTop: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: 0, marginBottom: '12px', color: '#1f2937' }}>
                Generated Subjects ({generatedSubjects.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {generatedSubjects.map((subject) => (
                  <div
                    key={subject.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'white',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <span style={{ fontSize: '0.95rem', color: '#1f2937', fontWeight: 500 }}>
                      {subject.name}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => approveGeneratedSubject(subject)}
                        disabled={loading}
                        style={{
                          padding: '6px 12px',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          transition: 'all 0.2s',
                          opacity: loading ? 0.6 : 1
                        }}
                        onMouseOver={(e) => !loading && (e.target.style.background = '#059669')}
                        onMouseOut={(e) => !loading && (e.target.style.background = '#10b981')}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectGeneratedSubject(subject)}
                        disabled={loading}
                        style={{
                          padding: '6px 12px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          transition: 'all 0.2s',
                          opacity: loading ? 0.6 : 1
                        }}
                        onMouseOver={(e) => !loading && (e.target.style.background = '#dc2626')}
                        onMouseOut={(e) => !loading && (e.target.style.background = '#ef4444')}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing Subjects List */}
          <div className="items-list">
            {subjects.map((subject) => (
              <div 
                key={subject.id} 
                className={`item ${selectedSubject?.id === subject.id ? 'selected' : ''}`}
                onClick={() => setSelectedSubject(subject)}
              >
                <span>{subject.name}</span>
                <button onClick={(e) => { e.stopPropagation(); deleteItem('subject', subject.id); }} className="delete-btn">×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Level 2: Frameworks */}
        {selectedSubject && (
          <div className="hierarchy-level">
            <h2>2. Frameworks for &quot;{selectedSubject.name}&quot;</h2>
            <div className="add-section">
              <input
                type="text"
                value={newFramework}
                onChange={(e) => setNewFramework(e.target.value)}
                placeholder="Add framework or enter AI prompt"
                onKeyDown={(e) => e.key === 'Enter' && addItem('framework', newFramework, selectedSubject.id)}
              />
              <button 
                onClick={generateFrameworksFromPrompt} 
                disabled={loading}
                title="Generate frameworks with AI (prompt optional)"
              >
                Generate
              </button>
              <button onClick={() => addItem('framework', newFramework, selectedSubject.id)} disabled={loading || !newFramework.trim()}>
                Add
              </button>
            </div>

            {/* Generated Frameworks Display */}
            {generatedFrameworks.length > 0 && (
              <div style={{ marginTop: '16px', padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: 0, marginBottom: '12px', color: '#1f2937' }}>
                  Generated Frameworks ({generatedFrameworks.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {generatedFrameworks.map((framework) => (
                    <div
                      key={framework.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: 'white',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      <span style={{ fontSize: '0.95rem', color: '#1f2937', fontWeight: 500 }}>
                        {framework.name}
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => approveGeneratedFramework(framework)}
                          disabled={loading}
                          style={{
                            padding: '6px 12px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            transition: 'all 0.2s',
                            opacity: loading ? 0.6 : 1
                          }}
                          onMouseOver={(e) => !loading && (e.target.style.background = '#059669')}
                          onMouseOut={(e) => !loading && (e.target.style.background = '#10b981')}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectGeneratedFramework(framework)}
                          disabled={loading}
                          style={{
                            padding: '6px 12px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            transition: 'all 0.2s',
                            opacity: loading ? 0.6 : 1
                          }}
                          onMouseOver={(e) => !loading && (e.target.style.background = '#dc2626')}
                          onMouseOut={(e) => !loading && (e.target.style.background = '#ef4444')}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="items-list">
              {frameworks.map((framework) => (
                <div 
                  key={framework.id} 
                  className={`item ${selectedFramework?.id === framework.id ? 'selected' : ''}`}
                  onClick={() => setSelectedFramework(framework)}
                >
                  <span>{framework.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteItem('framework', framework.id); }} className="delete-btn">×</button>
                </div>
              ))}
              {frameworks.length === 0 && <div className="empty-state">No frameworks yet. Add one above.</div>}
            </div>
          </div>
        )}

        {/* Level 3: Grades */}
        {selectedFramework && (
          <div className="hierarchy-level">
            <h2>3. Grades for &quot;{selectedFramework.name}&quot;</h2>
            <div className="add-section">
              <input
                type="text"
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
                placeholder="Add grade or enter AI prompt"
                onKeyDown={(e) => e.key === 'Enter' && addItem('grade', newGrade, selectedFramework.id)}
              />
              <button 
                onClick={generateGradesFromPrompt} 
                disabled={loading}
                title="Generate grades with AI (prompt optional)"
              >
                Generate
              </button>
              <button onClick={() => addItem('grade', newGrade, selectedFramework.id)} disabled={loading || !newGrade.trim()}>
                Add
              </button>
            </div>

            {/* Generated Grades Display */}
            {generatedGrades.length > 0 && (
              <div style={{ marginTop: '16px', padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: 0, marginBottom: '12px', color: '#1f2937' }}>
                  Generated Grades ({generatedGrades.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {generatedGrades.map((grade) => (
                    <div
                      key={grade.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: 'white',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      <span style={{ fontSize: '0.95rem', color: '#1f2937', fontWeight: 500 }}>
                        {grade.name}
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => approveGeneratedGrade(grade)}
                          disabled={loading}
                          style={{
                            padding: '6px 12px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            transition: 'all 0.2s',
                            opacity: loading ? 0.6 : 1
                          }}
                          onMouseOver={(e) => !loading && (e.target.style.background = '#059669')}
                          onMouseOut={(e) => !loading && (e.target.style.background = '#10b981')}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectGeneratedGrade(grade)}
                          disabled={loading}
                          style={{
                            padding: '6px 12px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            transition: 'all 0.2s',
                            opacity: loading ? 0.6 : 1
                          }}
                          onMouseOver={(e) => !loading && (e.target.style.background = '#dc2626')}
                          onMouseOut={(e) => !loading && (e.target.style.background = '#ef4444')}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="items-list">
              {grades.map((grade) => (
                <div 
                  key={grade.id} 
                  className={`item ${selectedGrade?.id === grade.id ? 'selected' : ''}`}
                  onClick={() => setSelectedGrade(grade)}
                >
                  <span>{grade.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteItem('grade', grade.id); }} className="delete-btn">×</button>
                </div>
              ))}
              {grades.length === 0 && <div className="empty-state">No grades yet. Add one above.</div>}
            </div>
          </div>
        )}

        {/* Level 4: Lessons - Multi-Phase Generation */}
        {selectedGrade && (
          <div className="hierarchy-level">
            <h2>4. Lessons for Grade &quot;{selectedGrade.name}&quot;</h2>
            
            {/* PHASE 1: Discovery */}
            {!lessonGenerationPhase && (
              <>
                <div className="add-section" style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#4b5563', marginBottom: '6px' }}>
                    Total Lesson Count (for this framework)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={customTotalLessonCount}
                    onChange={(e) => setCustomTotalLessonCount(Math.max(1, parseInt(e.target.value) || 45))}
                    placeholder="Enter total lesson count"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '0.95rem',
                      marginBottom: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div className="add-section">
                  <button
                    onClick={discoverLessonStrands}
                    disabled={discoveryLoading}
                    className="add-btn"
                    style={{
                      background: discoveryLoading ? '#d1d5db' : '#3b82f6',
                      cursor: discoveryLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {discoveryLoading ? 'Analyzing Framework...' : 'Start: Analyze Framework'}
                  </button>
                </div>
              </>
            )}

            {/* PHASE 1: Discovery Results */}
            {lessonDiscovery && lessonGenerationPhase === 'discovery' && (
              <div style={{ marginTop: '16px', padding: '16px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: '#1e40af' }}>
                    Framework Analysis: {lessonDiscovery.total_lessons_planned || 0} Lessons Planned
                  </h3>
                  <button
                    onClick={clearLessonDiscovery}
                    style={{
                      padding: '4px 12px',
                      background: '#94a3b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}
                  >
                    Clear
                  </button>
                </div>

                {lessonDiscovery.framework_summary && (
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                    {lessonDiscovery.framework_summary}
                  </p>
                )}

                {/* Strands List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(lessonDiscovery.major_parts || []).map((strand, idx) => {
                    const strandGen = strandGenerations[strand.strand_code]
                    const isExpanded = expandedStrands[strand.strand_code]

                    return (
                      <div
                        key={strand.strand_code}
                        style={{
                          border: '1px solid #bfdbfe',
                          borderRadius: '6px',
                          background: 'white',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Strand Header */}
                        <div
                          onClick={() => toggleStrandExpanded(strand.strand_code)}
                          style={{
                            padding: '12px 14px',
                            background: '#eff6ff',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            userSelect: 'none'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e40af', marginBottom: '2px' }}>
                              {isExpanded ? '▼' : '▶'} {strand.strand_code}: {strand.strand_name}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              Target: {strand.target_lesson_count} lessons
                              {strandGen?.lessons?.length > 0 && (
                                <span style={{ marginLeft: '12px', color: strandGen?.isGenerated ? '#059669' : '#6b7280' }}>
                                  {strandGen.lessons.length} {strandGen.lessons.length === 1 ? 'pending' : 'pending'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {!strandGen?.lessons?.length && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  generateLessonsForStrand(strand)
                                }}
                                disabled={strandGen?.loading}
                                style={{
                                  padding: '6px 12px',
                                  background: strandGen?.loading ? '#d1d5db' : '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: strandGen?.loading ? 'not-allowed' : 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {strandGen?.loading ? 'Generating...' : 'Generate'}
                              </button>
                            )}
                            {strandGen?.lessons?.length > 0 && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    generateLessonsForStrand(strand)
                                  }}
                                  disabled={strandGen?.loading}
                                  style={{
                                    padding: '6px 12px',
                                    background: strandGen?.loading ? '#d1d5db' : '#f59e0b',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: strandGen?.loading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {strandGen?.loading ? 'Regenerating...' : 'Regenerate'}
                                </button>
                                {/* Approve All Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    approveAllStrandLessons(strand)
                                  }}
                                  disabled={loading}
                                  style={{
                                    padding: '6px 12px',
                                    background: loading ? '#d1d5db' : '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap'
                                  }}
                                  onMouseOver={(e) => !loading && (e.target.style.background = '#059669')}
                                  onMouseOut={(e) => !loading && (e.target.style.background = '#10b981')}
                                >
                                  {loading ? 'Saving...' : '✓ Approve All'}
                                </button>
                                {/* Reject All Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    rejectAllStrandLessons(strand)
                                  }}
                                  disabled={loading}
                                  style={{
                                    padding: '6px 12px',
                                    background: loading ? '#d1d5db' : '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap'
                                  }}
                                  onMouseOver={(e) => !loading && (e.target.style.background = '#dc2626')}
                                  onMouseOut={(e) => !loading && (e.target.style.background = '#ef4444')}
                                >
                                  ✗ Reject All
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Strand Details - Collapsed */}
                        {!isExpanded && (
                          <div style={{ padding: '10px 14px', background: '#f8fafc', fontSize: '0.8rem', color: '#64748b' }}>
                            Topics: {(strand.key_topics || []).join(', ') || 'N/A'}
                          </div>
                        )}

                        {/* Strand Details - Expanded */}
                        {isExpanded && (
                          <div style={{ padding: '12px 14px', background: '#f8fafc', borderTop: '1px solid #e0e7ff' }}>
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                Key Topics:
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                {(strand.key_topics || []).join(', ') || 'N/A'}
                              </div>
                            </div>

                            {strand.performance_expectations?.length > 0 && (
                              <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                                  Performance Expectations:
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {strand.performance_expectations.map((pe) => (
                                    <span
                                      key={pe}
                                      style={{
                                        background: '#dbeafe',
                                        padding: '2px 8px',
                                        borderRadius: '3px',
                                        fontFamily: 'monospace'
                                      }}
                                    >
                                      {pe}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Generated Lessons for this Strand */}
                            {strandGen?.lessons?.length > 0 && (
                              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e0e7ff' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                                  Generated Lessons ({strandGen.lessons.length}/{strand.target_lesson_count}):
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {strandGen.lessons.map((lesson, lessonIdx) => (
                                    <div
                                      key={lesson.id}
                                      style={{
                                        padding: '10px 12px',
                                        background: 'white',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem'
                                      }}
                                    >
                                      <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
                                        {lessonIdx + 1}. {lesson.name}
                                      </div>
                                      {lesson.description && (
                                        <div style={{ color: '#475569', fontSize: '0.75rem', lineHeight: 1.4, marginBottom: '6px' }}>
                                          {lesson.description}
                                        </div>
                                      )}
                                      {lesson.performance_expectation && (
                                        <div style={{ color: '#64748b', fontSize: '0.75rem', fontStyle: 'italic', marginBottom: '6px' }}>
                                          PE: {lesson.performance_expectation}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Summary */}
                <div style={{ marginTop: '12px', padding: '12px', background: 'white', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                    Progress: {Object.keys(strandGenerations).filter(code => strandGenerations[code]?.isGenerated).length} of {(lessonDiscovery.major_parts || []).length} strands generated
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px', fontStyle: 'italic' }}>
                    💡 Strands will be automatically saved when you approve lessons
                  </div>
                </div>

                {/* Saved Strands Display */}
                {savedStrands.length > 0 && (
                  <div style={{ marginTop: '16px', padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0 0 12px 0', color: '#166534' }}>
                      ✓ Saved Strands ({savedStrands.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {savedStrands.map((strand) => (
                        <div
                          key={strand.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 14px',
                            background: 'white',
                            borderRadius: '6px',
                            border: '1px solid #dcfce7'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#166534', marginBottom: '2px' }}>
                              {strand.code}: {strand.name}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#4b7c0f' }}>
                              {strand.target_lesson_count} lessons • Topics: {(strand.topics || []).join(', ') || 'N/A'}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteStrand(strand.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => (e.target.style.background = '#dc2626')}
                            onMouseOut={(e) => (e.target.style.background = '#ef4444')}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Fallback: Manual Lesson Input (when not using discovery mode) */}
            {!lessonGenerationPhase && (
              <>
                <div className="add-section-with-description" style={{ marginTop: '12px' }}>
                  <input
                    type="text"
                    value={newLesson}
                    onChange={(e) => setNewLesson(e.target.value)}
                    placeholder="Lesson name or enter AI prompt"
                    className="lesson-name-input"
                  />
                  <textarea
                    value={newLessonDescription}
                    onChange={(e) => setNewLessonDescription(e.target.value)}
                    placeholder="Lesson description (optional)"
                    className="lesson-description-input"
                    rows="2"
                  />
                  <button
                    onClick={() => addItem('lesson', newLesson, selectedGrade.id, newLessonDescription)}
                    disabled={loading || !newLesson.trim()}
                    className="add-lesson-btn"
                  >
                    Add
                  </button>
                </div>

              </>
            )}

            {/* Saved Lessons List */}
            <div className="items-list" style={{ marginTop: lessonGenerationPhase ? '24px' : '12px' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#4b5563', marginBottom: '12px' }}>
                Saved Lessons ({lessons.length})
              </div>
              {lessons.map((lesson) => (
                <div key={lesson.id} className="item lesson-item">
                  <div className="lesson-content">
                    <span className="lesson-name">{lesson.name}</span>
                    {lesson.description && <p className="lesson-description">{lesson.description}</p>}
                  </div>
                  <button onClick={() => deleteItem('lesson', lesson.id)} className="delete-btn">×</button>
                </div>
              ))}
              {lessons.length === 0 && <div className="empty-state">No lessons yet. Generate or add one above.</div>}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-settings {
          width: 100%;
        }

        /* Stats Dashboard */
        .stats-header {
          background: white;
          border-bottom: 1px solid var(--border-light);
          padding: 12px 0;
          margin-bottom: 24px;
          border-radius: 8px 8px 0 0;
        }

        .stats-info {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          font-size: 0.9rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .stat-dot {
          color: var(--accent-amber);
          font-size: 1.2rem;
          line-height: 1;
        }

        .stat-text {
          color: var(--primary-navy);
        }

        .message {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-radius: 10px;
          margin-bottom: 24px;
          font-size: 0.95rem;
          animation: slideIn 0.3s ease;
        }

        .floating-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          margin-bottom: 0;
          z-index: 1000;
          max-width: 400px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          animation: slideInRight 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(400px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .message-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .error-message {
          background: #ffebee;
          color: #c62828;
          border: 1px solid #ef5350;
        }

        .success-message {
          background: #e8f5e9;
          color: #2e7d32;
          border: 1px solid #66bb6a;
        }

        .hierarchy-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
          gap: 24px;
        }

        .hierarchy-level {
          background: white;
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 24px;
          min-height: 400px;
          box-shadow: var(--shadow-sm);
          transition: all 0.2s;
        }

        .hierarchy-level:hover {
          box-shadow: var(--shadow-md);
        }

        .hierarchy-level h2 {
          font-size: 1.15rem;
          margin: 0 0 20px 0;
          color: var(--primary-navy);
          font-weight: 600;
          padding-bottom: 12px;
          border-bottom: 2px solid var(--border-light);
        }

        .add-section {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .add-section input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .add-section button {
          padding: 10px 20px;
          background: var(--accent-amber);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .add-section button:hover:not(:disabled) {
          background: var(--accent-amber-dark);
          transform: translateY(-1px);
        }

        .add-section button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .add-section-with-description {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .lesson-name-input {
          padding: 8px 12px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .lesson-description-input {
          padding: 8px 12px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-size: 0.85rem;
          font-family: inherit;
          resize: vertical;
        }

        .add-lesson-btn {
          padding: 10px 20px;
          background: var(--accent-amber);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.2s;
          align-self: flex-start;
        }

        .add-lesson-btn:hover:not(:disabled) {
          background: var(--accent-amber-dark);
          transform: translateY(-1px);
        }

        .add-lesson-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .items-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .item:hover {
          background: var(--bg-hover);
          border-color: var(--primary-color);
        }

        .item.selected {
          background: #e8f4f8;
          border-color: var(--accent-amber);
          box-shadow: 0 0 0 3px rgba(91, 125, 177, 0.1);
          font-weight: 500;
        }

        .item span {
          flex: 1;
          font-size: 0.9rem;
          color: var(--text-primary);
        }

        .lesson-item {
          flex-direction: column;
          align-items: flex-start;
          padding: 12px;
          position: relative;
        }

        .lesson-content {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-right: 30px;
        }

        .lesson-name {
          font-weight: 500;
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .lesson-description {
          margin: 0;
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .lesson-item .delete-btn {
          position: absolute;
          top: 12px;
          right: 12px;
        }

        .delete-btn {
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          color: #d32f2f;
          font-size: 1.3rem;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }

        .delete-btn:hover {
          background: #ffebee;
        }

        .empty-state {
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-style: italic;
          padding: 20px;
        }

        @media (max-width: 768px) {
          .admin-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .hierarchy-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      </div>
    </AdminLayout>
  )
}

export async function getServerSideProps(ctx) {
  const token = ctx.req.cookies?.['log_admin_token'] || ''
  if (!process.env.LOG_ADMIN_TOKEN || token !== process.env.LOG_ADMIN_TOKEN) {
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false,
      },
    }
  }

  // Load initial subjects server-side
  const { createClient } = require('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  let subjects = []
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })
    
    if (!error && data) {
      subjects = data
    }
  } catch (err) {
    console.error('Error loading subjects:', err)
  }

  return {
    props: {
      initialSubjects: subjects
    }
  }
}
