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
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [stateCurricula, setStateCurricula] = useState<any[]>([])
  const [selectedCurriculum, setSelectedCurriculum] = useState<any | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<string>('')
  const [lessonCount, setLessonCount] = useState<string>('12')
  const [lessons, setLessons] = useState<LessonItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [context, setContext] = useState<string>('')

  const effectiveTheme = (selectedTheme || customTheme || '').trim()

  const steps = [
    { label: 'Theme', completed: currentStep > 0, active: currentStep === 0 },
    { label: 'Country', completed: currentStep > 1, active: currentStep === 1 },
    { label: 'State Curriculum', completed: currentStep > 2, active: currentStep === 2 },
    { label: 'Grade', completed: currentStep > 3, active: currentStep === 3 },
    { label: 'Lessons', completed: false, active: currentStep === 4 }
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

  const handleGenerateLessons = async () => {
    if (!effectiveTheme || !selectedCountry || !selectedCurriculum || !selectedGrade) {
      setError('Select theme, country, state curriculum, and grade first.')
      return
    }
    setLoading(true); setError(null)
    try {
      const countNum = parseInt(lessonCount)
      const finalCount = Number.isFinite(countNum) && countNum > 0 ? countNum : 12
      const response = await generateContent({
        type: 'holiday-seasonal-lessons',
        country: selectedCountry,
        stateCurriculum: selectedCurriculum.curriculum_name,
        grade: selectedGrade,
        framework: selectedCurriculum.curriculum_name,
        theme: effectiveTheme,
        lessonCount: finalCount,
        model: selectedModel,
        context
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

  const handleReset = () => {
    setCurrentStep(0)
    setSelectedTheme('')
    setCustomTheme('')
    setSelectedCountry('')
    setStateCurricula([])
    setSelectedCurriculum(null)
    setSelectedGrade('')
    setLessons([])
    setLessonCount('12')
    setError(null); setSuccess(null)
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
              <div className="mt-6 flex justify-end">
                <Button variant="primary" disabled={!effectiveTheme} onClick={() => setCurrentStep(1)}>Next: Country</Button>
              </div>
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
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>Back</Button>
                <Button variant="primary" disabled={!selectedCurriculum} onClick={() => setCurrentStep(3)}>Next: Grade</Button>
              </div>
            </div>
          )}

          {/* Step 4: Grade */}
          {currentStep === 3 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Step 4: Select Grade</h2>
                <ModelSelector />
              </div>
              <p className="text-sm text-gray-600 mb-4">Choose the grade level for lesson alignment.</p>
              <div className="grid md:grid-cols-3 gap-4">
                {Object.entries(gradeCategories).map(([key, cat]) => (
                  <Card key={key} className="space-y-2">
                    <h4 className="font-semibold text-gray-900 text-sm">{cat.label}</h4>
                    <div className="flex flex-wrap gap-2">
                      {cat.grades.map((g) => {
                        const sel = selectedGrade === g
                        return (
                          <button key={g} type="button" onClick={() => setSelectedGrade(g)} className={`px-2 py-1 rounded text-xs font-medium border ${sel ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-800 border-gray-300 hover:border-purple-400'}`}>{g}</button>
                        )
                      })}
                    </div>
                  </Card>
                ))}
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>Back</Button>
                <Button variant="primary" disabled={!selectedGrade} onClick={() => setCurrentStep(4)}>Next: Generate Lessons</Button>
              </div>
            </div>
          )}

          {/* Step 5: Lessons */}
          {currentStep === 4 && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Step 5: Generate Lessons</h2>
                <ModelSelector />
              </div>
              <p className="text-sm text-gray-600 mb-4">Generate themed lessons using the selected parameters.</p>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <Input label="Theme" value={effectiveTheme} disabled onChange={() => {}} />
                <Input label="Country" value={selectedCountry} disabled onChange={() => {}} />
                <Input label="Curriculum Group" value={selectedCurriculum?.curriculum_name || ''} disabled onChange={() => {}} />
                <Input label="Grade" value={selectedGrade} disabled onChange={() => {}} />
                <Input label="Number of Lessons" value={lessonCount} onChange={(e) => setLessonCount(e.target.value)} placeholder="e.g. 12" />
              </div>
              <Textarea label="Additional Context (optional)" value={context} onChange={(e) => setContext(e.target.value)} placeholder="Any extra notes or constraints" />
              <div className="flex justify-end mt-4 gap-3">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>Back</Button>
                <Button variant="primary" disabled={loading} onClick={handleGenerateLessons}>{loading ? 'Generating…' : 'Generate Lessons'}</Button>
              </div>
              {lessons.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Generated Lessons ({lessons.length})</h3>
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
                </div>
              )}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
