import React, { useState } from 'react'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Input from '@/components/Input'
import Textarea from '@/components/Textarea'
import Alert from '@/components/Alert'
import ProgressIndicator from '@/components/ProgressIndicator'
import { generateContent } from '@/lib/api'
import { DEFAULT_MODEL, ALLOWED_MODELS } from '@/lib/ai-constants'

interface LessonItem { title: string; description: string; standard_code?: string; lesson_code?: string; theme?: string }

const holidayThemes = [
  'Black History Month',
  'Christmas-Chanukah-Kwanzaa',
  'Earth Day',
  'Easter',
  'Halloween',
  'Hispanic Heritage Month',
  'Martin Luther King Day',
  'Presidents\' Day',
  'St. Patrick\'s Day',
  'Thanksgiving',
  'New Year',
  'Valentine\'s Day',
  'Women\'s History Month'
]

const seasonalThemes = [
  'Autumn',
  'Winter',
  'Spring',
  'Summer',
  'Back to school',
  'End of year'
]

// Static countries list (reuse from main page)
const countries = [
  { name: 'USA', description: 'United States of America' },
  { name: 'Canada', description: 'Canada' },
  { name: 'Australia', description: 'Australia' },
  { name: 'UK', description: 'United Kingdom' }
]

// Static grade categories (reuse pattern)
const gradeCategories = {
  elementary: { label: 'Elementary', grades: ['Preschool','Kindergarten','1st grade','2nd grade','3rd grade','4th grade','5th grade'] },
  middle_school: { label: 'Middle School', grades: ['6th grade','7th grade','8th grade'] },
  high_school: { label: 'High School', grades: ['9th grade','10th grade','11th grade','12th grade'] }
}

