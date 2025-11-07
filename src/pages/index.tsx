import React, { useState } from 'react'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Input from '@/components/Input'
import Textarea from '@/components/Textarea'
import Alert from '@/components/Alert'
import Modal from '@/components/Modal'
import PaymentModal from '@/components/PaymentModal'
import SelectionStep from '@/components/SelectionStep'
import ProgressIndicator from '@/components/ProgressIndicator'
import ExportButton from '@/components/ExportButton'
import { downloadLessonsAsExcel, downloadCompleteCurriculumAsExcel, downloadStep5OrganizedExcel, downloadStep5SectionExcel, downloadSubStandardExcel } from '@/lib/excelExport'
import { generateContent } from '@/lib/api'
import { supabase } from '@/lib/supabase'

interface Item {
  id?: string
  name: string
  title?: string
  description: string
}

interface Strand {
  strand_code: string
  strand_name: string
  num_standards: number
  key_topics: string[]
  target_lesson_count: number
  performance_expectations: string[]
}

export default function Home() {
  // Helper to ensure session is valid before API calls
  const ensureValidSession = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error || !data?.session?.access_token) {
        console.error('No valid session found:', error)
        setError('Your session has expired. Please refresh the page and log in again.')
        return false
      }
      return true
    } catch (err) {
      console.error('Session check error:', err)
      setError('Authentication error. Please refresh the page.')
      return false
    }
  }

  // State management
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [requestedSubjectsCount, setRequestedSubjectsCount] = useState<string>('10')
  const [subjects, setSubjects] = useState<Item[]>([])
  const [stateCurricula, setStateCurricula] = useState<any[]>([])
  const [frameworks, setFrameworks] = useState<Item[]>([])
  const [grades, setGrades] = useState<Item[]>([])
  // Step 3: categorized grades (Elementary, Middle school, High school)
  const [gradeCategories, setGradeCategories] = useState<{
    elementary?: { label: string, grades: Item[] }
    middle_school?: { label: string, grades: Item[] }
    high_school?: { label: string, grades: Item[] }
    select_all_labels?: { elementary?: string, middle_school?: string, high_school?: string }
  }>({})
  const [strands, setStrands] = useState<Strand[]>([])
  const [lessons, setLessons] = useState<Item[]>([])
  // Step 5: sub-standards under sections
  const [subStandardsBySection, setSubStandardsBySection] = useState<Record<string, any[]>>({})
  const [lessonsBySection, setLessonsBySection] = useState<Record<string, any[]>>({})
  const [selectedLessonsBySection, setSelectedLessonsBySection] = useState<Record<string, Record<string, boolean>>>({})
  const [lessonsPerSubStandardBySection, setLessonsPerSubStandardBySection] = useState<Record<string, number>>({})
  const [bulkLessonsAmount, setBulkLessonsAmount] = useState<number>(0)
  const [loadingSectionKey, setLoadingSectionKey] = useState<string | null>(null)
  const [loadingLessonsSectionKey, setLoadingLessonsSectionKey] = useState<string | null>(null)
  const [bulkLoadingLessonsSectionKeys, setBulkLoadingLessonsSectionKeys] = useState<Set<string>>(new Set())
  const [lessonsPerSingleSub, setLessonsPerSingleSub] = useState<Record<string, number>>({})
  const [loadingSingleLessonsKey, setLoadingSingleLessonsKey] = useState<string | null>(null)
  const [selectedSubStandardsBySection, setSelectedSubStandardsBySection] = useState<Record<string, Record<string, boolean>>>({})
  const [loadingSelectedLessonsSecKey, setLoadingSelectedLessonsSecKey] = useState<string | null>(null)
  const [bulkLoadingSectionKeys, setBulkLoadingSectionKeys] = useState<Set<string>>(new Set())
  // Success indicators (flash green after completion)
  const [completedLessonsBySection, setCompletedLessonsBySection] = useState<Record<string, number>>({})
  const [completedSelectedLessonsBySection, setCompletedSelectedLessonsBySection] = useState<Record<string, number>>({})
  const [completedSingleLessons, setCompletedSingleLessons] = useState<Record<string, number>>({})

  // Helpers for lesson selection in Step 5
  const getLessonKey = (ls: any) => {
    const code = String(ls.standard_code || ls.code || '').toLowerCase().trim()
    const title = String(ls.title || ls.name || '').toLowerCase().trim()
    return `${code}__${title}`
  }

  const toggleLessonSelection = (section: any, lesson: any) => {
    const secKey = String(section.id || section.name || section.title || '')
    const lk = getLessonKey(lesson)
    setSelectedLessonsBySection((prev) => {
      const map = { ...(prev[secKey] || {}) }
      map[lk] = !map[lk]
      return { ...prev, [secKey]: map }
    })
  }

  // Step 5: Excel exports
  const handleExportSectionLessons = (section: any) => {
    try {
      const secKey = String(section.id || section.name || section.title || '')
      const sectionLessons = lessonsBySection[secKey] || []
      if (!Array.isArray(sectionLessons) || sectionLessons.length === 0) return
      const sectionTitle = String(section.title || section.name || secKey)
      const subs = subStandardsBySection[secKey] || []
      downloadStep5SectionExcel(
        secKey,
        sectionTitle,
        sectionLessons,
        subs,
        selectedSubject?.name || '',
        selectedFramework?.name || '',
        selectedGrade?.name || ''
      )
    } catch (e) {
      console.error('Export section lessons failed', e)
    }
  }

  const handleExportAllStep5Lessons = () => {
    try {
      const hasAny = Object.values(lessonsBySection || {}).some((arr) => Array.isArray(arr) && arr.length > 0)
      if (!hasAny) return
      // Build section name map
      const sectionNamesByKey: Record<string, string> = {}
      const sectionOrder: string[] = []
      curriculumSections.forEach((sec: any) => {
        const key = String(sec.id || sec.name || sec.title || '')
        const title = String(sec.title || sec.name || key)
        sectionNamesByKey[key] = title
        sectionOrder.push(key)
      })
      downloadStep5OrganizedExcel(
        lessonsBySection,
        subStandardsBySection,
        sectionNamesByKey,
        selectedSubject?.name || '',
        selectedFramework?.name || '',
        selectedGrade?.name || '',
        sectionOrder
      )
    } catch (e) {
      console.error('Export all Step 5 lessons failed', e)
    }
  }

  const handleOpenTablesPage = () => {
    try {
      // Check if user previously cleared Tables for this same content
      let existingData: any = null
      let existingRaw: string | null = null
      let existingCleared = false
      let deletedFlag = false
      let deletedSig: string | null = null
      try {
        existingRaw = window.localStorage.getItem('ta_tables_data')
        if (existingRaw) {
          existingData = JSON.parse(existingRaw)
          existingCleared = !!existingData?.userCleared
        }
        deletedFlag = window.localStorage.getItem('ta_tables_deleted') === '1'
        deletedSig = window.localStorage.getItem('ta_tables_deleted_signature')
      } catch {
        // ignore
      }

      // Build new payload context and signature
      const sectionNamesByKey: Record<string, string> = {}
      curriculumSections.forEach((sec: any) => {
        const key = String(sec.id || sec.name || sec.title || '')
        const title = String(sec.title || sec.name || key)
        sectionNamesByKey[key] = title
      })
      const sectionOrder = Object.keys(sectionNamesByKey)
      const newLessonsSig = (() => {
        try { return JSON.stringify(lessonsBySection || {}) } catch { return null }
      })()

      // If user cleared previous tables and content signature matches, don't overwrite
      if (deletedFlag && deletedSig && newLessonsSig && deletedSig === newLessonsSig) {
        window.open('/tables', '_blank')
        return
      }

      // Compute only-new lessons (exclude any lessons already present in existing tables)
      const getLessonKey = (ls: any) => {
        const code = String(ls.standard_code || ls.code || '').toLowerCase().trim()
        const title = String(ls.title || ls.name || '').toLowerCase().trim()
        return `${code}__${title}`
      }
      const existingKeysBySection: Record<string, Set<string>> = {}
      try {
        const existingBySec = existingData?.lessonsBySection || {}
        Object.keys(existingBySec || {}).forEach((k) => {
          const set = new Set<string>()
          const arr = Array.isArray(existingBySec[k]) ? existingBySec[k] : []
          arr.forEach((ls: any) => set.add(getLessonKey(ls)))
          existingKeysBySection[k] = set
        })
      } catch {}

      const filteredLessonsBySection: Record<string, any[]> = {}
      let totalNewCount = 0
      Object.keys(lessonsBySection || {}).forEach((k) => {
        const arr = Array.isArray((lessonsBySection as any)[k]) ? (lessonsBySection as any)[k] : []
        const existSet = existingKeysBySection[k] || new Set<string>()
        const filtered = arr.filter((ls: any) => !existSet.has(getLessonKey(ls)))
        if (filtered.length > 0) {
          filteredLessonsBySection[k] = filtered
          totalNewCount += filtered.length
        }
      })

      // If there are no new lessons to move, just open the current Tables view
      if (totalNewCount === 0) {
        window.open('/tables', '_blank')
        return
      }

      // Build filtered sub-standards and names for the sections that have new lessons
      const filteredSectionOrder: string[] = []
      const filteredNamesByKey: Record<string, string> = {}
      const filteredSubStandardsBySection: Record<string, any[]> = {}
      curriculumSections.forEach((sec: any) => {
        const key = String(sec.id || sec.name || sec.title || '')
        if (Array.isArray(filteredLessonsBySection[key]) && filteredLessonsBySection[key].length > 0) {
          filteredSectionOrder.push(key)
          filteredNamesByKey[key] = sectionNamesByKey[key]
          // Restrict sub-standards to those that appear in filtered lessons
          const codes = new Set(
            filteredLessonsBySection[key].map((ls: any) => String(ls.standard_code || ls.code || '').trim().toLowerCase())
          )
          const subs = ((subStandardsBySection as any)[key] || []).filter((ss: any, idx: number) => {
            const code = String(ss?.code || `S${idx + 1}`).trim().toLowerCase()
            return codes.has(code)
          })
          filteredSubStandardsBySection[key] = subs
        }
      })

      // Archive existing Tables payload if present and not a cleared shell
      try {
        if (existingRaw && !existingCleared) {
          const archivesRaw = window.localStorage.getItem('ta_tables_archive')
          const archives = Array.isArray(JSON.parse(archivesRaw || '[]')) ? JSON.parse(archivesRaw || '[]') : []
          const snapshot = {
            savedAt: new Date().toISOString(),
            data: JSON.parse(existingRaw)
          }
          archives.unshift(snapshot)
          // Trim archive to last 10 snapshots to prevent unbounded growth
          if (archives.length > 10) archives.length = 10
          window.localStorage.setItem('ta_tables_archive', JSON.stringify(archives))
        }
      } catch {
        // ignore archive errors
      }

      const payload = {
        lessonsBySection: filteredLessonsBySection,
        subStandardsBySection: filteredSubStandardsBySection,
        sectionNamesByKey: filteredNamesByKey,
        sectionOrder: filteredSectionOrder,
        subject: selectedSubject?.name || '',
        framework: selectedFramework?.name || '',
        grade: selectedGrade?.name || '',
        region: selectedRegion || '',
        // Explicit headers for Tables exports
        headerSubjectName: selectedFramework?.name || '', // Step 4: Framework/Units
        headerGradeLevel: selectedGrade?.name || '',      // Step 3: Grade
        headerCurriculum: (selectedStateCurriculum?.curriculum_name || selectedSubject?.name || ''), // Step 2: Curriculum
        headerRegion: selectedRegion || '',
      }
      // Remove the moved lessons from Step 5 state and clear their selections
      try {
        const nextLessonsBySection: Record<string, any[]> = {}
        Object.keys(lessonsBySection || {}).forEach((k) => {
          const original = Array.isArray((lessonsBySection as any)[k]) ? (lessonsBySection as any)[k] : []
          const moved = Array.isArray(filteredLessonsBySection[k]) ? filteredLessonsBySection[k] : []
          if (moved.length === 0) {
            nextLessonsBySection[k] = original
            return
          }
          const movedSet = new Set(moved.map((ls: any) => getLessonKey(ls)))
          nextLessonsBySection[k] = original.filter((ls: any) => !movedSet.has(getLessonKey(ls)))
        })
        setLessonsBySection(nextLessonsBySection)

        const nextSelected: Record<string, Record<string, boolean>> = {}
        Object.keys(selectedLessonsBySection || {}).forEach((k) => {
          const moved = Array.isArray(filteredLessonsBySection[k]) ? filteredLessonsBySection[k] : []
          const prevSelRaw = (selectedLessonsBySection as any)[k]
          const prevSel: Record<string, boolean> = prevSelRaw ? { ...prevSelRaw } : {}
          if (moved.length === 0) {
            nextSelected[k] = prevSel
            return
          }
          const movedSet = new Set(moved.map((ls: any) => getLessonKey(ls)))
          const cleaned: Record<string, boolean> = {}
          Object.keys(prevSel || {}).forEach((lk) => { if (!movedSet.has(lk)) cleaned[lk] = prevSel[lk] })
          nextSelected[k] = cleaned
        })
        setSelectedLessonsBySection(nextSelected)

        // Small success toast
        setSuccess(`${totalNewCount} lesson(s) moved to Tables and removed from Step 5.`)
        setTimeout(() => setSuccess(null), 2500)
      } catch {}

      window.localStorage.setItem('ta_tables_data', JSON.stringify(payload))
      // Clear deletion markers since we're intentionally overwriting with (potentially) new content
      try {
        window.localStorage.removeItem('ta_tables_deleted')
        window.localStorage.removeItem('ta_tables_deleted_signature')
      } catch {}
      window.open('/tables', '_blank')
    } catch (e) {
      console.error('Open tables page failed', e)
    }
  }

  const handleExportSubStandardLessons = (section: any, ss: any, idx: number) => {
    try {
      const secKey = String(section.id || section.name || section.title || '')
      const sectionTitle = String(section.title || section.name || secKey)
      const code = String(ss.code || `S${idx + 1}`)
      const codeN = String(code).trim().toLowerCase()
      const sectionLessons = (lessonsBySection[secKey] || []).filter((ls: any) => String(ls.standard_code || ls.code || '').trim().toLowerCase() === codeN)
      if (sectionLessons.length === 0) return
      downloadSubStandardExcel(
        sectionTitle,
        code,
        String(ss.title || ss.name || ''),
        sectionLessons,
        selectedSubject?.name || '',
        selectedFramework?.name || '',
        selectedGrade?.name || ''
      )
    } catch (e) {
      console.error('Export sub-standard lessons failed', e)
    }
  }

  const toggleSelectAllLessonsInGroup = (section: any, groupCode: string, lessonsInGroup: any[]) => {
    const secKey = String(section.id || section.name || section.title || '')
    const current = { ...(selectedLessonsBySection[secKey] || {}) }
    const allSelected = lessonsInGroup.every((ls) => current[getLessonKey(ls)])
    lessonsInGroup.forEach((ls) => {
      const lk = getLessonKey(ls)
      current[lk] = !allSelected
    })
    setSelectedLessonsBySection((prev) => ({ ...prev, [secKey]: current }))
  }

  const toggleSelectAllLessonsInSection = (section: any) => {
    const secKey = String(section.id || section.name || section.title || '')
    const all = lessonsBySection[secKey] || []
    const current = { ...(selectedLessonsBySection[secKey] || {}) }
    const allSelected = all.length > 0 && all.every((ls: any) => current[getLessonKey(ls)])
    const next: Record<string, boolean> = {}
    if (!allSelected) {
      all.forEach((ls: any) => { next[getLessonKey(ls)] = true })
    }
    setSelectedLessonsBySection((prev) => ({ ...prev, [secKey]: next }))
  }

  const handleAddToProductGeneration = (section: any) => {
    const secKey = String(section.id || section.name || section.title || '')
    const all = lessonsBySection[secKey] || []
    const selectedMap = selectedLessonsBySection[secKey] || {}
    const selected = all.filter((ls: any) => selectedMap[getLessonKey(ls)])
    if (selected.length === 0) {
      setError('Please select at least one lesson to continue to product generation.')
      return
    }
    // Build summary context
    const summary = {
      country: selectedCountry,
      state: selectedRegion,
      curriculum_name: (() => {
        const name = String(selectedStateCurriculum?.curriculum_name || '')
        const isNoSpecial = name.toLowerCase().includes('no special curriculum')
        if (isNoSpecial && selectedStateStandardDetails?.standard_name) return selectedStateStandardDetails.standard_name
        return name
      })(),
      grade: selectedGrade?.name,
      section: section.title || section.name,
      sub_standards: Array.from(new Set(selected.map((ls: any) => String(ls.standard_code || ls.code || '').trim()))).filter(Boolean)
    }
    // Store pending lessons and show category selection modal
    setPendingLessonsForProduct(selected)
    setPendingProductSummary(summary)
    setSelectedProductGroup(null)
    setSelectedProductSubPage(null)
    setShowProductCategoryModal(true)
  }

  const handleConfirmProductCategorySelection = () => {
    if (!selectedProductGroup || !selectedProductSubPage) {
      setError('Please select both a group and sub-page.')
      return
    }
    try {
      if (typeof window !== 'undefined') {
        // Store the selected lessons grouped by sub-standard with product-specific keys for persistence
        const groupedStorageKey = `ta_product_${selectedProductGroup}_${selectedProductSubPage}_grouped`
        const archivedStorageKey = `ta_product_${selectedProductGroup}_${selectedProductSubPage}_archived`
        const summaryStorageKey = `ta_product_${selectedProductGroup}_${selectedProductSubPage}_summary`
        
        // Group new lessons by sub-standard
        const newGroupedLessons: { subStandard: string; lessons: any[] }[] = []
        pendingLessonsForProduct.forEach((lesson) => {
          const subStandard = String(lesson.standard_code || lesson.code || 'Ungrouped').trim()
          let group = newGroupedLessons.find((g) => g.subStandard === subStandard)
          if (!group) {
            group = { subStandard, lessons: [] }
            newGroupedLessons.push(group)
          }
          group.lessons.push(lesson)
        })
        
        // Get existing grouped lessons for this product sub-page (if any)
        const existingGroupedStr = window.localStorage.getItem(groupedStorageKey)
        const existingGrouped = existingGroupedStr ? JSON.parse(existingGroupedStr) : []
        
        // Merge new grouped lessons with existing ones (avoid duplicates)
        const mergedGrouped = [...existingGrouped]
        newGroupedLessons.forEach((newGroup) => {
          let existingGroup = mergedGrouped.find((g) => g.subStandard === newGroup.subStandard)
          if (!existingGroup) {
            existingGroup = { subStandard: newGroup.subStandard, lessons: [] }
            mergedGrouped.push(existingGroup)
          }
          // Add lessons to the group (avoid duplicates within the group)
          newGroup.lessons.forEach((newLesson) => {
            const isDuplicate = existingGroup.lessons.some(
              (existing: any) =>
                (existing.standard_code === newLesson.standard_code &&
                  existing.title === newLesson.title) ||
                (existing.name === newLesson.name &&
                  existing.standard_code === newLesson.standard_code)
            )
            if (!isDuplicate) {
              existingGroup.lessons.push(newLesson)
            }
          })
        })
        
        // Store merged grouped lessons and archived (empty at first)
        window.localStorage.setItem(groupedStorageKey, JSON.stringify(mergedGrouped))
        window.localStorage.setItem(archivedStorageKey, JSON.stringify([]))
        window.localStorage.setItem(summaryStorageKey, JSON.stringify(pendingProductSummary))
        
        // Also keep in temporary storage for product-generation page
        window.localStorage.setItem('ta_selected_lessons', JSON.stringify(pendingLessonsForProduct))
        window.localStorage.setItem('ta_selection_context', JSON.stringify(pendingProductSummary))
        
        // Navigate to the product page
        window.open(`/products/${selectedProductGroup}/${selectedProductSubPage}`, '_blank')
        setShowProductCategoryModal(false)
        setSuccess(`${pendingLessonsForProduct.length} lesson(s) added to ${selectedProductGroup} > ${selectedProductSubPage}!`)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (e) {
      setError('Failed to add lessons to product. Please try again.')
    }
  }
  const [curriculumSections, setCurriculumSections] = useState<any[]>([])
  const [selectedCurriculumSection, setSelectedCurriculumSection] = useState<any | null>(null)
  const [selectedCurriculumSections, setSelectedCurriculumSections] = useState<any[]>([])
  
  const [selectedSubject, setSelectedSubject] = useState<Item | null>(null)
  const [selectedStateCurriculum, setSelectedStateCurriculum] = useState<any | null>(null)
  const [selectedFramework, setSelectedFramework] = useState<Item | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<Item | null>(null)
  // Step 3: support multi-grade visual selection (used by Select All buttons)
  const [selectedGrades, setSelectedGrades] = useState<Item[]>([])
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [selectedStrand, setSelectedStrand] = useState<Strand | null>(null)
  const [selectedStrands, setSelectedStrands] = useState<Strand[]>([])
  
  const [context, setContext] = useState('')
  const [totalLessonCount, setTotalLessonCount] = useState('45')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [showContextModal, setShowContextModal] = useState(false)
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<Item | null>(null)
  // Payment modal for insufficient tokens
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentErrorMessage, setPaymentErrorMessage] = useState('Insufficient tokens. Please buy more credits to continue.')
  // Step 2: track which curriculum cards have expanded state lists
  const [expandedCurriculaStates, setExpandedCurriculaStates] = useState<Record<string, boolean>>({})
  // Step 2: state standard modal and cache
  const [showStateStandardModal, setShowStateStandardModal] = useState(false)
  const [stateStandardDetails, setStateStandardDetails] = useState<any | null>(null)
  const [loadingStateStandard, setLoadingStateStandard] = useState<string | null>(null)
  const [stateStandardCache, setStateStandardCache] = useState<Record<string, any>>({})
  const [pendingStateContext, setPendingStateContext] = useState<{ region: string, curriculum: any } | null>(null)
  // Persisted chosen state's standard after user confirms "Use this state"
  const [selectedStateStandardDetails, setSelectedStateStandardDetails] = useState<any | null>(null)
  // Step 2: highlight selection inside curricula/state chips
  const [highlightedRegion, setHighlightedRegion] = useState<string | null>(null)
  const [highlightedCurriculumName, setHighlightedCurriculumName] = useState<string | null>(null)
  // Step 2: custom curriculum grouping
  const [showCustomGroupModal, setShowCustomGroupModal] = useState(false)
  // Product category selection modal
  const [showProductCategoryModal, setShowProductCategoryModal] = useState(false)
  const [pendingLessonsForProduct, setPendingLessonsForProduct] = useState<any[]>([])
  const [pendingProductSummary, setPendingProductSummary] = useState<any | null>(null)
  const [selectedProductGroup, setSelectedProductGroup] = useState<string | null>(null)
  const [selectedProductSubPage, setSelectedProductSubPage] = useState<string | null>(null)
  const [customGroupName, setCustomGroupName] = useState('Custom Curriculum Group')
  const [customGroupDescription, setCustomGroupDescription] = useState('Custom grouping created by user')
  const [customGroupSelectedStates, setCustomGroupSelectedStates] = useState<string[]>([])

  // Country list
  const countries = [
    { name: 'USA', description: 'United States of America' },
    { name: 'Canada', description: 'Canada' },
    { name: 'Australia', description: 'Australia' },
    { name: 'UK', description: 'United Kingdom' }
  ]

  // Progress steps
  const steps = [
    { label: 'Country', completed: currentStep > 0, active: currentStep === 0 },
    { label: 'Subject', completed: currentStep > 1, active: currentStep === 1 },
    { label: 'State Curriculum', completed: currentStep > 2, active: currentStep === 2 },
    { label: 'Grade', completed: currentStep > 3, active: currentStep === 3 },
    { label: 'Framework', completed: currentStep > 4, active: currentStep === 4 },
    { label: 'Strands', completed: currentStep > 5, active: currentStep === 5 },
    { label: 'Lessons', completed: false, active: currentStep === 6 },
  ]

  // API handlers
  const handleGenerateSubjects = async (countryName?: string) => {
    const country = countryName || selectedCountry
    if (!country) {
      setError('Please select a country first.')
      return
    }
    
    // Don't reload if already have data for this country
    if (subjects.length > 0 && selectedCountry === country) return
    
    setIsLoading(true)
    setError(null)
    try {
      const countNum = parseInt(requestedSubjectsCount)
      const subjectsCount = Number.isFinite(countNum) && countNum > 0 ? countNum : undefined
      const response = await generateContent({
        type: 'subjects',
        country: country,
        context: context || '',
        subjectsCount
      })
      if (response.items) {
        setSubjects(response.items)
        setSuccess(`Generated ${response.items.length} subjects for ${country}!`)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError('Failed to generate subjects. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateStateCurricula = async () => {
    if (!selectedCountry || !selectedSubject) return
    
    // Don't reload if already have data
    if (stateCurricula.length > 0) {
      return
    }
    
    setIsLoading(true)
    setError(null)
    try {
      const response = await generateContent({
        type: 'state-curricula',
        country: selectedCountry,
        subject: selectedSubject.name,
        context: context || ''
      })
      if (response.items) {
        setStateCurricula(response.items)
        setCurrentStep(3)
        setSuccess(`Retrieved state curricula!`)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError('Failed to retrieve state curricula. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateFrameworks = async () => {
    if (!selectedSubject) return
    
    // Don't reload if already have data
    if (frameworks.length > 0) return
    
    setIsLoading(true)
    setError(null)
    try {
      const response = await generateContent({
        type: 'frameworks',
        country: selectedCountry || undefined,
        subject: selectedSubject.name,
        region: selectedRegion || undefined,
        context: context
      })
      if (response.items) {
        setFrameworks(response.items)
        setSuccess(`Generated ${response.items.length} frameworks!`)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError('Failed to generate frameworks. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateGrades = async () => {
    if (!selectedSubject) return
    
    // Don't reload if already have data
    if (grades.length > 0) return
    
    setIsLoading(true)
    setError(null)
    try {
      const response = await generateContent({
        type: 'grades',
        country: selectedCountry || undefined,
        subject: selectedSubject.name,
        framework: selectedFramework?.name,
        region: selectedRegion || undefined,
        context: context
      })
      if (response.items) {
        setGrades(response.items)
        // Parse categorized details if present
        if (response.details) {
          try {
            const details = JSON.parse(response.details)
            const cat = {
              elementary: details?.categories?.elementary ? {
                label: details?.categories?.elementary?.label || 'Elementary',
                grades: (details?.categories?.elementary?.grades || []).map((g: any) => ({
                  name: g.name, description: g.description || g.summary || '', title: g.title
                }))
              } : undefined,
              middle_school: details?.categories?.middle_school ? {
                label: details?.categories?.middle_school?.label || 'Middle school',
                grades: (details?.categories?.middle_school?.grades || []).map((g: any) => ({
                  name: g.name, description: g.description || g.summary || '', title: g.title
                }))
              } : undefined,
              high_school: details?.categories?.high_school ? {
                label: details?.categories?.high_school?.label || 'High school',
                grades: (details?.categories?.high_school?.grades || []).map((g: any) => ({
                  name: g.name, description: g.description || g.summary || '', title: g.title
                }))
              } : undefined,
              select_all_labels: details?.select_all_labels || {
                elementary: 'All Elementary', middle_school: 'All Middle School', high_school: 'All High School'
              }
            }
            setGradeCategories(cat)
          } catch {}
        }
        setSuccess(`Generated ${response.items.length} grades!`)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError('Failed to generate grades. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDiscoverStrands = async () => {
    if (!selectedSubject || !selectedFramework || !selectedGrade) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await generateContent({
        type: 'lesson-discovery',
        subject: selectedSubject.name,
        framework: selectedFramework.name,
        grade: selectedGrade.name,
        region: selectedRegion || undefined,
        totalLessonCount: parseInt(totalLessonCount) || 45
      })
      if (response.items && response.items[0]?.major_parts) {
        setStrands(response.items[0].major_parts)
        setCurrentStep(6)
        setSuccess(`Discovered ${response.items[0].major_parts.length} strands!`)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError('Failed to discover strands. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateLessons = async (strand: Strand) => {
    setIsLoading(true)
    setError(null)
    setSelectedStrand(strand)
    try {
      const response = await generateContent({
        type: 'lesson-generation-by-strand',
        subject: selectedSubject?.name || '',
        framework: selectedFramework?.name || '',
        grade: selectedGrade?.name || '',
        region: selectedRegion || undefined,
        strandCode: strand.strand_code,
        strandName: strand.strand_name,
        targetLessonCount: strand.target_lesson_count,
        keyTopics: strand.key_topics,
        performanceExpectations: strand.performance_expectations
      })
      if (response.items) {
        // Tag lessons with strand context for grouping later
        const tagged = response.items.map((it: any) => ({
          ...it,
          strand_code: strand.strand_code,
          strand_name: strand.strand_name
        }))
        // Append to any existing lessons instead of overwriting
        setLessons((prev) => {
          // de-duplicate by strand_code + title/name to avoid duplicates
          const existingKeys = new Set(prev.map((l: any) => `${l.strand_code}__${l.title || l.name}`))
          const deduped = tagged.filter((l: any) => !existingKeys.has(`${l.strand_code}__${l.title || l.name}`))
          return [...prev, ...deduped]
        })
        setCurrentStep(6)
        setSuccess(`Generated ${response.items.length} lessons!`)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError('Failed to generate lessons. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Multi-select (Step 6) helpers
  const toggleStrandSelection = (strand: Strand) => {
    setSelectedStrands((prev) => {
      const exists = prev.some(s => s.strand_code === strand.strand_code)
      return exists ? prev.filter(s => s.strand_code !== strand.strand_code) : [...prev, strand]
    })
  }

  const toggleSelectAllStrands = () => {
    if (selectedStrands.length === strands.length) {
      setSelectedStrands([])
    } else {
      setSelectedStrands(strands)
    }
  }

  const handleGenerateLessonsForSelected = async () => {
    if (selectedStrands.length === 0) return
    setIsLoading(true)
    setError(null)
    setSelectedStrand(selectedStrands[0] || null)
    const allLessons: any[] = []
    const failed: { code: string, name: string }[] = []
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
    try {
      for (const strand of selectedStrands) {
        // up to 2 retries per strand, with brief backoff to avoid rate limits
        let attempt = 0
        let successForStrand = false
        while (attempt < 2 && !successForStrand) {
          try {
            const response = await generateContent({
              type: 'lesson-generation-by-strand',
              subject: selectedSubject?.name || '',
              framework: selectedFramework?.name || '',
              grade: selectedGrade?.name || '',
              region: selectedRegion || undefined,
              strandCode: strand.strand_code,
              strandName: strand.strand_name,
              targetLessonCount: strand.target_lesson_count,
              keyTopics: strand.key_topics,
              performanceExpectations: strand.performance_expectations
            })
            if (response.items && Array.isArray(response.items)) {
              const tagged = response.items.map((it: any) => ({
                ...it,
                strand_code: strand.strand_code,
                strand_name: strand.strand_name
              }))
              allLessons.push(...tagged)
              // also update incrementally so user sees progress
              setLessons((prev: any[]) => {
                const existingKeys = new Set(prev.map((l: any) => `${l.strand_code}__${l.title || l.name}`))
                const deduped = tagged.filter((l: any) => !existingKeys.has(`${l.strand_code}__${l.title || l.name}`))
                return [...prev, ...deduped]
              })
              successForStrand = true
            } else {
              throw new Error('No items returned')
            }
          } catch (e) {
            attempt += 1
            if (attempt >= 2) {
              failed.push({ code: strand.strand_code, name: strand.strand_name })
            } else {
              // brief pause before retry
              await sleep(600)
            }
          }
        }
        // slight delay between strands to reduce provider rate limiting
        await sleep(400)
      }
      if (allLessons.length > 0) {
        // final normalize to ensure state has all accumulated lessons
        setLessons((prev: any[]) => {
          const existingKeys = new Set(prev.map((l: any) => `${l.strand_code}__${l.title || l.name}`))
          const newKeys = new Set(allLessons.map((l: any) => `${l.strand_code}__${l.title || l.name}`))
          const missing = allLessons.filter((l: any) => !existingKeys.has(`${l.strand_code}__${l.title || l.name}`))
        
          // If prev already contains all, just return prev; else append missing
          if (missing.length === 0 && newKeys.size > 0) return prev
          return [...prev, ...missing]
        })
        setCurrentStep(6)
        if (failed.length > 0) {
          setSuccess(`Generated ${allLessons.length} lessons. ${failed.length} strand(s) failed.`)
        } else {
          setSuccess(`Generated ${allLessons.length} lessons across ${selectedStrands.length} strands!`)
        }
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError('No lessons were generated. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Selection handlers
  const handleSelectSubject = (subject: Item) => {
    setSelectedSubject(subject)
    setCurrentStep(2)
    setStateCurricula([])
    setFrameworks([])
    setGrades([])
    setStrands([])
    setLessons([])
  setSelectedStateCurriculum(null)
    setSelectedFramework(null)
    setSelectedGrade(null)
  }

  const handleSelectStateCurriculum = (curriculum: any) => {
    setSelectedStateCurriculum(curriculum)
    setCurrentStep(3)
    setGrades([])
    setFrameworks([])
    setStrands([])
    setLessons([])
    setSelectedGrade(null)
    setSelectedGrades([])
    setSelectedFramework(null)
  }

  const handleRefreshStateCurricula = async () => {
    if (!selectedCountry || !selectedSubject) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await generateContent({
        type: 'state-curricula',
        country: selectedCountry,
        subject: selectedSubject.name,
        context: context || ''
      })
      if (response.items) {
        setStateCurricula(response.items)
        setSuccess(`State curricula refreshed!`)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError('Failed to refresh state curricula. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Lazy-generate state-specific standard for selected subject
  const handleViewStateStandard = async (regionName: string, curriculum?: any) => {
    if (!selectedCountry || !selectedSubject) return
    const cacheKey = `${selectedCountry}__${selectedSubject.name}__${regionName}`
    const cached = stateStandardCache[cacheKey]
    if (cached) {
      setStateStandardDetails(cached)
      setShowStateStandardModal(true)
      if (curriculum) {
        setPendingStateContext({ region: regionName, curriculum })
        setHighlightedRegion(regionName)
        setHighlightedCurriculumName(curriculum.curriculum_name || null)
        // Immediately reflect selection in the bottom summary using cached details
        setSelectedRegion(regionName)
        setSelectedStateCurriculum(curriculum)
        setSelectedStateStandardDetails(cached)
        // Clear downstream to avoid stale data
        setFrameworks([])
        setGrades([])
        setStrands([])
        setLessons([])
        setSelectedFramework(null)
        setSelectedGrade(null)
        setSelectedGrades([])
      }
      return
    }
    setLoadingStateStandard(regionName)
    // Optimistically set region/curriculum so the summary updates immediately
    if (curriculum) {
      setSelectedRegion(regionName)
      setSelectedStateCurriculum(curriculum)
      setSelectedStateStandardDetails(null)
      // Clear downstream to avoid stale data when changing state
      setFrameworks([])
      setGrades([])
      setStrands([])
      setLessons([])
      setSelectedFramework(null)
      setSelectedGrade(null)
      setSelectedGrades([])
    }
    try {
      const response = await generateContent({
        type: 'state-standard',
        country: selectedCountry,
        subject: selectedSubject.name,
        region: regionName,
      } as any)
      if (response.items && response.items[0]) {
        const details = response.items[0]
        setStateStandardDetails(details)
        setShowStateStandardModal(true)
        if (curriculum) {
          setPendingStateContext({ region: regionName, curriculum })
          setHighlightedRegion(regionName)
          setHighlightedCurriculumName(curriculum.curriculum_name || null)
          // Update selected standard details once fetched
          setSelectedStateStandardDetails(details)
        }
        setStateStandardCache((prev) => ({ ...prev, [cacheKey]: details }))
      } else {
        setError('No standard details found for this region.')
      }
    } catch (e) {
      setError('Failed to load state standard details. Please try again.')
    } finally {
      setLoadingStateStandard(null)
    }
  }

  const handleSelectFramework = (framework: Item) => {
    setSelectedFramework(framework)
    setCurrentStep(4)
    setStrands([])
    setLessons([])
    setCurriculumSections([])
    setSelectedCurriculumSection(null)
  }

  const handleGenerateCurriculumSections = async () => {
    if (!selectedFramework || !selectedSubject || !selectedGrade) return
    
    // Don't reload if already have data
    if (curriculumSections.length > 0) return
    
    setIsLoading(true)
    setError(null)
    try {
      const response = await generateContent({
        type: 'frameworks',
        country: selectedCountry || undefined,
        subject: selectedSubject.name,
        framework: selectedFramework.name,
        grade: selectedGrade.name,
        region: selectedRegion || undefined,
        context: context
      })
      if (response.items) {
        setCurriculumSections(response.items)
        // reset any previous sub-standards when regenerating sections
        setSubStandardsBySection({})
        setSuccess(`Generated ${response.items.length} curriculum sections!`)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError('Failed to generate curriculum sections. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 5: Generate sub-standards for a given section
  const handleGenerateSubStandards = async (section: any) => {
    if (!selectedSubject || !selectedFramework || !selectedGrade) return
    const key = String(section.id || section.name || section.title || '')
    if (!key) return
    setLoadingSectionKey(key)
    setError(null)
    try {
      const response = await generateContent({
        type: 'section-standards',
        country: selectedCountry || undefined,
        subject: selectedSubject.name,
        framework: selectedFramework.name,
        grade: selectedGrade.name,
        region: selectedRegion || undefined,
        stateCurriculum: selectedStateCurriculum?.curriculum_name,
        section: section.title || section.name,
        context
      })
      if (Array.isArray(response.items)) {
        setSubStandardsBySection((prev) => ({ ...prev, [key]: response.items }))
        // Do not auto-set default lesson amounts; require user input
        setSuccess(`Generated ${response.items.length} sub-standards for "${section.title || section.name}"`)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError('Failed to generate sub-standards for this section. Please try again.')
    } finally {
      setLoadingSectionKey(null)
    }
  }

  // Step 5: Generate sub-standards for all curriculum sections (bulk)
  const handleGenerateSubStandardsForAll = async () => {
    if (!selectedSubject || !selectedFramework || !selectedGrade) return
    if (curriculumSections.length === 0) {
      setError('No curriculum sections available. Generate sections first.')
      return
    }
    setError(null)
    const loadingKeys = new Set(curriculumSections.map(s => String(s.id || s.name || s.title || '')).filter(Boolean))
    setBulkLoadingSectionKeys(loadingKeys)
    let successCount = 0
    for (const section of curriculumSections) {
      const key = String(section.id || section.name || section.title || '')
      if (!key) continue
      try {
        const response = await generateContent({
          type: 'section-standards',
          country: selectedCountry || undefined,
          subject: selectedSubject.name,
          framework: selectedFramework.name,
          grade: selectedGrade.name,
          region: selectedRegion || undefined,
          stateCurriculum: selectedStateCurriculum?.curriculum_name,
          section: section.title || section.name,
          context
        })
        if (Array.isArray(response.items)) {
          setSubStandardsBySection((prev) => ({ ...prev, [key]: response.items }))
          successCount += 1
        }
      } catch (err) {
        // Continue to next section on error
        console.error(`Failed to generate sub-standards for section "${section.title || section.name}":`, err)
      }
    }
    setBulkLoadingSectionKeys(new Set())
    if (successCount > 0) {
      setSuccess(`Generated sub-standards for ${successCount} section${successCount !== 1 ? 's' : ''}.`)
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError('Failed to generate sub-standards for all sections. Please try again.')
    }
  }

  // Step 5: Generate sub-standards for selected curriculum sections (bulk)
  const handleGenerateSubStandardsForSelected = async () => {
    if (!selectedSubject || !selectedFramework || !selectedGrade) return
    if (selectedCurriculumSections.length === 0) {
      setError('Please select at least one section to generate sub-standards for.')
      return
    }
    setError(null)
    const loadingKeys = new Set(selectedCurriculumSections.map(s => String(s.id || s.name || s.title || '')).filter(Boolean))
    setBulkLoadingSectionKeys(loadingKeys)
    let successCount = 0
    for (const section of selectedCurriculumSections) {
      const key = String(section.id || section.name || section.title || '')
      if (!key) continue
      try {
        const response = await generateContent({
          type: 'section-standards',
          country: selectedCountry || undefined,
          subject: selectedSubject.name,
          framework: selectedFramework.name,
          grade: selectedGrade.name,
          region: selectedRegion || undefined,
          stateCurriculum: selectedStateCurriculum?.curriculum_name,
          section: section.title || section.name,
          context
        })
        if (Array.isArray(response.items)) {
          setSubStandardsBySection((prev) => ({ ...prev, [key]: response.items }))
          successCount += 1
        }
      } catch (err) {
        // Continue to next section on error
        console.error(`Failed to generate sub-standards for section "${section.title || section.name}":`, err)
      }
    }
    setBulkLoadingSectionKeys(new Set())
    if (successCount > 0) {
      setSuccess(`Generated sub-standards for ${successCount} selected section${successCount !== 1 ? 's' : ''}.`)
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError('Failed to generate sub-standards for selected sections. Please try again.')
    }
  }

  // Step 5: Generate lessons based on generated sub-standards for a section
  // Distributes total lessons across all sub-standards
  const handleGenerateLessonsFromSubStandards = async (section: any) => {
    if (!selectedSubject || !selectedFramework || !selectedGrade) return
    const key = String(section.id || section.name || section.title || '')
    const subStandards = subStandardsBySection[key] || []
    if (!Array.isArray(subStandards) || subStandards.length === 0) {
      setError('Please generate sub-standards for this section first.')
      return
    }
    const totalLessons = lessonsPerSubStandardBySection[key]
    if (!Number.isFinite(totalLessons as any) || (totalLessons as any) <= 0) {
      setError('Please set total lessons to generate for this section before generating.')
      return
    }

    setIsLoading(true)
    setLoadingLessonsSectionKey(key)
    // Clear prior completed state for this section
    setCompletedLessonsBySection((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setError(null)
    try {
      // Distribute lessons across sub-standards: each gets at least 1, extras distributed evenly
      const numSubStandards = subStandards.length
      const basePerStandard = Math.floor(totalLessons / numSubStandards)
      const remainder = totalLessons % numSubStandards
      const lessonsPerStandard = basePerStandard + (remainder > 0 ? 1 : 0) // Each gets base + extras if any

      const response = await generateContent({
        type: 'lessons-by-substandards' as any,
        country: selectedCountry || undefined,
        subject: selectedSubject.name,
        framework: selectedFramework.name,
        grade: selectedGrade.name,
        region: selectedRegion || undefined,
        stateCurriculum: selectedStateCurriculum?.curriculum_name,
        section: section.title || section.name,
        subStandards,
        lessonsPerStandard: lessonsPerStandard,
        context
      } as any)
      if (Array.isArray(response.items)) {
        // Save lessons under this section only (do not push to Step 6 lists)
        setLessonsBySection((prev) => ({ ...prev, [key]: response.items }))
        // Mark success for a short duration
        setCompletedLessonsBySection((prev) => ({ ...prev, [key]: Date.now() }))
        setTimeout(() => {
          setCompletedLessonsBySection((prev2) => {
            const copy = { ...prev2 }
            delete copy[key]
            return copy
          })
        }, 2500)
        setSuccess(`Generated ${response.items.length} lessons for "${section.title || section.name}" from sub-standards.`)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      const errMsg = String((err as any)?.message || err || 'Failed to generate lessons')
      if (errMsg.includes('Insufficient tokens') || errMsg.includes('402')) {
        setPaymentErrorMessage('Insufficient tokens. Please buy more credits to continue.')
        setShowPaymentModal(true)
      } else {
        setError('Failed to generate lessons from sub-standards. Please try again.')
      }
    } finally {
      setIsLoading(false)
      setLoadingLessonsSectionKey(null)
    }
  }

  // Step 5: Generate lessons for all curriculum sections (bulk)
  const handleGenerateLessonsFromSubStandardsForAll = async () => {
    if (!selectedSubject || !selectedFramework || !selectedGrade) return
    if (curriculumSections.length === 0) {
      setError('No curriculum sections available.')
      return
    }
    if (!Number.isFinite(bulkLessonsAmount) || bulkLessonsAmount <= 0) {
      setError('Please set the number of lessons to generate.')
      return
    }
    setError(null)
    const loadingKeys = new Set(curriculumSections.map(s => String(s.id || s.name || s.title || '')).filter(Boolean))
    setBulkLoadingLessonsSectionKeys(loadingKeys)
    let successCount = 0
    for (const section of curriculumSections) {
      const key = String(section.id || section.name || section.title || '')
      if (!key) continue
      const subStandards = subStandardsBySection[key] || []
      if (!Array.isArray(subStandards) || subStandards.length === 0) continue
      try {
        const numSubStandards = subStandards.length
        const basePerStandard = Math.floor(bulkLessonsAmount / numSubStandards)
        const remainder = bulkLessonsAmount % numSubStandards
        const lessonsPerStandard = basePerStandard + (remainder > 0 ? 1 : 0)
        const response = await generateContent({
          type: 'lessons-by-substandards' as any,
          country: selectedCountry || undefined,
          subject: selectedSubject.name,
          framework: selectedFramework.name,
          grade: selectedGrade.name,
          region: selectedRegion || undefined,
          stateCurriculum: selectedStateCurriculum?.curriculum_name,
          section: section.title || section.name,
          subStandards,
          lessonsPerStandard: lessonsPerStandard,
          context
        } as any)
        if (Array.isArray(response.items)) {
          setLessonsBySection((prev) => ({ ...prev, [key]: response.items }))
          successCount += 1
        }
      } catch (err) {
        console.error(`Failed to generate lessons for section "${section.title || section.name}":`, err)
      }
    }
    setBulkLoadingLessonsSectionKeys(new Set())
    if (successCount > 0) {
      setSuccess(`Generated lessons for ${successCount} section${successCount !== 1 ? 's' : ''}.`)
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError('Failed to generate lessons for all sections. Please try again.')
    }
  }

  // Step 5: Generate lessons for selected curriculum sections (bulk)
  const handleGenerateLessonsFromSubStandardsForSelected = async () => {
    if (!selectedSubject || !selectedFramework || !selectedGrade) return
    if (selectedCurriculumSections.length === 0) {
      setError('Please select at least one section to generate lessons for.')
      return
    }
    if (!Number.isFinite(bulkLessonsAmount) || bulkLessonsAmount <= 0) {
      setError('Please set the number of lessons to generate.')
      return
    }
    setError(null)
    const loadingKeys = new Set(selectedCurriculumSections.map(s => String(s.id || s.name || s.title || '')).filter(Boolean))
    setBulkLoadingLessonsSectionKeys(loadingKeys)
    let successCount = 0
    for (const section of selectedCurriculumSections) {
      const key = String(section.id || section.name || section.title || '')
      if (!key) continue
      const subStandards = subStandardsBySection[key] || []
      if (!Array.isArray(subStandards) || subStandards.length === 0) continue
      try {
        const numSubStandards = subStandards.length
        const basePerStandard = Math.floor(bulkLessonsAmount / numSubStandards)
        const remainder = bulkLessonsAmount % numSubStandards
        const lessonsPerStandard = basePerStandard + (remainder > 0 ? 1 : 0)
        const response = await generateContent({
          type: 'lessons-by-substandards' as any,
          country: selectedCountry || undefined,
          subject: selectedSubject.name,
          framework: selectedFramework.name,
          grade: selectedGrade.name,
          region: selectedRegion || undefined,
          stateCurriculum: selectedStateCurriculum?.curriculum_name,
          section: section.title || section.name,
          subStandards,
          lessonsPerStandard: lessonsPerStandard,
          context
        } as any)
        if (Array.isArray(response.items)) {
          setLessonsBySection((prev) => ({ ...prev, [key]: response.items }))
          successCount += 1
        }
      } catch (err) {
        console.error(`Failed to generate lessons for section "${section.title || section.name}":`, err)
      }
    }
    setBulkLoadingLessonsSectionKeys(new Set())
    if (successCount > 0) {
      setSuccess(`Generated lessons for ${successCount} selected section${successCount !== 1 ? 's' : ''}.`)
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError('Failed to generate lessons for selected sections. Please try again.')
    }
  }

  // Step 5: Generate lessons for a single sub-standard within a section
  const handleGenerateLessonsForSingleSubStandard = async (section: any, subStandard: any, idx: number) => {
    // Check session first
    if (!(await ensureValidSession())) {
      return
    }

    if (!selectedSubject || !selectedFramework || !selectedGrade) return
    const secKey = String(section.id || section.name || section.title || '')
    const subKey = String(subStandard.code || `S${idx + 1}`)
    const composite = `${secKey}__${subKey}`
    const subStandards = subStandardsBySection[secKey] || []
    if (!Array.isArray(subStandards) || subStandards.length === 0) return

    const per = lessonsPerSingleSub[composite]
    if (!Number.isFinite(per as any) || (per as any) <= 0) {
      setError('Please set a lesson amount for this sub-standard before generating.')
      return
    }

    setIsLoading(true)
    setLoadingSingleLessonsKey(composite)
    // Clear prior completed state for this row
    setCompletedSingleLessons((prev) => {
      const next = { ...prev }
      delete next[composite]
      return next
    })
    setError(null)
    try {
      const response = await generateContent({
        type: 'lessons-by-substandards' as any,
        country: selectedCountry || undefined,
        subject: selectedSubject.name,
        framework: selectedFramework.name,
        grade: selectedGrade.name,
        region: selectedRegion || undefined,
        stateCurriculum: selectedStateCurriculum?.curriculum_name,
        section: section.title || section.name,
        subStandards: [subStandard],
        lessonsPerStandard: Math.max(1, per),
        context
      } as any)
      if (Array.isArray(response.items)) {
        setLessonsBySection((prev) => {
          const existing = prev[secKey] || []
          // de-duplicate by title/name within this section
          const existingKeys = new Set(existing.map((l: any) => (l.title || l.name || '').toLowerCase()))
          const toAdd = response.items.filter((l: any) => !existingKeys.has(String(l.title || l.name || '').toLowerCase()))
          return { ...prev, [secKey]: [...existing, ...toAdd] }
        })
        // Mark row success briefly
        setCompletedSingleLessons((prev) => ({ ...prev, [composite]: Date.now() }))
        setTimeout(() => {
          setCompletedSingleLessons((prev2) => {
            const copy = { ...prev2 }
            delete copy[composite]
            return copy
          })
        }, 2500)
        setSuccess(`Generated ${response.items.length} lesson(s) for ${subStandard.code || subStandard.name || subStandard.title}`)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      const errMsg = String((err as any)?.message || err || 'Failed to generate lessons')
      if (errMsg.includes('Insufficient tokens') || errMsg.includes('402')) {
        setPaymentErrorMessage('Insufficient tokens. Please buy more credits to continue.')
        setShowPaymentModal(true)
      } else {
        setError('Failed to generate lessons for this sub-standard. Please try again.')
      }
    } finally {
      setIsLoading(false)
      setLoadingSingleLessonsKey(null)
    }
  }

  // Toggle selection for a single sub-standard within a section
  const toggleSubStandardSelection = (section: any, subStandard: any, idx: number) => {
    const secKey = String(section.id || section.name || section.title || '')
    const subKey = String(subStandard.code || `S${idx + 1}`)
    const composite = `${secKey}__${subKey}`
    setSelectedSubStandardsBySection((prev) => {
      const current = { ...(prev[secKey] || {}) }
      current[composite] = !current[composite]
      return { ...prev, [secKey]: current }
    })
  }

  const toggleSelectAllSubStandards = (section: any) => {
    const secKey = String(section.id || section.name || section.title || '')
    const subs: any[] = subStandardsBySection[secKey] || []
    const allSelected = Object.values(selectedSubStandardsBySection[secKey] || {}).filter(Boolean).length === subs.length && subs.length > 0
    setSelectedSubStandardsBySection((prev) => {
      const nextMap: Record<string, boolean> = {}
      if (!allSelected) {
        subs.forEach((ss: any, idx: number) => {
          const subKey = String(ss.code || `S${idx + 1}`)
          const composite = `${secKey}__${subKey}`
          nextMap[composite] = true
        })
      }
      return { ...prev, [secKey]: nextMap }
    })
  }

  // Generate lessons for multiple selected sub-standards (per-row counts)
  const handleGenerateLessonsForSelectedSubStandards = async (section: any) => {
    // Check session first
    if (!(await ensureValidSession())) {
      return
    }

    const secKey = String(section.id || section.name || section.title || '')
    const subs: any[] = subStandardsBySection[secKey] || []
    const selectedMap = selectedSubStandardsBySection[secKey] || {}
    const selectedList = subs
      .map((ss, idx) => ({ ss, idx, code: String(ss.code || `S${idx + 1}`), composite: `${secKey}__${String(ss.code || `S${idx + 1}`)}` }))
      .filter(({ composite }) => !!selectedMap[composite])

    if (selectedList.length === 0) {
      setError('Please select at least one sub-standard.')
      return
    }

    // Validate counts present for each selected sub-standard
    for (const item of selectedList) {
      const per = lessonsPerSingleSub[item.composite]
      if (!Number.isFinite(per as any) || (per as any) <= 0) {
        setError(`Please set a lesson amount for sub-standard ${item.code} before generating.`)
        return
      }
    }

    setIsLoading(true)
    setLoadingSelectedLessonsSecKey(secKey)
    // Clear prior completed state for this section batch
    setCompletedSelectedLessonsBySection((prev) => {
      const next = { ...prev }
      delete next[secKey]
      return next
    })
    setError(null)
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    let total = 0
    for (const item of selectedList) {
      try {
        const per = Math.max(1, Number(lessonsPerSingleSub[item.composite]))
        const response = await generateContent({
          type: 'lessons-by-substandards' as any,
          country: selectedCountry || undefined,
          subject: selectedSubject?.name || '',
          framework: selectedFramework?.name || '',
          grade: selectedGrade?.name || '',
          region: selectedRegion || undefined,
          stateCurriculum: selectedStateCurriculum?.curriculum_name,
          section: section.title || section.name,
          subStandards: [item.ss],
          lessonsPerStandard: per,
          context
        } as any)
        if (Array.isArray(response.items)) {
          total += response.items.length
          setLessonsBySection((prev) => {
            const existing = prev[secKey] || []
            const existingKeys = new Set(existing.map((l: any) => (l.title || l.name || '').toLowerCase()))
            const toAdd = response.items.filter((l: any) => !existingKeys.has(String(l.title || l.name || '').toLowerCase()))
            return { ...prev, [secKey]: [...existing, ...toAdd] }
          })
        }
      } catch (e) {
        // Check for payment/token errors and report them
        const errMsg = String((e as any)?.message || e || '')
        if (errMsg.includes('Insufficient tokens') || errMsg.includes('402')) {
          setPaymentErrorMessage('Insufficient tokens. Please buy more credits to continue.')
          setShowPaymentModal(true)
          setIsLoading(false)
          setLoadingSelectedLessonsSecKey(null)
          return
        }
        // Otherwise continue with other items; optionally collect failures
      }
      await sleep(200)
    }
    if (total > 0) {
      setSuccess(`Generated ${total} lesson(s) for ${selectedList.length} sub-standard(s).`)
      setTimeout(() => setSuccess(null), 3000)
      // Flash success on the batch button
      setCompletedSelectedLessonsBySection((prev) => ({ ...prev, [secKey]: Date.now() }))
      setTimeout(() => {
        setCompletedSelectedLessonsBySection((prev2) => {
          const copy = { ...prev2 }
          delete copy[secKey]
          return copy
        })
      }, 2500)
    }
    setIsLoading(false)
    setLoadingSelectedLessonsSecKey(null)
  }

  // Smoothly scroll viewport to Step 6 after selection
  const scrollToStep6 = () => {
    if (typeof window !== 'undefined') {
      const el = document.getElementById('step-6')
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
      }
    }
  }

  // Smoothly scroll to the Selected State summary within Step 2
  const scrollToSelectedState = () => {
    if (typeof window !== 'undefined') {
      const el = document.getElementById('selected-state-summary')
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
      }
    }
  }

  // Smoothly scroll to the Selected Custom Curriculum summary within Step 2
  const scrollToSelectedCustom = () => {
    if (typeof window !== 'undefined') {
      const el = document.getElementById('selected-custom-summary')
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
      }
    }
  }

  // Scroll to curricula grid for re-selection
  const scrollToCurriculaGrid = () => {
    if (typeof window !== 'undefined') {
      const el = document.getElementById('state-curricula-grid')
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
      }
    }
  }

  const handleSelectCurriculumSection = (section: any) => {
    // Used to expand/collapse details for a single section
    const same = (selectedCurriculumSection?.id && section.id && selectedCurriculumSection.id === section.id) ||
      ((selectedCurriculumSection?.name || selectedCurriculumSection?.title) && (section.name || section.title) &&
        (selectedCurriculumSection?.name || selectedCurriculumSection?.title) === (section.name || section.title))
    setSelectedCurriculumSection(same ? null : section)
  }

  const toggleSectionSelection = (section: any) => {
    setSelectedCurriculumSections((prev) => {
      const exists = prev.some((s) =>
        (s.id && section.id && s.id === section.id) ||
        ((s.name || s.title) && (section.name || section.title) && (s.name || s.title) === (section.name || section.title))
      )
      if (exists) {
        return prev.filter((s) => !(
          (s.id && section.id && s.id === section.id) ||
          ((s.name || s.title) && (section.name || section.title) && (s.name || s.title) === (section.name || section.title))
        ))
      }
      return [...prev, section]
    })
  }

  const proceedToStep6 = () => {
    if (selectedCurriculumSections.length > 0) {
      setCurrentStep(5)
      scrollToStep6()
    }
  }

  const handleSelectGrade = (grade: Item) => {
    setSelectedGrade(grade)
    setSelectedGrades([grade])
    setCurrentStep(5)
    setStrands([])
    setLessons([])
    setCurriculumSections([])
    setSelectedCurriculumSection(null)
  }

  // Step 3: Select-all helpers – select all grades in the category and advance to Step 4
  const selectAllCategory = (key: 'elementary' | 'middle_school' | 'high_school') => {
    const group = gradeCategories[key]
    if (group && Array.isArray(group.grades) && group.grades.length > 0) {
      // Select all in this category for visual highlight and choose the first as the active grade for downstream steps
      const first = group.grades[0]
      setSelectedGrades(group.grades.slice())
      setSelectedGrade(first)
      // Clear downstream state and move to Step 4 (Standards & Units)
      setFrameworks([])
      setSelectedFramework(null)
      setCurriculumSections([])
      setSelectedCurriculumSection(null)
      setStrands([])
      setLessons([])
      setCurrentStep(4)
      setSuccess(`Selected all grades in ${group.label}. Proceeding to Step 4.`)
      setTimeout(() => setSuccess(null), 2000)
    }
  }

  const handleReset = () => {
    setCurrentStep(0)
    setSelectedCountry(null)
    setSubjects([])
    setStateCurricula([])
    setFrameworks([])

    setGrades([])
    setStrands([])
    setLessons([])
    setSelectedSubject(null)
    setSelectedStateCurriculum(null)

    setSelectedFramework(null)
  setSelectedGrade(null)
  setSelectedGrades([])
    setSelectedStrand(null)
    setContext('')
    setError(null)
    setSuccess(null)
    setRequestedSubjectsCount('10')
  }

  return (
    <ProtectedRoute>
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-4 sm:p-6 md:p-8 mb-8 text-white">
          <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-6">
            Create curriculum-aligned lessons powered by AI. Generate complete lesson plans in minutes!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button 
            variant="purple"
            onClick={handleReset}
          >
            Start Over
          </Button>
          <Button
            variant="purple"
            onClick={() => { window.location.href = '/quick-lessons' }}
          >
            ⚡ Quick Lesson Generator
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {/* Progress Indicator */}
      <ProgressIndicator steps={steps} />

      {/* Step 0: Select Country */}
      {currentStep === 0 && !selectedCountry && (
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🌍 Select a Country</h2>
            <p className="text-gray-600">Choose a country to customize the curriculum standards.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {countries.map((country) => (
              <Card
                key={country.name}
                onClick={async () => {
                  setSelectedCountry(country.name)
                  setCurrentStep(1)
                  setRequestedSubjectsCount('10')
                }}
                hoverable
              >
                <h3 className="font-bold text-lg text-gray-900 mb-2">{country.name}</h3>
                <p className="text-gray-600 text-sm">{country.description}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Optional control: Subject count before Step 1 */}
      {currentStep >= 1 && selectedCountry && (
        <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="w-full sm:w-48">
              <Input
                type="number"
                label="Number of subjects (optional)"
                value={requestedSubjectsCount}
                onChange={(e) => setRequestedSubjectsCount(e.target.value)}
                placeholder="e.g., 15"
                min="1"
                max="50"
              />
            </div>
            <div>
              <Button onClick={() => handleGenerateSubjects()} isLoading={isLoading}>
                Generate {requestedSubjectsCount ? `${requestedSubjectsCount} ` : ''}Subjects
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Subjects */}
      {currentStep >= 1 && selectedCountry && (
        <SelectionStep
          title="📚 Step 1: Select a Subject"
          description="Choose an educational subject to start building your curriculum."
          items={subjects}
          selectedItem={selectedSubject}
          onSelect={handleSelectSubject}
          isLoading={isLoading}
          generateButtonText="Generate Subjects"
          emptyStateText="No subjects available. Please select a different country."
        />
      )}

      {/* Export Subjects Button */}
      {currentStep >= 1 && subjects.length > 0 && (
        <div className="mb-8 flex justify-end">
          <ExportButton
            onClick={() => downloadLessonsAsExcel(
              subjects.map(s => ({ name: s.name, description: s.description, title: s.name })),
              undefined,
              undefined,
              undefined
            )}
            variant="success"
            size="sm"
          />
        </div>
      )}

      {/* Step 2: State/Provincial Curriculum */}
      {currentStep >= 2 && selectedSubject && (
        <div className="mb-8">
          {/* Important Guidance Section */}
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-6 mb-6">
            <div className="flex gap-3">
              <div className="text-3xl pt-1">📋</div>
              <div>
                <h3 className="text-lg font-bold text-amber-900 mb-2">Before Proceeding to Step 2</h3>
                <div className="text-sm text-amber-800 space-y-2">
                  <p><strong>✅ Please ensure you have completed the following:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Reviewed Step 1: Country and Subject selection</li>
                    <li>Selected your relevant country and subject</li>
                    <li>Familiarized yourself with the curriculum framework</li>
                  </ul>
                  <p className="pt-2"><strong>🌐 Reference Materials:</strong></p>
                  <p>Before selecting your state/provincial curriculum, we recommend referring to the following official resources:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Your state/provincial education board official website</li>
                    <li>Government curriculum standards documentation</li>
                    <li>Ministry of Education guidelines</li>
                    <li>Official curriculum frameworks and learning standards</li>
                  </ul>
                  <p className="pt-2 italic">This will help ensure alignment with official standards and requirements.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">🗺️ Step 2: Select State/Provincial Curriculum</h2>
                <p className="text-gray-600 mb-4">Choose the state curriculum standards you want to follow, or create a custom grouping.</p>
              </div>
              <div className="pt-1">
                <Button variant="outline" size="sm" className="border-black text-black hover:bg-gray-50" onClick={() => setShowCustomGroupModal(true)}>
                  + Create Custom Curriculum
                </Button>
              </div>
            </div>
            
            {/* Selected State Summary moved to bottom of Step 2 */}

            {/* Context Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-semibold text-blue-900 uppercase">Country</p>
                  <p className="text-sm text-blue-800">{selectedCountry}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-900 uppercase">Subject</p>
                  <p className="text-sm text-blue-800">{selectedSubject.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-900 uppercase">Curricula</p>
                  <p className="text-sm text-blue-800">{stateCurricula.length} available</p>
                </div>
              </div>
            </div>
          </div>
          {isLoading && stateCurricula.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin">⌛</div>
              <p className="text-gray-600 mt-2">Loading state curricula...</p>
            </div>
          ) : stateCurricula.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No state curricula found.</p>
              <Button onClick={handleGenerateStateCurricula} variant="primary">
                Load State Curricula
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-gray-600">{stateCurricula.length} curricula available</p>
                <Button 
                  onClick={handleRefreshStateCurricula} 
                  variant="outline" 
                  size="sm"
                  isLoading={isLoading}
                >
                  🔄 Refresh
                </Button>
              </div>
              <div id="state-curricula-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stateCurricula.map((curriculum, index) => (
                  <Card
                    key={index}
                    onClick={() => handleSelectStateCurriculum(curriculum)}
                    hoverable
                    isSelected={selectedStateCurriculum?.curriculum_name === curriculum.curriculum_name}
                    className={`${highlightedCurriculumName === curriculum.curriculum_name && !selectedStateCurriculum ? 'ring-1 ring-blue-300 border-blue-300' : ''}`}
                  >
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{curriculum.curriculum_name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{curriculum.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const allStates: string[] = curriculum.states || []
                        const isExpanded = !!expandedCurriculaStates[String(index)]
                        const visible = isExpanded ? allStates : allStates.slice(0, 5)
                        return (
                          <>
                            {visible.map((state: string, i: number) => (
                              <button
                                key={i}
                                type="button"
                                title={`View ${state} standard for ${selectedSubject?.name}`}
                                className={`px-2 py-1 text-xs rounded border ${
                                  loadingStateStandard === state
                                    ? 'bg-blue-200 text-blue-900 border-blue-300'
                                    : highlightedRegion === state
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewStateStandard(state, curriculum)
                                }}
                              >
                                {loadingStateStandard === state ? 'Loading…' : state}
                              </button>
                            ))}
                            {allStates.length > 5 && !isExpanded && (
                              <button
                                type="button"
                                className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded hover:bg-gray-200"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedCurriculaStates((prev) => ({ ...prev, [String(index)]: true }))
                                }}
                              >
                                +{allStates.length - 5} more
                              </button>
                            )}
                            {allStates.length > 5 && isExpanded && (
                              <button
                                type="button"
                                className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded hover:bg-gray-200"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedCurriculaStates((prev) => ({ ...prev, [String(index)]: false }))
                                }}
                              >
                                Show less
                              </button>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Selected State Summary (bottom of Step 2) */}
              {selectedRegion && selectedStateCurriculum && (
                <>
                  <div className="flex justify-end mt-6">
                    <Button variant="outline" size="sm" className="border-black text-black hover:bg-gray-50" onClick={() => setShowCustomGroupModal(true)}>
                      + Create Custom Curriculum
                    </Button>
                  </div>
                  <div id="selected-state-summary" className="bg-green-50 border border-green-200 rounded-lg p-4 mt-3">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-green-900">Selected State</h3>
                      <p className="text-sm text-green-800"><span className="font-semibold">Region:</span> {selectedRegion}</p>
                      <p className="text-sm text-green-800">
                        <span className="font-semibold">Curriculum:</span>{' '}
                        {(() => {
                          const name = String(selectedStateCurriculum.curriculum_name || '')
                          const isNoSpecial = name.toLowerCase().includes('no special curriculum')
                          if (isNoSpecial && selectedStateStandardDetails?.standard_name) {
                            return selectedStateStandardDetails.standard_name
                          }
                          return name
                        })()}
                      </p>
                      {selectedStateStandardDetails?.standard_name && (
                        <p className="text-sm text-green-800"><span className="font-semibold">Standard:</span> {selectedStateStandardDetails.standard_name}</p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="primary"
                        className="w-full sm:w-auto"
                        onClick={() => setCurrentStep(3)}
                      >
                        Continue to Step 3
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => scrollToCurriculaGrid()}
                      >
                        Change state
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => {
                          setSelectedRegion(null)
                        setSelectedStateCurriculum(null)
                          setSelectedStateStandardDetails(null)
                          setFrameworks([])
                          setGrades([])
                          setStrands([])
                          setLessons([])
                        }}
                      >
                        Clear selection
                      </Button>
                    </div>
                  </div>
                  {selectedStateStandardDetails?.coverage_description && (
                    <p className="text-sm text-green-900 mt-3">
                      {selectedStateStandardDetails.coverage_description}
                    </p>
                  )}
                  </div>
                </>
              )}

              {/* Selected Custom Curriculum Summary (bottom of Step 2) */}
              {!selectedRegion && selectedStateCurriculum && (
                <div id="selected-custom-summary" className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-6">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-purple-900">Selected Custom Curriculum</h3>
                      <p className="text-sm text-purple-800"><span className="font-semibold">Curriculum:</span> {selectedStateCurriculum.curriculum_name}</p>
                      <p className="text-sm text-purple-800"><span className="font-semibold">States:</span> {Array.isArray(selectedStateCurriculum.states) ? selectedStateCurriculum.states.length : 0}</p>
                      {selectedStateCurriculum.description && (
                        <p className="text-sm text-purple-800"><span className="font-semibold">Description:</span> {selectedStateCurriculum.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="primary"
                        className="w-full sm:w-auto"
                        onClick={() => setCurrentStep(3)}
                      >
                        Continue to Step 3
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => {
                          setSelectedStateCurriculum(null)
                          setFrameworks([])
                          setGrades([])
                          setStrands([])
                          setLessons([])
                        }}
                      >
                        Clear selection
                      </Button>
                    </div>
                  </div>
                  {Array.isArray(selectedStateCurriculum.states) && selectedStateCurriculum.states.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-purple-900 font-semibold mb-1">Included States</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedStateCurriculum.states.slice(0, 12).map((s: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-purple-100 text-purple-900 text-xs rounded">{s}</span>
                        ))}
                        {selectedStateCurriculum.states.length > 12 && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-900 text-xs rounded">+{selectedStateCurriculum.states.length - 12} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Step 3: Grades */}
      {currentStep >= 3 && selectedSubject && selectedStateCurriculum && (
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🎯 Step 3: Select a Grade Level</h2>
            <p className="text-gray-600 mb-4">Choose a grade level for {selectedSubject.name}.</p>
            
            {/* Context Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-semibold text-blue-900 uppercase">Subject</p>
                  <p className="text-sm text-blue-800">{selectedSubject.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-900 uppercase">Curriculum</p>
                  <p className="text-sm text-blue-800">{(() => {
                    const name = String(selectedStateCurriculum?.curriculum_name || '')
                    const isNoSpecial = name.toLowerCase().includes('no special curriculum')
                    if (isNoSpecial && selectedStateStandardDetails?.standard_name) {
                      return selectedStateStandardDetails.standard_name
                    }
                    return name
                  })()}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-900 uppercase">Grades</p>
                  <p className="text-sm text-blue-800">{grades.length} available</p>
                </div>
              </div>
            </div>
          </div>

          {grades.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Click below to generate grade levels for this subject.</p>
              <Button onClick={handleGenerateGrades} isLoading={isLoading} variant="primary">
                Generate Grades
              </Button>
            </div>
          ) : (
            <>
              {/* Categorized rendering if available, else fallback to flat grid */}
              { (gradeCategories?.elementary || gradeCategories?.middle_school || gradeCategories?.high_school) ? (
                <div className="space-y-8">
                  {/* Elementary */}
                  {gradeCategories.elementary && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">{gradeCategories.elementary.label}</h3>
                        <Button variant="outline" size="sm" onClick={() => selectAllCategory('elementary')}>
                          {gradeCategories.select_all_labels?.elementary || 'All Elementary'}
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        {gradeCategories.elementary.grades.map((g, idx) => (
                          <Card key={`el-${idx}`} isSelected={(selectedGrade?.name === g.name) || selectedGrades.some(sg => sg.name === g.name)} onClick={() => handleSelectGrade(g)}>
                            <h4 className="font-bold text-gray-900 mb-2">{g.title || g.name}</h4>
                            <p className="text-gray-600 text-sm line-clamp-3">{g.description}</p>
                          </Card>
                        ))}
                      </div>
                      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                        <Button onClick={handleGenerateFrameworks} isLoading={isLoading} variant="primary">
                          Generate Units & Standards
                        </Button>
                      </div>
                    </div>
                  )}
                  {/* Middle school */}
                  {gradeCategories.middle_school && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">{gradeCategories.middle_school.label}</h3>
                        <Button variant="outline" size="sm" onClick={() => selectAllCategory('middle_school')}>
                          {gradeCategories.select_all_labels?.middle_school || 'All Middle School'}
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        {gradeCategories.middle_school.grades.map((g, idx) => (
                          <Card key={`mid-${idx}`} isSelected={(selectedGrade?.name === g.name) || selectedGrades.some(sg => sg.name === g.name)} onClick={() => handleSelectGrade(g)}>
                            <h4 className="font-bold text-gray-900 mb-2">{g.title || g.name}</h4>
                            <p className="text-gray-600 text-sm line-clamp-3">{g.description}</p>
                          </Card>
                        ))}
                      </div>
                      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                        <Button onClick={handleGenerateFrameworks} isLoading={isLoading} variant="primary">
                          Generate Units & Standards
                        </Button>
                      </div>
                    </div>
                  )}
                  {/* High school */}
                  {gradeCategories.high_school && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">{gradeCategories.high_school.label}</h3>
                        <Button variant="outline" size="sm" onClick={() => selectAllCategory('high_school')}>
                          {gradeCategories.select_all_labels?.high_school || 'All High School'}
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        {gradeCategories.high_school.grades.map((g, idx) => (
                          <Card key={`hi-${idx}`} isSelected={(selectedGrade?.name === g.name) || selectedGrades.some(sg => sg.name === g.name)} onClick={() => handleSelectGrade(g)}>
                            <h4 className="font-bold text-gray-900 mb-2">{g.title || g.name}</h4>
                            <p className="text-gray-600 text-sm line-clamp-3">{g.description}</p>
                          </Card>
                        ))}
                      </div>
                      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                        <Button onClick={handleGenerateFrameworks} isLoading={isLoading} variant="primary">
                          Generate Units & Standards
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {grades.map((grade, index) => (
                    <Card
                      key={grade.id || index}
                      isSelected={(selectedGrade?.name === grade.name) || selectedGrades.some(sg => sg.name === grade.name)}
                      onClick={() => handleSelectGrade(grade)}
                    >
                      <h3 className="font-bold text-lg text-gray-900 mb-2">
                        {grade.title || grade.name}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {grade.description}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Export Grades Button */}
      {currentStep >= 3 && grades.length > 0 && (
        <div className="mb-8 flex justify-end">
          <ExportButton
            onClick={() => downloadLessonsAsExcel(
              grades.map(g => ({ name: g.name, description: g.description, title: g.name })),
              selectedSubject?.name,
              undefined,
              undefined
            )}
            variant="success"
            size="sm"
          />
        </div>
      )}


      {/* Step 4: Browse Standards & Units */}
      {currentStep >= 4 && selectedSubject && selectedStateCurriculum && selectedGrade && (
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-1">📋 Step 4: Browse Standards and Units</h2>
            <p className="text-gray-600 text-sm">Select curriculum units for your lesson plan</p>
            {/* Comprehensive Context Summary for Step 4 - All information from Steps 1-3 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4 space-y-3">
              {/* Step 1: Country & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-blue-900 uppercase">📍 Country (Step 1)</p>
                  <p className="text-sm text-blue-800">{selectedCountry || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-900 uppercase">📚 Subject (Step 1)</p>
                  <p className="text-sm text-blue-800">{selectedSubject?.name}</p>
                </div>
              </div>
              
              {/* Step 2: State/Regional Curriculum Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t border-blue-200 pt-3">
                <div>
                  <p className="text-xs font-semibold text-blue-900 uppercase">🗺️ Region (Step 2)</p>
                  <p className="text-sm text-blue-800">{selectedRegion || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-900 uppercase">📋 Curriculum (Step 2)</p>
                  <p className="text-sm text-blue-800">{(() => {
                    const name = String(selectedStateCurriculum?.curriculum_name || '')
                    const isNoSpecial = name.toLowerCase().includes('no special curriculum')
                    if (isNoSpecial && selectedStateStandardDetails?.standard_name) {
                      return selectedStateStandardDetails.standard_name
                    }
                    return name
                  })()}</p>
                </div>
                {selectedStateStandardDetails?.standard_name && (
                  <div>
                    <p className="text-xs font-semibold text-blue-900 uppercase">📌 Standard (Step 2)</p>
                    <p className="text-sm text-blue-800">{selectedStateStandardDetails.standard_name}</p>
                  </div>
                )}
              </div>
              
              {/* Step 3: Grade(s) Selection */}
              <div className="border-t border-blue-200 pt-3">
                <p className="text-xs font-semibold text-blue-900 uppercase">🎯 Grade{selectedGrades.length > 1 ? 's' : ''} (Step 3)</p>
                <p className="text-sm text-blue-800">{selectedGrades.map(g => g.name).join(', ')}</p>
              </div>
            </div>
          </div>

          {isLoading && frameworks.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin">⌛</div>
              <p className="text-gray-600 mt-2">Loading standards & units...</p>
            </div>
          ) : frameworks.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-600 mb-4">No standards & units available for this selection</p>
              <Button onClick={handleGenerateFrameworks} isLoading={isLoading} variant="primary">
                Generate Units & Standards
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {frameworks.map((framework, index) => (
                  <div 
                    key={framework.id || index} 
                    onClick={() => handleSelectFramework(framework)}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedFramework?.name === framework.name
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 flex-1">
                        {framework.title || framework.name}
                      </h3>
                      {selectedFramework?.name === framework.name && (
                        <span className="text-blue-600 text-xl ml-2">✓</span>
                      )}
                    </div>
                    
                    {framework.id && (
                      <p className="text-xs font-mono text-blue-600 mb-2 bg-blue-100 w-fit px-2 py-1 rounded">
                        {framework.id}
                      </p>
                    )}
                    
                    {framework.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{framework.description}</p>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end mt-6">
                <Button onClick={handleGenerateFrameworks} isLoading={isLoading} variant="outline" size="sm">
                  Generate More Units
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* NEW Step 5: Browse Curriculum Standards Sections */}
      {currentStep >= 4 && selectedFramework && (
        <div id="step-5" className="mb-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-1">📚 Step 5: Browse Curriculum Standards</h2>
            <p className="text-gray-600 text-sm">View and select curriculum standard sections</p>
            {/* Comprehensive Context Summary for Step 5 - All information from Steps 1-4 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4 space-y-3">
              {/* Step 1: Country & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-blue-900 uppercase">📍 Country (Step 1)</p>
                  <p className="text-sm text-blue-800">{selectedCountry || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-900 uppercase">📚 Subject (Step 1)</p>
                  <p className="text-sm text-blue-800">{selectedSubject?.name}</p>
                </div>
              </div>
              
              {/* Step 2: State/Regional Curriculum Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t border-blue-200 pt-3">
                <div>
                  <p className="text-xs font-semibold text-blue-900 uppercase">🗺️ Region (Step 2)</p>
                  <p className="text-sm text-blue-800">{selectedRegion || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-900 uppercase">📋 Curriculum (Step 2)</p>
                  <p className="text-sm text-blue-800">{(() => {
                    const name = String(selectedStateCurriculum?.curriculum_name || '')
                    const isNoSpecial = name.toLowerCase().includes('no special curriculum')
                    if (isNoSpecial && selectedStateStandardDetails?.standard_name) {
                      return selectedStateStandardDetails.standard_name
                    }
                    return name
                  })()}</p>
                </div>
                {selectedStateStandardDetails?.standard_name && (
                  <div>
                    <p className="text-xs font-semibold text-blue-900 uppercase">📌 Standard (Step 2)</p>
                    <p className="text-sm text-blue-800">{selectedStateStandardDetails.standard_name}</p>
                  </div>
                )}
              </div>
              
              {/* Step 3: Grade(s) Selection */}
              <div className="border-t border-blue-200 pt-3">
                <p className="text-xs font-semibold text-blue-900 uppercase">🎯 Grade{selectedGrades.length > 1 ? 's' : ''} (Step 3)</p>
                <p className="text-sm text-blue-800">{selectedGrades.map(g => g.name).join(', ')}</p>
              </div>
              
              {/* Step 4: Standards & Units Framework */}
              <div className="border-t border-blue-200 pt-3">
                <p className="text-xs font-semibold text-blue-900 uppercase">📊 Framework/Units (Step 4)</p>
                <p className="text-sm text-blue-800">{selectedFramework?.name}</p>
              </div>

              {/* Step 5: Export/Open options */}
              <div className="border-t border-blue-200 pt-3 flex items-center justify-between">
                <p className="text-xs text-blue-900">Export or view all generated lessons from Step 5</p>
                {(() => {
                  const totalStep5Lessons = Object.values(lessonsBySection || {}).reduce((sum, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
                  return (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={handleOpenTablesPage}
                        disabled={totalStep5Lessons === 0}
                      >
                        Move Lessons to Tables
                      </Button>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>

          {isLoading && curriculumSections.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin">⌛</div>
              <p className="text-gray-600 mt-2">Loading curriculum standards...</p>
            </div>
          ) : curriculumSections.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-600 mb-4">Generate standards sections to explore curriculum details</p>
              <Button onClick={handleGenerateCurriculumSections} isLoading={isLoading} variant="primary">
                Generate Standards Sections
              </Button>
            </div>
          ) : (
            <>
              {/* Bulk Generation Buttons */}
              <div className="mb-4 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleGenerateSubStandardsForAll}
                  disabled={curriculumSections.length === 0}
                >
                  Generate Sub-standards for All Tables
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleGenerateSubStandardsForSelected}
                  disabled={selectedCurriculumSections.length === 0}
                >
                  Generate Sub-standards for Selected Tables ({selectedCurriculumSections.length})
                </Button>
              </div>

              {/* Bulk Lessons Generation */}
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lessons per table:
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={bulkLessonsAmount || ''}
                      onChange={(e) => setBulkLessonsAmount(parseInt(e.target.value, 10) || 0)}
                      placeholder="Enter number of lessons"
                      className="w-full sm:w-32"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={handleGenerateLessonsFromSubStandardsForAll}
                      disabled={curriculumSections.length === 0 || !bulkLessonsAmount}
                    >
                      Generate Lessons for All Tables
                    </Button>
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={handleGenerateLessonsFromSubStandardsForSelected}
                      disabled={selectedCurriculumSections.length === 0 || !bulkLessonsAmount}
                    >
                      Generate Lessons for Selected ({selectedCurriculumSections.length})
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {curriculumSections.map((section, index) => {
                  const isSelected = selectedCurriculumSections.some((s) =>
                    (s.id && section.id && s.id === section.id) ||
                    ((s.name || s.title) && (section.name || section.title) && (s.name || s.title) === (section.name || section.title))
                  )
                  const secKey = String(section.id || section.name || section.title || '')
                  const isGenSubsLoading = loadingSectionKey === secKey || bulkLoadingSectionKeys.has(secKey)
                  const isSecLessonsLoading = loadingLessonsSectionKey === secKey
                  const isSelectedLessonsLoading = loadingSelectedLessonsSecKey === secKey
                  const isBulkLessonsLoading = bulkLoadingLessonsSectionKeys.has(secKey)
                  const isSecLessonsCompleted = !!completedLessonsBySection[secKey]
                  const isBatchCompleted = !!completedSelectedLessonsBySection[secKey]
                  const anySecLoading = isGenSubsLoading || isSecLessonsLoading || isSelectedLessonsLoading || isBulkLessonsLoading
                  return (
                  <div
                    key={section.id || index}
                    className={`bg-white rounded-lg overflow-hidden transition-all border-2 ${
                      isGenSubsLoading ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg animate-pulse' : (isBulkLessonsLoading ? 'border-purple-500 ring-2 ring-purple-200 shadow-lg animate-pulse' : (isSelected ? 'border-blue-600 ring-2 ring-blue-100 shadow-md' : 'border-transparent hover:border-blue-200'))
                    }`}
                  >
                    {/* Section Header - Clickable */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectCurriculumSection(section)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectCurriculumSection(section) }}
                      className={`w-full p-4 flex items-center justify-between transition-colors ${
                        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-left flex-1">
                        <h3 className="font-semibold text-gray-900">{section.title || section.name}</h3>
                        {section.id && (
                          <p className="text-xs text-blue-600 font-mono mt-1">{section.id}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700" onClick={(e)=> e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={isSelected}
                            onChange={() => toggleSectionSelection(section)}
                          />
                          {isSelected ? 'Selected' : 'Select'}
                        </label>
                        <span className="text-gray-400">
                          {isSelected ? '▼' : '▶'}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Section Content (without header table) */}
              {isSelected && (
                      <div className="border-t border-gray-200 bg-gray-50 p-4">
                        {section.description && (
                          <p className="text-xs text-gray-600 italic mb-3">{section.description}</p>
                        )}
                        {/* Sub-standards generator and list */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-gray-900">Sub-standards</h4>
                            {(isSecLessonsLoading || isSelectedLessonsLoading) && (
                              <span className="ml-2 inline-flex items-center text-xs text-blue-800 bg-blue-100 px-2 py-1 rounded">
                                <svg className="animate-spin mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating lessons…
                              </span>
                            )}
                            <Button
                              size="sm"
                              variant={isGenSubsLoading ? 'outline' : 'outline'}
                              onClick={(e) => { e.stopPropagation(); handleGenerateSubStandards(section) }}
                              isLoading={isGenSubsLoading}
                              className={isGenSubsLoading ? 'animate-pulse ring-2 ring-blue-300' : ''}
                            >
                              Generate
                            </Button>
                          </div>
                          {Array.isArray(subStandardsBySection[String(section.id || section.name || section.title || '')]) && subStandardsBySection[String(section.id || section.name || section.title || '')].length > 0 ? (
                            <>
                            <div className="overflow-x-auto border border-gray-200 rounded">
                              <table className="w-full min-w-[720px] text-sm">
                                <thead>
                                  <tr className="bg-white border-b border-gray-200">
                                    <th className="text-left py-2 px-3 font-bold text-gray-700 w-10">
                                      <input
                                        type="checkbox"
                                        onClick={(e)=> e.stopPropagation()}
                                        onChange={() => toggleSelectAllSubStandards(section)}
                                        checked={(() => {
                                          const secKey = String(section.id || section.name || section.title || '')
                                          const subs: any[] = subStandardsBySection[secKey] || []
                                          const selected = Object.values(selectedSubStandardsBySection[secKey] || {}).filter(Boolean).length
                                          return subs.length > 0 && selected === subs.length
                                        })()}
                                      />
                                    </th>
                                    <th className="text-left py-2 px-3 font-bold text-gray-700 w-40">Standard</th>
                                    <th className="text-left py-2 px-3 font-bold text-gray-700">Title</th>
                                    <th className="text-left py-2 px-3 font-bold text-gray-700 w-72">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {subStandardsBySection[String(section.id || section.name || section.title || '')].map((ss: any, idx: number) => {
                                    const secKey = String(section.id || section.name || section.title || '')
                                    const subKey = String(ss.code || `S${idx + 1}`)
                                    const composite = `${secKey}__${subKey}`
                                    const value = (lessonsPerSingleSub[composite] != null ? lessonsPerSingleSub[composite] : '')
                                    const isSingleCompleted = !!completedSingleLessons[composite]
                                    return (
                                    <tr key={idx} className={`border-b border-gray-100 hover:bg-white ${loadingSingleLessonsKey === composite ? 'animate-pulse bg-yellow-50' : ''}`}>
                                      <td className="py-2 px-3">
                                        <input
                                          type="checkbox"
                                          onClick={(e)=> e.stopPropagation()}
                                          checked={!!(selectedSubStandardsBySection[secKey]?.[composite])}
                                          onChange={() => toggleSubStandardSelection(section, ss, idx)}
                                        />
                                      </td>
                                      <td className="py-2 px-3 font-mono text-blue-600 text-xs">{ss.code || `S${idx + 1}`}</td>
                                      <td className="py-2 px-3 text-gray-700">
                                        <div className="font-medium">{ss.title || ss.name}</div>
                                        {ss.description && (
                                          <div className="text-xs text-gray-500 mt-1">{ss.description}</div>
                                        )}
                                      </td>
                                      <td className="py-2 px-3">
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="number"
                                            min={1}
                                            max={50}
                                            value={String(value)}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => {
                                              const v = parseInt(e.target.value)
                                              setLessonsPerSingleSub((prev) => ({ ...prev, [composite]: Number.isFinite(v) && v > 0 ? v : 1 }))
                                            }}
                                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                            disabled={loadingSingleLessonsKey === composite || isSelectedLessonsLoading || isSecLessonsLoading}
                                          />
                                          <Button
                                            size="sm"
                                            variant={isSingleCompleted ? 'success' : 'outline'}
                                            onClick={(e) => { e.stopPropagation(); handleGenerateLessonsForSingleSubStandard(section, ss, idx) }}
                                            isLoading={isLoading && loadingSingleLessonsKey === composite}
                                            className={loadingSingleLessonsKey === composite ? 'animate-pulse ring-2 ring-blue-300' : (isSingleCompleted ? 'ring-2 ring-green-300 animate-pulse' : '')}
                                          >
                                            {isSingleCompleted ? 'Generated ✓' : 'Generate'}
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => { e.stopPropagation(); handleExportSubStandardLessons(section, ss, idx) }}
                                            disabled={(() => {
                                              const sectionLessons = lessonsBySection[secKey] || []
                                              const norm = (v: any) => String(v || '').trim().toLowerCase()
                                              const codeN = norm(ss.code || `S${idx + 1}`)
                                              return !Array.isArray(sectionLessons) || sectionLessons.filter((ls: any) => norm(ls.standard_code || ls.code) === codeN).length === 0
                                            })()}
                                          >
                                            Export
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  )})}
                                </tbody>
                              </table>
                            </div>
                            {/* Multi-select actions for sub-standards */}
                            <div className="mt-3 flex items-center justify-between">
                              <div className="text-xs text-gray-600">
                                {(() => {
                                  const secKey = String(section.id || section.name || section.title || '')
                                  const selected = Object.values(selectedSubStandardsBySection[secKey] || {}).filter(Boolean).length
                                  return `${selected} sub-standard${selected !== 1 ? 's' : ''} selected`
                                })()}
                              </div>
                              <div>
                                <Button
                                  size="sm"
                                  variant={isSelectedLessonsLoading ? 'primary' : (isBatchCompleted ? 'success' : 'primary')}
                                  onClick={(e) => { e.stopPropagation(); handleGenerateLessonsForSelectedSubStandards(section) }}
                                  isLoading={isLoading && isSelectedLessonsLoading}
                                  className={isSelectedLessonsLoading ? 'animate-pulse ring-2 ring-blue-300' : (isBatchCompleted ? 'ring-2 ring-green-300 animate-pulse' : '')}
                                  disabled={(() => {
                                    const secKey = String(section.id || section.name || section.title || '')
                                    return Object.values(selectedSubStandardsBySection[secKey] || {}).filter(Boolean).length === 0
                                  })()}
                                >
                                  {isBatchCompleted ? 'Generated for selected ✓' : 'Generate lessons for selected'}
                                </Button>
                              </div>
                            </div>
                            </>
                          ) : (
                            <p className="text-xs text-gray-500">No sub-standards yet. Click Generate to create them.</p>
                          )}
                          {Array.isArray(subStandardsBySection[String(section.id || section.name || section.title || '')]) && subStandardsBySection[String(section.id || section.name || section.title || '')].length > 0 && (
                            <div className="mt-3 bg-white border border-gray-200 rounded p-3">
                              <div className="flex flex-col sm:flex-row gap-3 items-end justify-between">
                                <div className="w-full sm:w-48">
                                  <Input
                                    type="number"
                                    label="Total lessons to generate"
                                    value={String(lessonsPerSubStandardBySection[String(section.id || section.name || section.title || '')] ?? '')}
                                    onChange={(e) => {
                                      const key = String(section.id || section.name || section.title || '')
                                      const val = parseInt(e.target.value)
                                      setLessonsPerSubStandardBySection((prev) => ({ ...prev, [key]: Number.isFinite(val) && val > 0 ? val : 0 }))
                                    }}
                                    placeholder="e.g., 7"
                                    min="1"
                                    max="50"
                                    disabled={isSecLessonsLoading || isSelectedLessonsLoading}
                                  />
                                  <p className="text-xs text-gray-500 mt-1">Lessons will be distributed across all sub-standards in this section</p>
                                </div>
                                <div className="flex-1 text-right">
                                  <Button
                                    size="sm"
                                    variant={isSecLessonsLoading ? 'primary' : (isSecLessonsCompleted ? 'success' : 'primary')}
                                    onClick={(e) => { e.stopPropagation(); handleGenerateLessonsFromSubStandards(section) }}
                                    isLoading={isLoading && isSecLessonsLoading}
                                    className={isSecLessonsLoading ? 'animate-pulse ring-2 ring-blue-300' : (isSecLessonsCompleted ? 'ring-2 ring-green-300 animate-pulse' : '')}
                                  >
                                    {isSecLessonsCompleted ? 'Generated ✓' : 'Generate Lessons from Sub-standards'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Lessons under this section */}
                          {Array.isArray(lessonsBySection[String(section.id || section.name || section.title || '')]) && lessonsBySection[String(section.id || section.name || section.title || '')].length > 0 && (
                            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
                              {(() => {
                                const secKey = String(section.id || section.name || section.title || '')
                                const sectionLessons = lessonsBySection[secKey] || []
                                const subStandards = subStandardsBySection[secKey] || []
                                const norm = (v: any) => String(v || '').trim().toLowerCase()
                                const grouped = subStandards.map((ss: any, sidx: number) => {
                                  const code = ss.code || `S${sidx + 1}`
                                  const codeN = norm(code)
                                  const items = sectionLessons.filter((ls: any) => norm(ls.standard_code || ls.code) === codeN)
                                  return { ss, code, items }
                                }).filter(g => g.items.length > 0)
                                const total = sectionLessons.length
                                const selectedCount = Object.entries(selectedLessonsBySection[secKey] || {}).filter(([k,v]) => !!v).length
                                return (
                                  <>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                      <div className="flex items-center gap-3">
                                        <h4 className="text-sm font-semibold text-yellow-900">Lessons ({total})</h4>
                                        <label className="inline-flex items-center gap-2 text-xs text-yellow-900">
                                          <input
                                            type="checkbox"
                                            checked={sectionLessons.length > 0 && sectionLessons.every((ls: any) => (selectedLessonsBySection[secKey] || {})[getLessonKey(ls)])}
                                            onChange={() => toggleSelectAllLessonsInSection(section)}
                                          />
                                          Select all in section
                                        </label>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-[11px] text-yellow-800">Grouped by sub-standard</span>
                                        <Button
                                          size="sm"
                                          variant={total > 0 ? 'outline' : 'outline'}
                                          onClick={(e) => { e.stopPropagation(); handleExportSectionLessons(section) }}
                                          disabled={total === 0}
                                        >
                                          Export Section (Excel)
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant={selectedCount > 0 ? 'primary' : 'outline'}
                                          onClick={() => handleAddToProductGeneration(section)}
                                          disabled={selectedCount === 0}
                                        >
                                          Add selected to Product Generation
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="space-y-3">
                                      {grouped.length === 0 ? (
                                        <p className="text-xs text-yellow-900">No lessons matched any sub-standard yet.</p>
                                      ) : (
                                        grouped.map((g, gi) => (
                                          <div key={gi} className="bg-white rounded border border-yellow-200">
                                            <div className="px-3 py-2 border-b border-yellow-200 flex items-center justify-between">
                                              <div className="flex items-center gap-3">
                                                <input
                                                  type="checkbox"
                                                  checked={g.items.length > 0 && g.items.every((ls: any) => (selectedLessonsBySection[secKey] || {})[getLessonKey(ls)])}
                                                  onChange={() => toggleSelectAllLessonsInGroup(section, g.code, g.items)}
                                                />
                                                <p className="text-xs font-semibold text-yellow-900">{g.code}</p>
                                                <p className="text-sm text-gray-900">{g.ss.title || g.ss.name}</p>
                                              </div>
                                              <span className="text-[11px] text-yellow-700">{g.items.length} lesson{g.items.length !== 1 ? 's' : ''}</span>
                                            </div>
                                            <div className="p-3 space-y-2">
                                              {g.items.map((ls: any, li: number) => (
                                                <div key={li} className="p-3 bg-yellow-25 rounded border border-yellow-100">
                                                  <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-2">
                                                      <input
                                                        type="checkbox"
                                                        checked={!!(selectedLessonsBySection[secKey] || {})[getLessonKey(ls)]}
                                                        onChange={() => toggleLessonSelection(section, ls)}
                                                      />
                                                      <p className="font-medium text-gray-900">{ls.title || ls.name}</p>
                                                    </div>
                                                    {ls.lesson_code && (
                                                      <span className="text-[11px] font-mono text-yellow-800 bg-yellow-100 px-2 py-1 rounded">{ls.lesson_code}</span>
                                                    )}
                                                  </div>
                                                  {ls.description && <p className="text-xs text-gray-600 mt-1">{ls.description}</p>}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </>
                                )
                              })()}
                            </div>
                          )}
                        </div>
                         <div className="mt-4 text-right">
                           <Button onClick={(e) => { e.stopPropagation(); toggleSectionSelection(section) }} size="sm" variant={isSelected ? 'outline' : 'primary'}>
                             {isSelected ? 'Remove from selection' : 'Add to selection'}
                           </Button>
                         </div>
                      </div>
                    )}
                  </div>
                )})}
              </div>
              
              <div className="flex justify-end mt-6">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleOpenTablesPage}
                  disabled={Object.values(lessonsBySection || {}).reduce((sum, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0) === 0}
                >
                  Move Lessons to Tables
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 6: Curriculum Strands & Lessons */}
      {currentStep >= 5 && selectedCurriculumSections.length > 0 && selectedGrade && selectedFramework && (
        <div id="step-6" className="mb-8">
          {/* Header Section - simplified to match Step 5 style */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">📊 Step 6: Curriculum Strands & Lessons</h2>
                <p className="text-gray-600">Lessons for Grade &quot;{selectedGrade?.name}&quot;</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{strands.reduce((sum, s) => sum + s.target_lesson_count, 0)}</p>
                <p className="text-gray-500 text-sm">Lessons Planned</p>
              </div>
            </div>
            {/* Context Summary for Step 6 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div>
                  <p className="text-xs font-semibold text-blue-900 uppercase">Subject</p>
                  <p className="text-sm text-blue-800">{selectedSubject?.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-900 uppercase">Curriculum</p>
                  <p className="text-sm text-blue-800">{(() => {
                    const name = String(selectedStateCurriculum?.curriculum_name || '')
                    const isNoSpecial = name.toLowerCase().includes('no special curriculum')
                    if (isNoSpecial && selectedStateStandardDetails?.standard_name) {
                      return selectedStateStandardDetails.standard_name
                    }
                    return name
                  })()}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-900 uppercase">Region</p>
                  <p className="text-sm text-blue-800">{selectedRegion || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-900 uppercase">Grade</p>
                  <p className="text-sm text-blue-800">{selectedGrade?.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-900 uppercase">Framework</p>
                  <p className="text-sm text-blue-800">{selectedFramework?.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-900 uppercase">Strands</p>
                  <p className="text-sm text-blue-800">{strands.length}</p>
                </div>
              </div>
            </div>
            {/* Navigation buttons removed as requested */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">Framework Analysis: {strands.length} major strands with {strands.reduce((sum, s) => sum + s.target_lesson_count, 0)} total lessons planned.</p>
            </div>
          </div>

          {/* If no strands yet, show Discover Strands panel */}
          {strands.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <p className="text-gray-700 mb-6">
                Select a target number of lessons and discover strands/domains for the selected standard.
              </p>
              <div className="max-w-xs mx-auto mb-6">
                <Input
                  type="number"
                  label="Target Total Lesson Count"
                  value={totalLessonCount}
                  onChange={(e) => setTotalLessonCount(e.target.value)}
                  placeholder="45"
                  min="1"
                  max="200"
                />
              </div>
              <Button onClick={handleDiscoverStrands} isLoading={isLoading} size="lg">
                Discover Strands
              </Button>
            </div>
          ) : (
            <></>
          )}

          {/* Analysis Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">📚 Framework Overview</h3>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Total Strands:</strong> {strands.length}
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Total Standards:</strong> {strands.reduce((sum, s) => sum + s.num_standards, 0)}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Total Lessons:</strong> {strands.reduce((sum, s) => sum + s.target_lesson_count, 0)}
                </p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-3">✅ Progress</h3>
                <p className="text-sm text-gray-700">
                  Progress: 0 of {strands.length} strands generated
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Strands will be automatically saved when you approve lessons
                </p>
              </div>
            </div>
          </div>

          {/* Strands Controls */}
          <div className="flex items-center justify-between mb-4">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={selectedStrands.length === strands.length && strands.length > 0}
                onChange={toggleSelectAllStrands}
              />
              Select all strands
            </label>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{selectedStrands.length} selected</span>
              <Button
                onClick={handleGenerateLessonsForSelected}
                variant="primary"
                size="sm"
                disabled={selectedStrands.length === 0 || isLoading}
              >
                Generate lessons for selected
              </Button>
            </div>
          </div>

          {/* Strands Cards - simplified design to match Step 5 */}
          <div className="space-y-4 mb-6">
            {strands.map((strand, index) => (
              <div
                key={index}
                className={`bg-white border-2 rounded-lg overflow-hidden transition-all ${
                  selectedStrands.some(s => s.strand_code === strand.strand_code)
                    ? 'border-blue-600 ring-2 ring-blue-100 shadow-md'
                    : 'border-transparent hover:border-blue-300'
                }`}
              >
                {/* Strand Header - simplified */}
                <div className="p-4 border-b border-gray-200 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base">{strand.strand_code}</h3>
                    <p className="text-gray-600 text-sm mt-1">{strand.strand_name}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">{strand.target_lesson_count}</p>
                      <p className="text-gray-500 text-xs">Lessons</p>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedStrands.some(s => s.strand_code === strand.strand_code)}
                        onChange={() => toggleStrandSelection(strand)}
                      />
                      {selectedStrands.some(s => s.strand_code === strand.strand_code) ? 'Selected' : 'Select'}
                    </label>
                  </div>
                </div>

                {/* Strand Content */}
                <div className="p-4">
                  {/* Standards Info */}
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Standards</p>
                    <p className="text-sm text-gray-700">{strand.num_standards} standards • {strand.target_lesson_count} lessons planned</p>
                  </div>

                  {/* Key Topics */}
                  {strand.key_topics && strand.key_topics.length > 0 && (
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-3">Key Topics:</p>
                      <div className="flex flex-wrap gap-2">
                        {strand.key_topics.map((topic, i) => (
                          <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Performance Expectations */}
                  {strand.performance_expectations && strand.performance_expectations.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Performance Expectations:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                        {strand.performance_expectations.map((expectation, i) => (
                          <p key={i} className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                            {expectation}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <Button
                    onClick={() => handleGenerateLessons(strand)}
                    isLoading={isLoading && selectedStrand?.strand_code === strand.strand_code}
                    className="w-full"
                    variant="primary"
                  >
                    Generate Lessons for {strand.strand_code}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Saved Lessons Section - grouped by strand and key topics */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">💾 Saved Lessons ({lessons.length})</h3>
            {lessons.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No lessons yet. Generate or add one above.</p>
            ) : (
              <div className="space-y-6">
                {(() => {
                  // Build grouping by strand, then by key topics
                  const strandMap = new Map<string, { name: string, topics: Map<string, any[]>, other: any[] }>()
                  // Ensure all selected strands are represented
                  const allStrands = selectedStrands.length > 0 ? selectedStrands : strands
                  allStrands.forEach(s => {
                    if (!strandMap.has(s.strand_code)) {
                      strandMap.set(s.strand_code, { name: s.strand_name, topics: new Map<string, any[]>(), other: [] })
                      s.key_topics.forEach(t => {
                        strandMap.get(s.strand_code)!.topics.set(t, [])
                      })
                    }
                  })
                  lessons.forEach((lesson: any) => {
                    const code = lesson.strand_code || selectedStrand?.strand_code || allStrands[0]?.strand_code
                    const strandEntry = strandMap.get(code)
                    if (!strandEntry) return
                    // Try to assign to a topic by keyword match in title/description
                    const title = (lesson.title || lesson.name || '').toLowerCase()
                    const desc = (lesson.description || '').toLowerCase()
                    let placed = false
                    strandEntry.topics.forEach((arr, topic) => {
                      const t = topic.toLowerCase()
                      if (!placed && (title.includes(t) || desc.includes(t))) {
                        arr.push(lesson)
                        placed = true
                      }
                    })
                    if (!placed) strandEntry.other.push(lesson)
                  })

                  const strandSections: JSX.Element[] = []
                  strandMap.forEach((value, code) => {
                    const topicsWithContent = Array.from(value.topics.entries()).filter(([_, list]) => list.length > 0)
                    const hasOther = value.other.length > 0
                    strandSections.push(
                      <div key={code} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Strand {code}: {value.name}</h4>
                        {topicsWithContent.length === 0 && !hasOther ? (
                          <p className="text-sm text-gray-500">No lessons categorized yet.</p>
                        ) : (
                          <div className="space-y-4">
                            {topicsWithContent.map(([topic, list]) => (
                              <div key={topic}>
                                <p className="text-xs font-semibold uppercase text-gray-600 mb-2">{topic}</p>
                                <div className="space-y-2">
                                  {list.map((lesson, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                      <div className="flex-grow">
                                        <p className="font-medium text-gray-900">{lesson.title || lesson.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">{lesson.description}</p>
                                      </div>
                                      <button onClick={() => { setSelectedLesson(lesson); setShowLessonModal(true) }} className="ml-4 text-blue-600 hover:text-blue-800 font-medium text-sm">View</button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                            {hasOther && (
                              <div>
                                <p className="text-xs font-semibold uppercase text-gray-600 mb-2">Other</p>
                                <div className="space-y-2">
                                  {value.other.map((lesson, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                      <div className="flex-grow">
                                        <p className="font-medium text-gray-900">{lesson.title || lesson.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">{lesson.description}</p>
                                      </div>
                                      <button onClick={() => { setSelectedLesson(lesson); setShowLessonModal(true) }} className="ml-4 text-blue-600 hover:text-blue-800 font-medium text-sm">View</button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                  return <>{strandSections}</>
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 7: Removed - results are shown within Saved Lessons section */}

      {/* Context Modal */}
      <Modal
        isOpen={showContextModal}
        onClose={() => setShowContextModal(false)}
        title="Set Generation Context"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Provide context to help AI generate more relevant and specific content for your curriculum needs.
          </p>
          <Textarea
            label="Context (Optional)"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Example: I need subjects for elementary school students focusing on STEM education..."
            rows={6}
            helperText="This context will be used throughout the generation process."
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowContextModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowContextModal(false)
            }}>
              Save Context
            </Button>
          </div>
        </div>
      </Modal>

      {/* Lesson Details Modal */}
      <Modal
        isOpen={showLessonModal}
        onClose={() => setShowLessonModal(false)}
        title={selectedLesson?.title || selectedLesson?.name || 'Lesson Details'}
        size="lg"
      >
        {selectedLesson && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{selectedLesson.description}</p>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Details</h4>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Subject:</strong> {selectedSubject?.name}</li>
                <li><strong>Framework:</strong> {selectedFramework?.name}</li>
                <li><strong>Grade:</strong> {selectedGrade?.name}</li>
                <li><strong>Strand:</strong> {selectedStrand?.strand_name}</li>
              </ul>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowLessonModal(false)}>
                Close
              </Button>
              <Button onClick={() => {
                // TODO: Implement save/export functionality
                alert('Export functionality coming soon!')
              }}>
                Export Lesson
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* State Standard Details Modal */}
      <Modal
        isOpen={showStateStandardModal}
        onClose={() => setShowStateStandardModal(false)}
        title={stateStandardDetails?.standard_name ? `${stateStandardDetails.standard_name}` : 'State Standard'}
        size="lg"
      >
        {stateStandardDetails ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Region</p>
                <p className="text-gray-800">{stateStandardDetails.region}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Subject</p>
                <p className="text-gray-800">{selectedSubject?.name}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Overview</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{stateStandardDetails.coverage_description}</p>
            </div>
            {Array.isArray(stateStandardDetails.notable_features) && stateStandardDetails.notable_features.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Notable features</h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {stateStandardDetails.notable_features.map((f: string, idx: number) => (
                    <li key={idx}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray(stateStandardDetails.alternate_names) && stateStandardDetails.alternate_names.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Alternate names</h4>
                <div className="flex flex-wrap gap-2">
                  {stateStandardDetails.alternate_names.map((n: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">{n}</span>
                  ))}
                </div>
              </div>
            )}
            {stateStandardDetails.reference_note && (
              <p className="text-xs text-gray-500">{stateStandardDetails.reference_note}</p>
            )}
            <div className="flex justify-between gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowStateStandardModal(false)}>Close</Button>
              <Button
                onClick={() => {
                  if (pendingStateContext) {
                    // Always set the curriculum group from the card context
                    setSelectedRegion(pendingStateContext.region)
                    setSelectedStateCurriculum(pendingStateContext.curriculum)
                    setSelectedStateStandardDetails(stateStandardDetails || null)
                    // Clear downstream selections to avoid stale data
                    setFrameworks([])
                    setGrades([])
                    setStrands([])
                    setLessons([])
                    setSelectedFramework(null)
                    setSelectedGrade(null)
                    setSelectedGrades([])
                    setShowStateStandardModal(false)
                    // Clear highlight since we're advancing to Step 3
                    setHighlightedRegion(null)
                    setHighlightedCurriculumName(null)
                    // Scroll to the selected state summary at the bottom of Step 2
                    scrollToSelectedState()
                  } else if (stateStandardDetails?.region) {
                    // Fallback: create a minimal synthetic curriculum group if none exists
                    const region = stateStandardDetails.region
                    setSelectedRegion(region)
                    if (!selectedStateCurriculum) {
                      setSelectedStateCurriculum({
                        curriculum_name: `Selected Region: ${region}`,
                        description: 'User-selected region (synthetic group)',
                        states: [region]
                      } as any)
                    }
                    setSelectedStateStandardDetails(stateStandardDetails || null)
                    setFrameworks([])
                    setGrades([])
                    setStrands([])
                    setLessons([])
                    setSelectedFramework(null)
                    setSelectedGrade(null)
                    setSelectedGrades([])
                    setShowStateStandardModal(false)
                    setHighlightedRegion(null)
                    setHighlightedCurriculumName(null)
                    scrollToSelectedState()
                  }
                }}
              >
                Use this state for next step
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No details available.</p>
        )}
      </Modal>

      {/* Custom Curriculum Group Modal */}
      <Modal
        isOpen={showCustomGroupModal}
        onClose={() => setShowCustomGroupModal(false)}
        title="Create Custom Curriculum Group"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Group name"
              value={customGroupName}
              onChange={(e) => setCustomGroupName(e.target.value)}
              placeholder="e.g., State-Adapted Science Standards"
            />
            <Input
              label="Description (optional)"
              value={customGroupDescription}
              onChange={(e) => setCustomGroupDescription(e.target.value)}
              placeholder="Short description"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">Select states/provinces to include</p>
            <div className="flex flex-wrap gap-2 max-h-64 overflow-auto border rounded p-3 bg-gray-50">
              {Array.from(new Set(stateCurricula.flatMap((g: any) => g.states || []))).sort().map((state, idx) => {
                const selected = customGroupSelectedStates.includes(state)
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`px-2 py-1 text-xs rounded border ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
                    onClick={() => {
                      setCustomGroupSelectedStates((prev) => prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state])
                    }}
                  >
                    {state}
                  </button>
                )
              })}
            </div>
            <div className="text-xs text-gray-500 mt-1">{customGroupSelectedStates.length} selected</div>
          </div>
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setShowCustomGroupModal(false)}>Cancel</Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  // Create but stay on current step
                  if (!customGroupName.trim() || customGroupSelectedStates.length === 0) return
                  const newGroup = { curriculum_name: customGroupName.trim(), description: customGroupDescription.trim(), states: customGroupSelectedStates.slice() }
                  // Insert and sort by states count desc
                  setStateCurricula((prev: any[]) => {
                    const list = [...prev, newGroup]
                    list.sort((a, b) => (b.states?.length || 0) - (a.states?.length || 0))
                    return list
                  })
                  // Set as selected curriculum for summary at bottom of Step 2
                  setSelectedStateCurriculum(newGroup as any)
                  setSelectedRegion(null)
                  setSelectedStateStandardDetails(null)
                  // Clear downstream until user continues
                  setFrameworks([])
                  setGrades([])
                  setStrands([])
                  setLessons([])
                  setShowCustomGroupModal(false)
                  // Scroll to custom summary
                  scrollToSelectedCustom()
                }}
              >
                Create Group
              </Button>
              <Button
                onClick={() => {
                  // Create and proceed
                  if (!customGroupName.trim() || customGroupSelectedStates.length === 0) return
                  const newGroup = { curriculum_name: customGroupName.trim(), description: customGroupDescription.trim(), states: customGroupSelectedStates.slice() }
                  setStateCurricula((prev: any[]) => {
                    const list = [...prev, newGroup]
                    list.sort((a, b) => (b.states?.length || 0) - (a.states?.length || 0))
                    return list
                  })
                  setSelectedStateCurriculum(newGroup as any)
                  setSelectedRegion(null)
                  setSelectedStateStandardDetails(null)
                  // Keep user in Step 2 and show summary
                  setShowCustomGroupModal(false)
                  scrollToSelectedCustom()
                }}
              >
                Create and use for next step
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Payment Required Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        message={paymentErrorMessage}
        redirectTo="/credits"
      />

      {/* Product Category Selection Modal */}
      <Modal
        isOpen={showProductCategoryModal}
        onClose={() => setShowProductCategoryModal(false)}
        title="Select Product Category and Sub-Page"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Select a group and sub-page to add your {pendingLessonsForProduct.length} selected lesson(s)
          </p>

          {/* Category Groups */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Product Group</label>
            <select
              value={selectedProductGroup || ''}
              onChange={(e) => {
                setSelectedProductGroup(e.target.value || null)
                setSelectedProductSubPage(null)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select a Group --</option>
              <option value="group-t">Group T</option>
              <option value="group-a">Group A</option>
              <option value="group-b">Group B</option>
              <option value="group-c">Group C</option>
              <option value="group-d">Group D</option>
              <option value="group-e">Group E</option>
              <option value="group-f">Group F</option>
              <option value="group-g">Group G</option>
              <option value="group-h">Group H</option>
              <option value="group-i">Group I</option>
            </select>
          </div>

          {/* Sub-Pages for Selected Group */}
          {selectedProductGroup && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Sub-Page</label>
              <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {Array.from({ length: 11 }, (_, i) => {
                  const groupLetter = selectedProductGroup.replace('group-', '').toUpperCase()
                  const subPageId = `${groupLetter.toLowerCase()}-${String(i + 1).padStart(2, '0')}`
                  const subPageName = `${groupLetter} - ${String(i + 1).padStart(2, '0')}`
                  return (
                    <button
                      key={subPageId}
                      onClick={() => setSelectedProductSubPage(subPageId)}
                      className={`px-2 py-2 rounded border-2 transition-colors text-xs font-medium ${
                        selectedProductSubPage === subPageId
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
                      }`}
                    >
                      {subPageName}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          {selectedProductGroup && selectedProductSubPage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-900">
                <strong>Ready to add:</strong> {pendingLessonsForProduct.length} lesson(s) to <strong>{selectedProductGroup.replace('group-', 'Group ')}</strong> → <strong>{selectedProductSubPage.toUpperCase()}</strong>
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end border-t border-gray-200 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowProductCategoryModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmProductCategorySelection}
              disabled={!selectedProductGroup || !selectedProductSubPage}
            >
              Add to Selected Sub-Page
            </Button>
          </div>
        </div>
      </Modal>

      {/* Getting Started Guide - Removed */}
      </div>
    </Layout>
    </ProtectedRoute>
  )
}

