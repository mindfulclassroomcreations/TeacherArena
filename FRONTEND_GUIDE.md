# AI Lesson Generator - Frontend Documentation

## 🎨 Frontend Architecture

The frontend is built with **Next.js 14**, **React 18**, **TypeScript**, and **Tailwind CSS**, providing a modern, type-safe, and responsive user interface.

## 📁 Component Structure

### Core Components

#### **Layout.tsx**
Main layout wrapper with navigation bar and footer.
- Sticky header with branding
- GitHub link
- Version display
- Footer with links

#### **Button.tsx**
Reusable button component with multiple variants.
- **Variants**: primary, secondary, outline, danger
- **Sizes**: sm, md, lg
- **Loading state** with spinner animation
- **Disabled state** support

#### **Card.tsx**
Container component for content display.
- **Selectable** state with visual feedback
- **Hoverable** animation effects
- **Click handlers** support
- Consistent shadow and border styling

#### **Input.tsx**
Form input field with label and validation.
- **Label** support
- **Error** state with red styling
- **Helper text** for guidance
- Full accessibility support

#### **Textarea.tsx**
Multi-line text input component.
- Same features as Input
- **Resizable** option
- **Rows** configuration

#### **Alert.tsx**
Notification component for user feedback.
- **Types**: success, error, warning, info
- **Dismissible** with close button
- Color-coded styling
- Icon indicators

#### **Modal.tsx**
Overlay dialog for detailed interactions.
- **Sizes**: sm, md, lg, xl
- **Backdrop** click to close
- **Escape key** to close
- Body scroll lock when open
- Smooth transitions

#### **SelectionStep.tsx**
Reusable step component for multi-step workflows.
- **Item grid** display
- **Selection** highlighting
- **Generation** button
- **Empty state** with call-to-action

#### **ProgressIndicator.tsx**
Visual progress tracker for multi-step processes.
- **Step numbering**
- **Completion** checkmarks
- **Active state** highlighting
- **Connection lines** between steps

#### **LoadingSpinner.tsx**
Loading state indicator.
- **Multiple sizes**
- **Optional text** label
- Smooth rotation animation

## 🎯 Main Page Features

### Multi-Step Curriculum Builder

The main page (`src/pages/index.tsx`) implements a complete curriculum generation workflow:

#### **Step 1: Subject Selection**
- Generate subjects based on context
- AI-powered subject suggestions
- Select from generated subjects
- Contextual descriptions

#### **Step 2: Framework Selection**
- Generate frameworks for selected subject
- Standards-aligned options
- Framework descriptions

#### **Step 3: Grade Selection**
- Generate grade levels
- Individual grades (K-12)
- Grade-specific content

#### **Step 4: Strand Discovery**
- Analyze curriculum structure
- Identify major strands/domains
- Set target lesson counts
- Display key topics and standards

#### **Step 5: Lesson Generation**
- Generate lessons per strand
- Detailed lesson descriptions
- Performance expectations
- Standards alignment

### State Management

The application uses React hooks for state management:

```typescript
// Selection state
const [selectedSubject, setSelectedSubject] = useState<Item | null>(null)
const [selectedFramework, setSelectedFramework] = useState<Item | null>(null)
const [selectedGrade, setSelectedGrade] = useState<Item | null>(null)

// Generated content
const [subjects, setSubjects] = useState<Item[]>([])
const [frameworks, setFrameworks] = useState<Item[]>([])
const [grades, setGrades] = useState<Item[]>([])
const [strands, setStrands] = useState<Strand[]>([])
const [lessons, setLessons] = useState<Item[]>([])

// UI state
const [currentStep, setCurrentStep] = useState(0)
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
const [success, setSuccess] = useState<string | null>(null)
```

## 🎨 Styling

### Tailwind CSS Configuration

The project uses Tailwind CSS with custom configuration:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### Global Styles

Custom animations and utilities in `src/styles/globals.css`:

- **Smooth scrolling**
- **Fade-in animation**
- **Line clamp utilities**
- **Custom scrollbar** styling

### Color Palette

- **Primary**: Blue (blue-600, blue-700)
- **Success**: Green (green-500, green-600)
- **Error**: Red (red-500, red-600)
- **Warning**: Yellow (yellow-500, yellow-600)
- **Info**: Blue (blue-500, blue-600)
- **Neutral**: Gray scale (50-900)

## 🔌 API Integration

### Custom Hook: `useAIGeneration`

Located in `src/hooks/useAIGeneration.ts`:

```typescript
const { isLoading, error, success, generate } = useAIGeneration()

// Usage
const response = await generate({
  type: 'subjects',
  context: 'Elementary STEM education'
})
```

### API Client

The `src/lib/api.ts` file provides axios-based API functions:

```typescript
import { generateContent } from '@/lib/api'

// Generate subjects
const response = await generateContent({
  type: 'subjects',
  context: 'Your context here'
})

// Generate frameworks
const response = await generateContent({
  type: 'frameworks',
  subject: 'Science',
  context: 'Additional context'
})
```

## 📱 Responsive Design

The UI is fully responsive with breakpoints:

- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md, lg)
- **Desktop**: > 1024px (xl, 2xl)

### Responsive Patterns

```tsx
// Grid layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>

// Conditional text size
<h1 className="text-2xl md:text-3xl lg:text-4xl">Title</h1>

// Responsive padding
<div className="px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

## 🎭 User Experience Features

### Visual Feedback
- **Loading states** with spinners
- **Success/error** notifications
- **Hover effects** on interactive elements
- **Selection highlighting**
- **Progress indicators**

### Accessibility
- **Semantic HTML** structure
- **ARIA labels** where needed
- **Keyboard navigation** support
- **Focus states** for all interactive elements
- **Screen reader** friendly

### Performance
- **Lazy loading** of components
- **Optimized re-renders** with React memos
- **Debounced** API calls
- **Efficient state updates**

## 🚀 Running the Frontend

### Development Mode

```bash
npm run dev
```

Visit `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

### Type Checking

```bash
npm run type-check
```

## 🔧 Customization

### Adding New Components

1. Create file in `src/components/`
2. Use TypeScript for props
3. Export as default
4. Import in pages or other components

Example:
```tsx
// src/components/MyComponent.tsx
import React from 'react'

interface MyComponentProps {
  title: string
  children: React.ReactNode
}

export default function MyComponent({ title, children }: MyComponentProps) {
  return (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  )
}
```

### Adding New Pages

Create files in `src/pages/`:
- `about.tsx` → `/about`
- `docs.tsx` → `/docs`
- `help.tsx` → `/help`

### Styling Tips

1. **Use Tailwind classes** for consistency
2. **Extract repeated patterns** into components
3. **Use CSS modules** for complex styles
4. **Follow responsive-first** approach

## 📚 Best Practices

1. **Component Size**: Keep components under 300 lines
2. **Props Interface**: Always define TypeScript interfaces
3. **Error Handling**: Wrap API calls in try-catch
4. **Loading States**: Show loading indicators for async operations
5. **Validation**: Validate user input before API calls
6. **Accessibility**: Test with keyboard navigation
7. **Responsive**: Test on multiple screen sizes

## 🐛 Common Issues

### Issue: Tailwind classes not working
**Solution**: Ensure PostCSS and Tailwind are configured correctly

### Issue: API calls failing
**Solution**: Check `.env.local` for correct API keys

### Issue: TypeScript errors
**Solution**: Run `npm run type-check` to identify issues

### Issue: Styles not updating
**Solution**: Clear Next.js cache: `rm -rf .next`

## 📖 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
