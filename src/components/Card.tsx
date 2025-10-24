import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  isSelected?: boolean
  hoverable?: boolean
}

export default function Card({ 
  children, 
  className = '', 
  onClick, 
  isSelected = false,
  hoverable = true 
}: CardProps) {
  const baseStyles = 'bg-white rounded-lg shadow-md p-6 transition-all duration-200'
  const hoverStyles = hoverable ? 'hover:shadow-lg' : ''
  const clickableStyles = onClick ? 'cursor-pointer' : ''
  const selectedStyles = isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''

  return (
    <div
      className={`${baseStyles} ${hoverStyles} ${clickableStyles} ${selectedStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
