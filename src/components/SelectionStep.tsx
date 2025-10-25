import React from 'react'
import Card from './Card'
import Button from './Button'

interface Item {
  id?: string
  name: string
  title?: string
  description: string
}

interface SelectionStepProps {
  title: string
  description: string
  items: Item[]
  selectedItem: Item | null
  onSelect: (item: Item) => void
  onGenerate: () => void
  isLoading: boolean
  generateButtonText: string
  emptyStateText: string
}

export default function SelectionStep({
  title,
  description,
  items,
  selectedItem,
  onSelect,
  onGenerate,
  isLoading,
  generateButtonText,
  emptyStateText
}: SelectionStepProps) {
  return (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">{emptyStateText}</p>
          <Button onClick={onGenerate} isLoading={isLoading} variant="primary">
            {generateButtonText}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {items.map((item, index) => (
              <Card
                key={item.id || index}
                isSelected={selectedItem?.name === item.name}
                onClick={() => onSelect(item)}
              >
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  {item.title || item.name}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-3">
                  {item.description}
                </p>
              </Card>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={onGenerate} isLoading={isLoading} variant="primary">
              {generateButtonText}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
