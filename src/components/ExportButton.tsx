import React from 'react'
import Button from './Button'

interface ExportButtonProps {
  onClick: () => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success'
}

const ExportButton: React.FC<ExportButtonProps> = ({
  onClick,
  disabled = false,
  size = 'md',
  variant = 'success',
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant={variant}
      className={`flex items-center gap-2 ${
        size === 'sm' ? 'text-xs px-2 py-1' : size === 'lg' ? 'text-lg px-6 py-3' : 'text-sm px-4 py-2'
      }`}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M2 12a10 10 0 1020 0 10 10 0 00-20 0z"
        />
      </svg>
      <span>Export to Excel</span>
    </Button>
  )
}

export default ExportButton
