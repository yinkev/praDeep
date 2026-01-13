# Carousel Component - ChatGPT Style

## Overview
A production-ready carousel component with Liquid Glass aesthetic, featuring smooth animations, touch gestures, keyboard navigation, and responsive behavior.

## Features

### Core Functionality
- ✓ Horizontal scrolling with 3-8 items visible
- ✓ Navigation arrows (auto-hide when not needed)
- ✓ Touch/swipe gestures using Framer Motion
- ✓ Keyboard navigation (←, →, Home, End)
- ✓ Snap-to-item scrolling
- ✓ Responsive breakpoints
- ✓ Progress indicator dots

### Design
- Liquid Glass aesthetic matching Card.tsx
- Fast animations (120-200ms with cubic-bezier)
- Auto-hiding arrows on hover
- Staggered entrance animations for items
- Focus management for accessibility

## Usage

### Basic Example
```tsx
import { Carousel, Card } from '@/components/ui'

export function GameCarousel() {
  const games = [
    { id: 1, title: 'Chess', description: 'Strategy game' },
    { id: 2, title: 'Code Quest', description: 'Learn coding' },
    // ... more items
  ]

  return (
    <Carousel
      ariaLabel="Featured games"
      itemsPerView={{
        mobile: 1.2,
        tablet: 2.5,
        desktop: 3.5,
      }}
      gap={16}
    >
      {games.map(game => (
        <Card key={game.id} variant="glass" interactive>
          <h3>{game.title}</h3>
          <p>{game.description}</p>
        </Card>
      ))}
    </Carousel>
  )
}
```

### Controlled Example
```tsx
import { useState } from 'react'
import { Carousel, Card } from '@/components/ui'

export function ControlledCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  return (
    <Carousel
      currentIndex={currentIndex}
      onIndexChange={setCurrentIndex}
      snapToItems
    >
      {items.map(item => (
        <Card key={item.id}>{item.content}</Card>
      ))}
    </Carousel>
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | required | Items to display in carousel |
| `itemsPerView` | `{ mobile?, tablet?, desktop? }` | `{ mobile: 1.2, tablet: 2.5, desktop: 3.5 }` | Items visible at once |
| `gap` | `number` | `16` | Gap between items (px) |
| `showArrows` | `boolean` | `true` | Show navigation arrows |
| `enableDrag` | `boolean` | `true` | Enable drag/swipe |
| `snapToItems` | `boolean` | `true` | Snap to items when scrolling |
| `currentIndex` | `number` | undefined | Controlled index |
| `onIndexChange` | `(index: number) => void` | undefined | Index change callback |
| `ariaLabel` | `string` | `'Carousel'` | Accessibility label |
| `className` | `string` | undefined | Additional classes |

## Responsive Behavior

The carousel automatically adjusts visible items based on screen width:

- **Mobile (< 640px)**: Shows `itemsPerView.mobile` items (default: 1.2)
- **Tablet (640px - 1024px)**: Shows `itemsPerView.tablet` items (default: 2.5)
- **Desktop (≥ 1024px)**: Shows `itemsPerView.desktop` items (default: 3.5)

## Keyboard Navigation

- **Arrow Left**: Scroll to previous item
- **Arrow Right**: Scroll to next item
- **Home**: Jump to first item
- **End**: Jump to last item
- **Tab**: Focus navigation arrows

## Accessibility

- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader friendly
- Progress indicator with current state

## Design Tokens

The carousel uses these Tailwind classes from the design system:

```css
/* Glass morphism */
bg-white/70 dark:bg-zinc-950/70
backdrop-blur-md
border-border/50 dark:border-border/30
shadow-sm dark:shadow-zinc-950/40

/* Animations */
duration-[150ms]
transition-timing-function: cubic-bezier(0.2,0.8,0.2,1)

/* Border radius */
rounded-2xl (container)
rounded-xl (buttons)
```

## Performance

- ResizeObserver for efficient dimension updates
- Passive scroll listeners
- Optimized Framer Motion animations
- Reduced motion support
- Staggered item animations with 50ms delay

## Browser Support

- Modern browsers with Intersection Observer API
- Touch events for mobile
- Pointer events fallback
- Graceful degradation for older browsers

## Build Status

✅ Build verified successfully
✅ TypeScript compilation passed
✅ No type errors in component
✅ Exported from `@/components/ui`
