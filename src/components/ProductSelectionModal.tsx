import React, { useState } from 'react'
import Modal from './Modal'
import Button from './Button'

interface ProductSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (group: string, subPage: string) => void
  lessonCount: number
}

interface CategoryGroup {
  id: string
  name: string
  color: string
  icon: string
  subPages: Array<{ id: string; name: string }>
}

const categoryGroups: CategoryGroup[] = [
  {
    id: 'group-t',
    name: 'Group T',
    color: 'blue',
    icon: '📘',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `t-${String(i + 1).padStart(2, '0')}`,
      name: `T - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-a',
    name: 'Group A',
    color: 'red',
    icon: '🔴',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `a-${String(i + 1).padStart(2, '0')}`,
      name: `A - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-b',
    name: 'Group B',
    color: 'green',
    icon: '🟢',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `b-${String(i + 1).padStart(2, '0')}`,
      name: `B - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-c',
    name: 'Group C',
    color: 'yellow',
    icon: '🟡',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `c-${String(i + 1).padStart(2, '0')}`,
      name: `C - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-d',
    name: 'Group D',
    color: 'purple',
    icon: '🟣',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `d-${String(i + 1).padStart(2, '0')}`,
      name: `D - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-e',
    name: 'Group E',
    color: 'pink',
    icon: '🎀',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `e-${String(i + 1).padStart(2, '0')}`,
      name: `E - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-f',
    name: 'Group F',
    color: 'orange',
    icon: '🟠',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `f-${String(i + 1).padStart(2, '0')}`,
      name: `F - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-g',
    name: 'Group G',
    color: 'cyan',
    icon: '🔵',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `g-${String(i + 1).padStart(2, '0')}`,
      name: `G - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-h',
    name: 'Group H',
    color: 'teal',
    icon: '💎',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `h-${String(i + 1).padStart(2, '0')}`,
      name: `H - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
  {
    id: 'group-i',
    name: 'Group I',
    color: 'indigo',
    icon: '⭐',
    subPages: Array.from({ length: 11 }, (_, i) => ({
      id: `i-${String(i + 1).padStart(2, '0')}`,
      name: `I - ${String(i + 1).padStart(2, '0')}`,
    })),
  },
]

export default function ProductSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  lessonCount,
}: ProductSelectionModalProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [selectedSubPage, setSelectedSubPage] = useState<string | null>(null)
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)

  const currentGroup = categoryGroups.find((g) => g.id === selectedGroup)

  const handleConfirm = () => {
    if (selectedGroup && selectedSubPage) {
      onConfirm(selectedGroup, selectedSubPage)
      setSelectedGroup(null)
      setSelectedSubPage(null)
      setExpandedGroupId(null)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Product Category & Sub-Page">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          Adding <strong>{lessonCount} lesson(s)</strong> to your product collection. Select a category and sub-page:
        </p>

        {/* Groups List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {categoryGroups.map((group) => (
            <div key={group.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Group Header */}
              <button
                onClick={() => {
                  setSelectedGroup(group.id)
                  setExpandedGroupId(expandedGroupId === group.id ? null : group.id)
                }}
                className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
                  selectedGroup === group.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{group.icon}</span>
                  <span className="font-medium text-gray-900">{group.name}</span>
                  <span className="text-xs text-gray-500">({group.subPages.length} sub-pages)</span>
                </div>
                <span className={`text-gray-400 transition-transform ${expandedGroupId === group.id ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {/* Sub-pages Grid */}
              {expandedGroupId === group.id && selectedGroup === group.id && (
                <div className="bg-gray-50 border-t border-gray-200 p-3">
                  <div className="grid grid-cols-4 gap-2">
                    {group.subPages.map((subPage) => (
                      <button
                        key={subPage.id}
                        onClick={() => setSelectedSubPage(subPage.id)}
                        className={`px-2 py-2 rounded text-xs font-medium transition-colors ${
                          selectedSubPage === subPage.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-900 hover:border-blue-400'
                        }`}
                      >
                        {subPage.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Selection Summary */}
        {selectedGroup && selectedSubPage && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              <strong>Selected:</strong> {currentGroup?.name} &gt; {currentGroup?.subPages.find((sp) => sp.id === selectedSubPage)?.name}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end border-t border-gray-200 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!selectedGroup || !selectedSubPage}>
            Add to Product
          </Button>
        </div>
      </div>
    </Modal>
  )
}