export default function HolidaySeasonalPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL)
  const [selectedTheme, setSelectedTheme] = useState<string>('')
  const [customTheme, setCustomTheme] = useState<string>('')
  const [manualMode, setManualMode] = useState(false)
  const [manualCountry, setManualCountry] = useState<string>('')
  const [manualCurriculum, setManualCurriculum] = useState<string>('')
  const [manualSubject, setManualSubject] = useState<string>('')
  const [manualGrades, setManualGrades] = useState<string>('')
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [stateCurricula, setStateCurricula] = useState<any[]>([])
  const [selectedCurriculum, setSelectedCurriculum] = useState<any | null>(null)
  const [customCurriculum, setCustomCurriculum] = useState<string>('')
  const [subjects, setSubjects] = useState<any[]>([])
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null)
  const [selectedGrades, setSelectedGrades] = useState<string[]>([])
  const [lessonCount, setLessonCount] = useState<string>('12')
  const [lessons, setLessons] = useState<LessonItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [context, setContext] = useState<string>('')

  const effectiveTheme = (selectedTheme || customTheme || '').trim()
  const effectiveCurriculum = (customCurriculum.trim() || selectedCurriculum?.curriculum_name || '').trim()

  const steps = [
    { label: 'Theme', completed: currentStep > 0, active: currentStep === 0 },
    { label: 'Country', completed: currentStep > 1, active: currentStep === 1 },
    { label: 'State Curriculum', completed: currentStep > 2, active: currentStep === 2 },
    { label: 'Subject', completed: currentStep > 3, active: currentStep === 3 },
    { label: 'Grade', completed: currentStep > 4, active: currentStep === 4 },
    { label: 'Lessons', completed: false, active: currentStep === 5 }
  ]

  const ModelSelector = ({ className = '' }: { className?: string }) => (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className="hidden sm:inline text-xs font-semibold tracking-wide text-purple-800">Model</span>
      <div className="relative">
        <select
          aria-label="AI model selector"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="appearance-none pr-8 pl-3 py-1.5 rounded-full border-2 border-purple-400 bg-white text-gray-900 text-sm font-mono shadow-sm focus:outline-none focus:ring-4 focus:ring-purple-200 hover:border-purple-500"
        >
          {ALLOWED_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-purple-600">▾</span>
      </div>
      <span className="hidden md:inline-flex items-center gap-1 rounded-full border border-purple-300 bg-purple-50 text-purple-800 text-[11px] font-mono px-2 py-1">Using: {selectedModel}</span>
    </div>
  )

  const generateStateCurricula = async () => {
    if (!selectedCountry || !effectiveTheme) return
    if (stateCurricula.length > 0) return
    setLoading(true); setError(null)
    try {
      const response = await generateContent({
        type: 'state-curricula',
        country: selectedCountry,
        subject: effectiveTheme + ' Thematic Learning',
        model: selectedModel,
        context
      })
      if (response.items) {
        setStateCurricula(response.items)
        setSuccess(`Generated ${response.items.length} curriculum groups for ${selectedCountry}`)
        setTimeout(() => setSuccess(null), 2500)
      }
    } catch (e: any) {
      setError(String(e.message || 'Failed to generate state curricula'))
    } finally { setLoading(false) }
  }

  const generateSubjects = async () => {
    if (!selectedCountry || !effectiveCurriculum) return
    if (subjects.length > 0) return
    setLoading(true); setError(null)
    try {
      const response = await generateContent({
        type: 'subjects',
        country: selectedCountry,
        context: `Generate subjects relevant to ${effectiveCurriculum} and ${effectiveTheme} theme`,
        model: selectedModel,
        subjectsCount: 10
      })
      if (response.items) {
        setSubjects(response.items)
        setSuccess(`Generated ${response.items.length} subjects for ${effectiveCurriculum}`)
        setTimeout(() => setSuccess(null), 2500)
      }
    } catch (e: any) {
      setError(String(e.message || 'Failed to generate subjects'))
    } finally { setLoading(false) }
  }

  const handleGenerateLessons = async () => {
    if (manualMode) {
      // Manual mode validation
      if (!effectiveTheme || !manualCountry.trim() || !manualCurriculum.trim() || !manualSubject.trim() || !manualGrades.trim()) {
        setError('Fill all manual input fields (Theme, Country, Curriculum, Subject, Grades).')
        return
      }
      setLoading(true); setError(null)
      try {
        const countNum = parseInt(lessonCount)
        const finalCount = Number.isFinite(countNum) && countNum > 0 ? countNum : 12
        const response = await generateContent({
          type: 'holiday-seasonal-lessons',
          country: manualCountry.trim(),
          stateCurriculum: manualCurriculum.trim(),
          subject: manualSubject.trim(),
          grade: manualGrades.trim(),
          framework: manualCurriculum.trim(),
          theme: effectiveTheme,
          lessonCount: finalCount,
          model: selectedModel,
          context: context + `\nManual input grades: ${manualGrades.trim()}`
        })
        if (Array.isArray(response.items)) {
          setLessons(response.items as LessonItem[])
          setSuccess(`Generated ${response.items.length} themed lessons!`)
          setTimeout(() => setSuccess(null), 3000)
        }
      } catch (e: any) {
        setError(String(e.message || 'Failed to generate lessons'))
      } finally { setLoading(false) }
      return
    }

    // Guided mode validation
    if (!effectiveTheme || !selectedCountry || !effectiveCurriculum || !selectedSubject || selectedGrades.length === 0) {
      setError('Select theme, country, state curriculum, subject, and at least one grade first.')
      return
    }
    setLoading(true); setError(null)
    try {
      const countNum = parseInt(lessonCount)
      const finalCount = Number.isFinite(countNum) && countNum > 0 ? countNum : 12
      const gradeList = selectedGrades.join(', ')
      const response = await generateContent({
        type: 'holiday-seasonal-lessons',
        country: selectedCountry,
        stateCurriculum: effectiveCurriculum,
        subject: selectedSubject.name,
        grade: gradeList,
        framework: effectiveCurriculum,
        theme: effectiveTheme,
        lessonCount: finalCount,
        model: selectedModel,
        context: context + (selectedGrades.length > 1 ? `\nMultiple grades selected: ${gradeList}` : '')
      })
      if (Array.isArray(response.items)) {
        setLessons(response.items as LessonItem[])
        setSuccess(`Generated ${response.items.length} themed lessons!`)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (e: any) {
      setError(String(e.message || 'Failed to generate lessons'))
    } finally { setLoading(false) }
  }

  const moveToTables = () => {
    try {
      if (!Array.isArray(lessons) || lessons.length === 0) {
        setError('No generated lessons to move.')
        return
      }

      const lsRaw = window.localStorage.getItem('ta_tables_data')
      const data = lsRaw ? JSON.parse(lsRaw) : {}
      const lessonsBySection: Record<string, any[]> = data.lessonsBySection || {}
      const subStandardsBySection: Record<string, Array<{ code?: string; title?: string; name?: string }>> = data.subStandardsBySection || {}
      const names: Record<string, string> = data.sectionNamesByKey || {}
      const order: string[] = Array.isArray(data.sectionOrder) ? data.sectionOrder.slice() : []

      // Create a single section for holiday/seasonal lessons
      const sectionKey = `holiday-seasonal-${effectiveTheme.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      const sectionTitle = `${effectiveTheme} - Holiday/Seasonal Lessons`

      if (!order.includes(sectionKey)) order.push(sectionKey)
      names[sectionKey] = sectionTitle

      // Merge lessons (avoid duplicates)
      const existing = Array.isArray(lessonsBySection[sectionKey]) ? lessonsBySection[sectionKey] : []
      const existingKeys = new Set(existing.map((l: any) => (String(l.title || l.name || '').toLowerCase() + '|' + String(l.lesson_code || l.code || '').toLowerCase())))
      const toAdd = lessons.filter((l: any) => {
        const k = (String(l.title || '').toLowerCase() + '|' + String(l.lesson_code || '').toLowerCase())
        return !existingKeys.has(k)
      })
      lessonsBySection[sectionKey] = [...existing, ...toAdd]

      // Add sub-standards from lesson codes
      const prevSubs = Array.isArray(subStandardsBySection[sectionKey]) ? subStandardsBySection[sectionKey] : []
      const prevCodes = new Set(prevSubs.map((s: any) => String(s.code || '').toLowerCase()))
      const newSubs: Array<{ code: string; title?: string }> = []
      lessons.forEach((l: any) => {
        const c = String(l.lesson_code || l.code || '').trim()
        if (!c) return
        const key = c.toLowerCase()
        if (prevCodes.has(key)) return
        prevCodes.add(key)
        newSubs.push({ code: c })
      })
      subStandardsBySection[sectionKey] = [...prevSubs, ...newSubs]

      // Build payload with holiday/seasonal context
      const curriculumInfo = manualMode ? manualCurriculum : effectiveCurriculum
      const subjectInfo = manualMode ? manualSubject : (selectedSubject?.name || '')
      const gradeInfo = manualMode ? manualGrades : selectedGrades.join(', ')
      const countryInfo = manualMode ? manualCountry : selectedCountry

      const nextPayload = {
        ...data,
        lessonsBySection,
        subStandardsBySection,
        sectionNamesByKey: names,
        sectionOrder: order,
        subject: subjectInfo,
        framework: curriculumInfo,
        grade: gradeInfo,
        headerSubjectName: subjectInfo,
        headerCurriculum: curriculumInfo || countryInfo || '',
        headerGradeLevel: gradeInfo,
        userCleared: false,
      }
      window.localStorage.setItem('ta_tables_data', JSON.stringify(nextPayload))

      // Clear deletion markers
      try {
        window.localStorage.removeItem('ta_tables_deleted')
        window.localStorage.removeItem('ta_tables_deleted_signature')
      } catch {}

      // Navigate to tables (prefer new tab)
      try {
        const url = new URL('/tables', window.location.origin).toString()
        const w = window.open(url, '_blank')
        if (!w) {
          window.location.href = url
        }
      } catch {
        try {
          window.location.href = '/tables'
        } catch {}
      }

      // Clear lessons from this page after successful move
      setLessons([])
      setSuccess(`${toAdd.length} lesson(s) moved to Tables!`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (e) {
      setError('Failed to move to Tables. Please try again.')
    }
  }

  const handleReset = () => {
    setCurrentStep(0)
    setSelectedTheme('')
    setCustomTheme('')
    setManualMode(false)
    setManualCountry('')
    setManualCurriculum('')
    setManualSubject('')
    setManualGrades('')
    setSelectedCountry('')
    setStateCurricula([])
    setSelectedCurriculum(null)
    setCustomCurriculum('')
    setSubjects([])
    setSelectedSubject(null)
    setSelectedGrades([])
    setLessons([])
    setLessonCount('12')
    setError(null); setSuccess(null)
  }

  const toggleGradeSelection = (grade: string) => {
    setSelectedGrades((prev) => prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade])
  }

  const selectAllGradesInCategory = (category: keyof typeof gradeCategories) => {
    const categoryGrades = gradeCategories[category].grades
    const allSelected = categoryGrades.every(g => selectedGrades.includes(g))
    if (allSelected) {
      setSelectedGrades((prev) => prev.filter(g => !categoryGrades.includes(g)))
    } else {
      setSelectedGrades((prev) => {
        const updated = new Set([...prev, ...categoryGrades])
        return Array.from(updated)
      })
    }
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg shadow-lg p-4 sm:p-6 md:p-8 mb-8 text-white">
            <p className="text-base sm:text-lg md:text-xl text-purple-100 mb-6">
              Generate Holiday / Seasonal themed lessons aligned to state curricula.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button variant="purple" onClick={handleReset}>Start Over</Button>
              <Button variant="purple" onClick={() => { window.location.href = '/' }}>← Back to Main Generator</Button>
            </div>
          </div>

          {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
          {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

          <ProgressIndicator steps={steps} />

          {/* Step 1: Theme */}
          {currentStep === 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Step 1: Select Theme</h2>
                <ModelSelector />
              </div>
              <p className="text-sm text-gray-600 mb-4">Choose a holiday or seasonal theme, or enter your own.</p>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900">Holiday Themes</h3>
                  <p className="text-xs text-gray-500">Pick a holiday or observance</p>
                  <div className="flex flex-wrap gap-2">
                    {holidayThemes.map((t) => {
                      const sel = effectiveTheme === t
                      return (
                        <button key={t} type="button" onClick={() => { setSelectedTheme(t); setCustomTheme('') }} className={`px-2 py-1 rounded text-xs font-medium border ${sel ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-800 border-gray-300 hover:border-purple-400'}`}>{t}</button>
                      )
                    })}
                  </div>
                </Card>
                <Card className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900">Seasonal Themes</h3>
                  <p className="text-xs text-gray-500">Pick a seasonal focus</p>
                  <div className="flex flex-wrap gap-2">
                    {seasonalThemes.map((t) => {
                      const sel = effectiveTheme === t
                      return (
                        <button key={t} type="button" onClick={() => { setSelectedTheme(t); setCustomTheme('') }} className={`px-2 py-1 rounded text-xs font-medium border ${sel ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-800 border-gray-300 hover:border-purple-400'}`}>{t}</button>
                      )
                    })}
                  </div>
                </Card>
              </div>
              <div className="mt-6">
                <Input label="Or enter a custom theme" placeholder="e.g., Community Service Week" value={customTheme} onChange={(e) => { setCustomTheme(e.target.value); setSelectedTheme('') }} />
              </div>
              {effectiveTheme && (
                <div className="mt-6 p-4 border-2 border-blue-300 rounded-lg bg-blue-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-blue-900">Choose Your Path</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <button type="button" onClick={() => { setManualMode(false); setCurrentStep(1) }} className="p-4 border-2 border-purple-400 rounded-lg bg-white hover:bg-purple-50 text-left">
                      <div className="font-semibold text-gray-900 mb-1">🎯 Guided Mode</div>
                      <p className="text-xs text-gray-600">Step-by-step AI-assisted selection of Country, Curriculum, Subject, Grades</p>
                    </button>
                    <button type="button" onClick={() => { setManualMode(true); setCurrentStep(5) }} className="p-4 border-2 border-green-400 rounded-lg bg-white hover:bg-green-50 text-left">
                      <div className="font-semibold text-gray-900 mb-1">⚡ Quick Manual Mode</div>
                      <p className="text-xs text-gray-600">Type all details yourself and generate lessons immediately</p>
                    </button>
                  </div>
                </div>
              )}
              {!effectiveTheme && (
                <div className="mt-6 flex justify-end">
                  <Button variant="primary" disabled={!effectiveTheme} onClick={() => setCurrentStep(1)}>Next: Country</Button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Country */}
          {currentStep === 1 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Step 2: Select Country</h2>
                <ModelSelector />
              </div>
              <p className="text-sm text-gray-600 mb-4">Country selection will contextualize curriculum alignment for the theme <strong>{effectiveTheme}</strong>.</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {countries.map((c) => {
                  const sel = selectedCountry === c.name
                  return (
                    <Card key={c.name} className={`cursor-pointer border-2 ${sel ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-400'}`} onClick={() => setSelectedCountry(c.name)}>
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm">{c.name}</h4>
                      <p className="text-xs text-gray-600">{c.description}</p>
                    </Card>
                  )
                })}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(0)}>Back</Button>
                <Button variant="primary" disabled={!selectedCountry} onClick={() => setCurrentStep(2)}>Next: State Curriculum</Button>
              </div>
            </div>
          )}

          {/* Step 3: State Curriculum */}
          {currentStep === 2 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Step 3: State Curriculum Group</h2>
                <ModelSelector />
              </div>
              <p className="text-sm text-gray-600 mb-4">Generate curriculum groups relevant to the theme and country.</p>
              {stateCurricula.length === 0 && (
                <Button variant="primary" disabled={!selectedCountry || !effectiveTheme || loading} onClick={generateStateCurricula}>
                  {loading ? 'Generating…' : 'Generate Curriculum Groups'}
                </Button>
              )}
              {stateCurricula.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {stateCurricula.map((g: any, idx: number) => {
                    const sel = selectedCurriculum?.curriculum_name === g.curriculum_name
                    return (
                      <Card key={idx} className={`cursor-pointer border-2 ${sel ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-400'}`} onClick={() => setSelectedCurriculum(g)}>
                        <h4 className="font-semibold text-gray-900 mb-1 text-sm">{g.curriculum_name}</h4>
                        <p className="text-xs text-gray-600">{g.description || ''}</p>
                        {Array.isArray(g.states) && g.states.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {g.states.slice(0,6).map((s: string, si: number) => <span key={si} className="text-[10px] px-1 py-0.5 bg-gray-100 rounded border border-gray-200">{s}</span>)}
                            {g.states.length > 6 && <span className="text-[10px] text-gray-500">+{g.states.length - 6}</span>}
                          </div>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
              {selectedCurriculum && (
                <div className="mt-6 p-4 border rounded bg-green-50 border-green-200 text-sm text-green-900">
                  <strong>Selected Group:</strong> {selectedCurriculum.curriculum_name}
                </div>
              )}
              <div className="mt-6">
                <Input label="Or enter a custom State Curriculum" placeholder="e.g., Texas TEKS, California NGSS" value={customCurriculum} onChange={(e) => { setCustomCurriculum(e.target.value); setSelectedCurriculum(null) }} />
              </div>
              {effectiveCurriculum && (
                <div className="mt-4 p-3 border rounded bg-blue-50 border-blue-200 text-sm text-blue-900">
                  <strong>Active Curriculum:</strong> {effectiveCurriculum}
                </div>
              )}
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>Back</Button>
                <Button variant="primary" disabled={!effectiveCurriculum} onClick={() => setCurrentStep(3)}>Next: Subject</Button>
              </div>
            </div>
          )}

          {/* Step 4: Subject */}
          {currentStep === 3 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Step 4: Select Subject</h2>
                <ModelSelector />
              </div>
              <p className="text-sm text-gray-600 mb-4">Generate or select subjects for thematic lessons under <strong>{effectiveCurriculum}</strong>.</p>
              {subjects.length === 0 && (
                <Button variant="primary" disabled={!effectiveCurriculum || loading} onClick={generateSubjects}>
                  {loading ? 'Generating…' : 'Generate Subjects'}
                </Button>
              )}
              {subjects.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {subjects.map((subj: any, idx: number) => {
                    const sel = selectedSubject?.name === subj.name
                    return (
                      <Card key={idx} className={`cursor-pointer border-2 ${sel ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-400'}`} onClick={() => setSelectedSubject(subj)}>
                        <h4 className="font-semibold text-gray-900 mb-1 text-sm">{subj.name}</h4>
                        <p className="text-xs text-gray-600">{subj.description || ''}</p>
                      </Card>
                    )
                  })}
                </div>
              )}
              {selectedSubject && (
                <div className="mt-6 p-4 border rounded bg-green-50 border-green-200 text-sm text-green-900">
                  <strong>Selected Subject:</strong> {selectedSubject.name}
                </div>
              )}
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>Back</Button>
                <Button variant="primary" disabled={!selectedSubject} onClick={() => setCurrentStep(4)}>Next: Grade</Button>
              </div>
            </div>
          )}

          {/* Step 5: Grade */}
          {currentStep === 4 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Step 5: Select Grade(s)</h2>
                <ModelSelector />
              </div>
              <p className="text-sm text-gray-600 mb-4">Choose one or more grade levels for lesson alignment.</p>
              <div className="grid md:grid-cols-3 gap-4">
                {Object.entries(gradeCategories).map(([key, cat]) => {
                  const catKey = key as keyof typeof gradeCategories
                  const allSelected = cat.grades.every(g => selectedGrades.includes(g))
                  return (
                    <Card key={key} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-gray-900 text-sm">{cat.label}</h4>
                        <button type="button" onClick={() => selectAllGradesInCategory(catKey)} className="text-xs text-purple-600 hover:text-purple-800 font-medium">{allSelected ? 'Deselect All' : 'Select All'}</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {cat.grades.map((g) => {
                          const sel = selectedGrades.includes(g)
                          return (
                            <button key={g} type="button" onClick={() => toggleGradeSelection(g)} className={`px-2 py-1 rounded text-xs font-medium border ${sel ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-800 border-gray-300 hover:border-purple-400'}`}>{g}</button>
                          )
                        })}
                      </div>
                    </Card>
                  )
                })}
              </div>
              {selectedGrades.length > 0 && (
                <div className="mt-4 p-3 border rounded bg-blue-50 border-blue-200 text-sm text-blue-900">
                  <strong>Selected:</strong> {selectedGrades.join(', ')}
                </div>
              )}
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>Back</Button>
                <Button variant="primary" disabled={selectedGrades.length === 0} onClick={() => setCurrentStep(5)}>Next: Generate Lessons</Button>
              </div>
            </div>
          )}

          {/* Step 6: Lessons (Guided Mode) */}
          {currentStep === 5 && !manualMode && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Step 6: Generate Lessons</h2>
                <ModelSelector />
              </div>
              <p className="text-sm text-gray-600 mb-4">Generate themed lessons using the selected parameters.</p>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <Input label="Theme" value={effectiveTheme} disabled onChange={() => {}} />
                <Input label="Country" value={selectedCountry} disabled onChange={() => {}} />
                <Input label="Curriculum" value={effectiveCurriculum} disabled onChange={() => {}} />
                <Input label="Subject" value={selectedSubject?.name || ''} disabled onChange={() => {}} />
                <Input label="Grade(s)" value={selectedGrades.join(', ')} disabled onChange={() => {}} />
                <Input label="Number of Lessons" value={lessonCount} onChange={(e) => setLessonCount(e.target.value)} placeholder="e.g. 12" />
              </div>
              <Textarea label="Additional Context (optional)" value={context} onChange={(e) => setContext(e.target.value)} placeholder="Any extra notes or constraints" />
              <div className="flex justify-end mt-4 gap-3">
                <Button variant="outline" onClick={() => setCurrentStep(4)}>Back</Button>
                <Button variant="primary" disabled={loading} onClick={handleGenerateLessons}>{loading ? 'Generating…' : 'Generate Lessons'}</Button>
              </div>
              {lessons.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">Generated Lessons ({lessons.length})</h3>
                    <Button variant="primary" size="sm" onClick={moveToTables}>Move to Tables</Button>
                  </div>
                  <div className="space-y-3">
                    {lessons.map((ls, idx) => (
                      <div key={idx} className="border rounded p-3 bg-white shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-semibold text-gray-900">{ls.title}</h4>
                          {ls.standard_code && <span className="text-xs px-2 py-1 bg-purple-50 border border-purple-200 rounded text-purple-700 font-mono">{ls.standard_code}</span>}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{ls.description}</p>
                        <div className="text-xs text-gray-500 flex gap-3">
                          <span>Code: {ls.lesson_code}</span>
                          <span>Theme: {ls.theme || effectiveTheme}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button variant="primary" onClick={moveToTables}>Move to Tables</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual Mode: Quick Input */}
          {currentStep === 5 && manualMode && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">⚡ Quick Manual Input</h2>
                <ModelSelector />
              </div>
              <p className="text-sm text-gray-600 mb-4">Manually enter all details and generate lessons immediately.</p>
              <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200 mb-6">
                <p className="text-sm text-yellow-900"><strong>Theme:</strong> {effectiveTheme}</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <Input label="Country *" placeholder="e.g., USA, Canada, UK" value={manualCountry} onChange={(e) => setManualCountry(e.target.value)} />
                <Input label="State Curriculum *" placeholder="e.g., Texas TEKS, California NGSS" value={manualCurriculum} onChange={(e) => setManualCurriculum(e.target.value)} />
                <Input label="Subject *" placeholder="e.g., Science, Social Studies" value={manualSubject} onChange={(e) => setManualSubject(e.target.value)} />
                <Input label="Grade(s) *" placeholder="e.g., 3rd grade, or 3rd-5th grade" value={manualGrades} onChange={(e) => setManualGrades(e.target.value)} />
                <Input label="Number of Lessons *" placeholder="e.g., 12" value={lessonCount} onChange={(e) => setLessonCount(e.target.value)} />
              </div>
              <Textarea label="Additional Context (optional)" value={context} onChange={(e) => setContext(e.target.value)} placeholder="Any extra notes or constraints" />
              <div className="flex justify-end mt-4 gap-3">
                <Button variant="outline" onClick={() => { setManualMode(false); setCurrentStep(0) }}>Back to Theme</Button>
                <Button variant="primary" disabled={loading || !manualCountry.trim() || !manualCurriculum.trim() || !manualSubject.trim() || !manualGrades.trim()} onClick={handleGenerateLessons}>
                  {loading ? 'Generating…' : 'Generate Lessons'}
                </Button>
              </div>
              {lessons.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">Generated Lessons ({lessons.length})</h3>
                    <Button variant="primary" size="sm" onClick={moveToTables}>Move to Tables</Button>
                  </div>
                  <div className="space-y-3">
                    {lessons.map((ls, idx) => (
                      <div key={idx} className="border rounded p-3 bg-white shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-semibold text-gray-900">{ls.title}</h4>
                          {ls.standard_code && <span className="text-xs px-2 py-1 bg-purple-50 border border-purple-200 rounded text-purple-700 font-mono">{ls.standard_code}</span>}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{ls.description}</p>
                        <div className="text-xs text-gray-500 flex gap-3">
                          <span>Code: {ls.lesson_code}</span>
                          <span>Theme: {ls.theme || effectiveTheme}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button variant="primary" onClick={moveToTables}>Move to Tables</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
