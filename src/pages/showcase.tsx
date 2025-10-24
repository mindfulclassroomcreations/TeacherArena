import React, { useState } from 'react'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Input from '@/components/Input'
import Textarea from '@/components/Textarea'
import Alert from '@/components/Alert'
import Modal from '@/components/Modal'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function ComponentShowcase() {
  const [showModal, setShowModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState<number | null>(null)

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-4">🎨 Component Showcase</h1>
        <p className="text-xl text-purple-100">
          Explore all the UI components available in the AI Lesson Generator
        </p>
      </div>

      {/* Buttons */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Buttons</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="danger">Danger Button</Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button size="sm">Small Button</Button>
              <Button size="md">Medium Button</Button>
              <Button size="lg">Large Button</Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button isLoading>Loading...</Button>
              <Button disabled>Disabled Button</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((num) => (
            <Card
              key={num}
              isSelected={selectedCard === num}
              onClick={() => setSelectedCard(num)}
            >
              <h3 className="font-bold text-lg mb-2">Card {num}</h3>
              <p className="text-gray-600">
                Click to select this card. Cards can be interactive and show selection state.
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Alerts */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Alerts</h2>
        <div className="space-y-4">
          <Alert type="success" message="Operation completed successfully!" />
          <Alert type="error" message="An error occurred. Please try again." />
          <Alert type="warning" message="Warning: This action cannot be undone." />
          <Alert type="info" message="Here's some helpful information for you." />
        </div>
      </section>

      {/* Inputs */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Form Inputs</h2>
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <Input
            label="Text Input"
            placeholder="Enter some text..."
            helperText="This is helper text"
          />
          <Input
            label="Input with Error"
            placeholder="Invalid input"
            error="This field is required"
          />
          <Textarea
            label="Textarea"
            placeholder="Enter multiple lines of text..."
            rows={4}
            helperText="You can write longer content here"
          />
        </div>
      </section>

      {/* Modal */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Modal</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <Button onClick={() => setShowModal(true)}>Open Modal</Button>
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title="Example Modal"
            size="md"
          >
            <div className="space-y-4">
              <p className="text-gray-700">
                This is a modal dialog. You can put any content here including forms,
                images, or other components.
              </p>
              <Input label="Name" placeholder="Enter your name" />
              <Textarea label="Message" placeholder="Enter your message" rows={3} />
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowModal(false)}>
                  Submit
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </section>

      {/* Loading Spinner */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading States</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <LoadingSpinner size="sm" text="Small" />
            </div>
            <div className="text-center">
              <LoadingSpinner size="md" text="Medium" />
            </div>
            <div className="text-center">
              <LoadingSpinner size="lg" text="Large" />
            </div>
          </div>
        </div>
      </section>

      {/* Color Palette */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Color Palette</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <div className="h-20 bg-blue-600 rounded-lg mb-2"></div>
              <p className="text-sm text-center font-medium">Primary Blue</p>
            </div>
            <div>
              <div className="h-20 bg-green-500 rounded-lg mb-2"></div>
              <p className="text-sm text-center font-medium">Success Green</p>
            </div>
            <div>
              <div className="h-20 bg-red-500 rounded-lg mb-2"></div>
              <p className="text-sm text-center font-medium">Error Red</p>
            </div>
            <div>
              <div className="h-20 bg-yellow-500 rounded-lg mb-2"></div>
              <p className="text-sm text-center font-medium">Warning Yellow</p>
            </div>
            <div>
              <div className="h-20 bg-gray-600 rounded-lg mb-2"></div>
              <p className="text-sm text-center font-medium">Neutral Gray</p>
            </div>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Typography</h2>
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Heading 1</h1>
          <h2 className="text-3xl font-bold text-gray-900">Heading 2</h2>
          <h3 className="text-2xl font-bold text-gray-900">Heading 3</h3>
          <h4 className="text-xl font-bold text-gray-900">Heading 4</h4>
          <p className="text-base text-gray-700">
            This is regular paragraph text. It uses a comfortable font size and line height
            for optimal readability.
          </p>
          <p className="text-sm text-gray-600">
            This is small text, often used for helper text or secondary information.
          </p>
        </div>
      </section>
    </div>
  )
}
