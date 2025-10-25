import React, { useState } from 'react'
import Layout from '@/components/Layout'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Input from '@/components/Input'
import Textarea from '@/components/Textarea'
import Alert from '@/components/Alert'
import Modal from '@/components/Modal'
import SelectionStep from '@/components/SelectionStep'
import ProgressIndicator from '@/components/ProgressIndicator'
import ExportButton from '@/components/ExportButton'
import { downloadLessonsAsExcel, downloadCompleteCurriculumAsExcel } from '@/lib/excelExport'
import { generateContent } from '@/lib/api'

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
  // State management
  const [currentStep, setCurrentStep] = useState(0)
  const [subjects, setSubjects] = useState<Item[]>([])
  const [frameworks, setFrameworks] = useState<Item[]>([])
  const [grades, setGrades] = useState<Item[]>([])
  const [strands, setStrands] = useState<Strand[]>([])
  const [lessons, setLessons] = useState<Item[]>([])
  
  const [selectedSubject, setSelectedSubject] = useState<Item | null>(null)
  const [selectedFramework, setSelectedFramework] = useState<Item | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<Item | null>(null)
  const [selectedStrand, setSelectedStrand] = useState<Strand | null>(null)
  
  const [context, setContext] = useState('')
  const [totalLessonCount, setTotalLessonCount] = useState('45')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [showContextModal, setShowContextModal] = useState(false)
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<Item | null>(null)

  // Progress steps
  const steps = [
    { label: 'Subject', completed: currentStep > 0, active: currentStep === 0 },
    { label: 'Framework', completed: currentStep > 1, active: currentStep === 1 },
    { label: 'Grade', completed: currentStep > 2, active: currentStep === 2 },
    { label: 'Strands', completed: currentStep > 3, active: currentStep === 3 },
    { label: 'Lessons', completed: false, active: currentStep === 4 },
  ]

  // API handlers
  const handleGenerateSubjects = async () => {
    if (!context.trim()) {
      setShowContextModal(true)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const response = await generateContent({
        type: 'subjects',
        context: context
      })
      if (response.items) {
        setSubjects(response.items)
        setSuccess(`Generated ${response.items.length} subjects!`)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError('Failed to generate subjects. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateFrameworks = async () => {
    if (!selectedSubject) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await generateContent({
        type: 'frameworks',
        subject: selectedSubject.name,
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
    if (!selectedSubject || !selectedFramework) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await generateContent({
        type: 'grades',
        subject: selectedSubject.name,
        framework: selectedFramework.name,
        context: context
      })
      if (response.items) {
        setGrades(response.items)
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
        totalLessonCount: parseInt(totalLessonCount) || 45
      })
      if (response.items && response.items[0]?.major_parts) {
        setStrands(response.items[0].major_parts)
        setCurrentStep(3)
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
        strandCode: strand.strand_code,
        strandName: strand.strand_name,
        targetLessonCount: strand.target_lesson_count,
        keyTopics: strand.key_topics,
        performanceExpectations: strand.performance_expectations
      })
      if (response.items) {
        setLessons(response.items)
        setCurrentStep(4)
        setSuccess(`Generated ${response.items.length} lessons!`)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError('Failed to generate lessons. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Selection handlers
  const handleSelectSubject = (subject: Item) => {
    setSelectedSubject(subject)
    setCurrentStep(1)
    setFrameworks([])
    setGrades([])
    setStrands([])
    setLessons([])
    setSelectedFramework(null)
    setSelectedGrade(null)
  }

  const handleSelectFramework = (framework: Item) => {
    setSelectedFramework(framework)
    setCurrentStep(2)
    setGrades([])
    setStrands([])
    setLessons([])
    setSelectedGrade(null)
  }

  const handleSelectGrade = (grade: Item) => {
    setSelectedGrade(grade)
    setStrands([])
    setLessons([])
  }

  const handleReset = () => {
    setCurrentStep(0)
    setSubjects([])
    setFrameworks([])
    setGrades([])
    setStrands([])
    setLessons([])
    setSelectedSubject(null)
    setSelectedFramework(null)
    setSelectedGrade(null)
    setSelectedStrand(null)
    setContext('')
    setError(null)
    setSuccess(null)
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-8 mb-8 text-white">
          <p className="text-xl text-blue-100 mb-6">
            Create curriculum-aligned lessons powered by AI. Generate complete lesson plans in minutes!
        </p>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            className="bg-white text-blue-600 hover:bg-blue-50 border-white"
            onClick={() => setShowContextModal(true)}
          >
            Set Context
          </Button>
          <Button 
            variant="outline" 
            className="bg-transparent text-white border-white hover:bg-blue-700"
            onClick={handleReset}
          >
            Start Over
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {/* Progress Indicator */}
      <ProgressIndicator steps={steps} />

      {/* Step 1: Subjects */}
      {currentStep >= 0 && (
        <SelectionStep
          title="📚 Step 1: Select a Subject"
          description="Choose an educational subject to start building your curriculum."
          items={subjects}
          selectedItem={selectedSubject}
          onSelect={handleSelectSubject}
          onGenerate={handleGenerateSubjects}
          isLoading={isLoading}
          generateButtonText={subjects.length > 0 ? "Generate More Subjects" : "Generate Subjects"}
          emptyStateText="No subjects generated yet. Click the button below to generate subjects using AI."
        />
      )}

      {/* Export Subjects Button */}
      {currentStep >= 0 && subjects.length > 0 && (
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

      {/* Step 2: Frameworks */}
      {currentStep >= 1 && selectedSubject && (
        <SelectionStep
          title="📋 Step 2: Select a Framework"
          description={`Choose a curriculum framework for ${selectedSubject.name}.`}
          items={frameworks}
          selectedItem={selectedFramework}
          onSelect={handleSelectFramework}
          onGenerate={handleGenerateFrameworks}
          isLoading={isLoading}
          generateButtonText={frameworks.length > 0 ? "Generate More Frameworks" : "Generate Frameworks"}
          emptyStateText="Click below to generate curriculum frameworks for this subject."
        />
      )}

      {/* Export Frameworks Button */}
      {currentStep >= 1 && frameworks.length > 0 && (
        <div className="mb-8 flex justify-end">
          <ExportButton
            onClick={() => downloadLessonsAsExcel(
              frameworks.map(f => ({ name: f.name, description: f.description, title: f.name })),
              selectedSubject?.name,
              undefined,
              undefined
            )}
            variant="success"
            size="sm"
          />
        </div>
      )}

      {/* Step 3: Grades */}
      {currentStep >= 2 && selectedFramework && selectedSubject && (
        <SelectionStep
          title="🎯 Step 3: Select a Grade Level"
          description={`Choose a grade level for ${selectedSubject.name} - ${selectedFramework.name}.`}
          items={grades}
          selectedItem={selectedGrade}
          onSelect={handleSelectGrade}
          onGenerate={handleGenerateGrades}
          isLoading={isLoading}
          generateButtonText={grades.length > 0 ? "Generate More Grades" : "Generate Grades"}
          emptyStateText="Click below to generate grade levels for this framework."
        />
      )}

      {/* Export Grades Button */}
      {currentStep >= 2 && grades.length > 0 && (
        <div className="mb-8 flex justify-end">
          <ExportButton
            onClick={() => downloadLessonsAsExcel(
              grades.map(g => ({ name: g.name, description: g.description, title: g.name })),
              selectedSubject?.name,
              selectedFramework?.name,
              undefined
            )}
            variant="success"
            size="sm"
          />
        </div>
      )}

      {/* Step 4: Discover Strands */}
      {currentStep >= 2 && selectedGrade && strands.length === 0 && (
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              � Step 4: Discover Curriculum Strands
            </h2>
            <p className="text-gray-600 mb-6">
              Analyze the curriculum structure and discover major strands/domains for lesson generation.
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
        </div>
      )}

      {/* Step 5: Strands List */}
      {currentStep >= 3 && strands.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            📊 Step 4: Curriculum Strands
          </h2>
          <p className="text-gray-600 mb-6">
            Select a strand to generate detailed lesson plans.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {strands.map((strand, index) => (
              <Card key={index} hoverable>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {strand.strand_code}: {strand.strand_name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {strand.num_standards} standards • {strand.target_lesson_count} lessons planned
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Key Topics:</p>
                  <div className="flex flex-wrap gap-2">
                    {strand.key_topics.slice(0, 4).map((topic, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() => handleGenerateLessons(strand)}
                  isLoading={isLoading && selectedStrand?.strand_code === strand.strand_code}
                  className="w-full"
                >
                  Generate Lessons
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Step 6: Lessons */}
      {currentStep >= 4 && lessons.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ✨ Generated Lessons
          </h2>
          <p className="text-gray-600 mb-6">
            {lessons.length} lessons generated for {selectedStrand?.strand_name}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lessons.map((lesson, index) => (
              <Card 
                key={index}
                onClick={() => {
                  setSelectedLesson(lesson)
                  setShowLessonModal(true)
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">
                      {lesson.title || lesson.name}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {lesson.description}
                    </p>
                  </div>
                  <span className="ml-4 text-2xl">📖</span>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-6 flex gap-4 justify-center">
            <ExportButton
              onClick={() => downloadLessonsAsExcel(
                lessons,
                selectedSubject?.name,
                selectedFramework?.name,
                selectedGrade?.name
              )}
              variant="success"
            />
            <Button variant="outline" onClick={() => setCurrentStep(3)}>
              ← Back to Strands
            </Button>
          </div>
        </div>
      )}

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
              if (subjects.length === 0 && context.trim()) {
                handleGenerateSubjects()
              }
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

      {/* Getting Started Guide */}
      {subjects.length === 0 && (
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🚀 Getting Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">1️⃣</div>
              <h3 className="font-bold text-lg mb-2">Set Your Context</h3>
              <p className="text-gray-600 text-sm">
                Define your educational goals and subject areas to help AI generate relevant content.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">2️⃣</div>
              <h3 className="font-bold text-lg mb-2">Navigate the Steps</h3>
              <p className="text-gray-600 text-sm">
                Follow the guided process through subjects, frameworks, grades, and strands.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">3️⃣</div>
              <h3 className="font-bold text-lg mb-2">Generate Lessons</h3>
              <p className="text-gray-600 text-sm">
                Create comprehensive, standards-aligned lesson plans instantly with AI.
              </p>
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  )
}
