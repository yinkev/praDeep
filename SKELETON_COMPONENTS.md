# Skeleton Loading Components

Comprehensive skeleton loading states for praDeep with Liquid Glass aesthetic.

## Overview

The skeleton loading system provides production-ready loading placeholders that match actual content layouts and reduce perceived load time. All components feature a sophisticated shimmer animation that mimics light refraction through glass surfaces.

## Design Philosophy

**Liquid Glass Aesthetic**: Soft, luminous surfaces with subtle motion that creates depth and visual continuity during loading states. The shimmer effect uses a gradient animation that travels across the skeleton surface at a carefully tuned speed (1.25s) with an elegant cubic-bezier timing function.

## Components

### Base Skeleton (`Skeleton.tsx`)

The foundational skeleton component with multiple variants and animation options.

**Props:**
- `className?: string` - Additional CSS classes
- `variant?: 'text' | 'circular' | 'rectangular'` - Shape variant (default: 'rectangular')
- `width?: string | number` - Width in pixels or CSS value
- `height?: string | number` - Height in pixels or CSS value
- `animation?: 'pulse' | 'shimmer' | 'none'` - Animation type (default: 'shimmer')
- `style?: React.CSSProperties` - Additional inline styles

**Usage:**
```tsx
import { Skeleton } from '@/components/ui/Skeleton'

// Basic rectangular skeleton
<Skeleton className="h-12 w-full" />

// Circular avatar placeholder
<Skeleton variant="circular" className="h-16 w-16" />

// Text line placeholder
<Skeleton variant="text" className="w-3/4" />

// Pulse animation instead of shimmer
<Skeleton animation="pulse" className="h-8 w-full" />
```

### Skeleton Card (`SkeletonCard.tsx`)

Reusable card skeleton for content cards, posts, and list items.

**Props:**
- `className?: string` - Additional CSS classes
- `variant?: 'default' | 'compact' | 'detailed'` - Card layout variant
- `showAvatar?: boolean` - Show avatar circle (default: true)
- `showActions?: boolean` - Show action buttons (default: false)
- `lines?: number` - Number of text lines (default: 2)

**Variants:**
- **default**: Standard card with avatar and text lines
- **compact**: Smaller card with inline avatar and text
- **detailed**: Full-featured card with avatar, text, tags, and optional actions

**Usage:**
```tsx
import { SkeletonCard } from '@/components/ui/SkeletonCard'

// Default card
<SkeletonCard />

// Compact card for list items
<SkeletonCard variant="compact" />

// Detailed card with actions
<SkeletonCard variant="detailed" showActions lines={3} />

// Card without avatar
<SkeletonCard showAvatar={false} lines={4} />
```

### Skeleton List (`SkeletonList.tsx`)

List skeleton with multiple rows and configurable layout.

**Props:**
- `className?: string` - Additional CSS classes
- `rows?: number` - Number of list items (default: 5)
- `variant?: 'simple' | 'detailed' | 'compact'` - List item variant
- `showDivider?: boolean` - Show dividers between items (default: false)
- `staggerAnimation?: boolean` - Stagger fade-in animation (default: true)

**Variants:**
- **simple**: Standard list item with avatar, text, and action button
- **compact**: Minimal list item with small avatar and inline layout
- **detailed**: Rich list item with avatar, title, subtitle, body text, and tags

**Usage:**
```tsx
import { SkeletonList } from '@/components/ui/SkeletonList'

// Simple list with 3 rows
<SkeletonList rows={3} />

// Compact list with dividers
<SkeletonList variant="compact" rows={5} showDivider />

// Detailed list for rich content
<SkeletonList variant="detailed" rows={2} />

// Without stagger animation
<SkeletonList staggerAnimation={false} />
```

### Skeleton Text (`SkeletonText.tsx`)

Text block skeleton with configurable lines and typography variants.

**Props:**
- `className?: string` - Additional CSS classes
- `lines?: number` - Number of text lines (default: 3)
- `variant?: 'paragraph' | 'heading' | 'caption' | 'mixed'` - Text layout variant
- `lastLineWidth?: string` - Width of last line (default: '75%')
- `staggerAnimation?: boolean` - Stagger fade-in animation (default: true)

**Variants:**
- **paragraph**: Standard body text with consistent line height
- **heading**: Large heading with subtitle
- **caption**: Small text lines with tight spacing
- **mixed**: Title + subtitle + body paragraph

**Usage:**
```tsx
import { SkeletonText } from '@/components/ui/SkeletonText'

// Paragraph placeholder
<SkeletonText lines={4} />

// Heading placeholder
<SkeletonText variant="heading" />

// Caption text
<SkeletonText variant="caption" lines={2} />

// Mixed content (title + body)
<SkeletonText variant="mixed" lines={5} lastLineWidth="60%" />
```

### Legacy Specialized Skeletons

The base `Skeleton.tsx` also exports pre-built specialized skeletons:

- **EditorSkeleton**: Editor interface with toolbar and content area
- **ChartSkeleton**: Chart placeholder with icon and labels
- **CardSkeleton**: Legacy card skeleton (use `SkeletonCard` for new implementations)

## Animation System

### Shimmer Animation

The shimmer effect uses a gradient that travels horizontally across the skeleton:

```css
bg-gradient-to-r from-surface-elevated via-border-subtle to-surface-elevated
bg-[length:200%_100%]
animate-shimmer
```

**Timing**: 1.25s cubic-bezier(0.16, 1, 0.3, 1) infinite

### Stagger Animation

Components with `staggerAnimation` prop use the `animate-fade-in` animation with progressive delays to create a cascading reveal effect:

```tsx
// Each item delays by 50-75ms
style={{ animationDelay: `${i * 60}ms` }}
```

## Design Tokens

### Colors
- Base: `surface-elevated` (#FFFFFF)
- Shimmer via: `border-subtle` (#F4F4F5)
- Container background: `surface-elevated/40` (40% opacity)
- Border: `border-subtle` (#F4F4F5)

### Glass Effects
- Backdrop blur: `backdrop-blur-sm`
- Layered opacity for depth
- Subtle borders for definition

### Spacing
- Standard padding: `p-4` to `p-6` (16-24px)
- Gap between elements: `gap-3` to `gap-4` (12-16px)
- Line spacing: `space-y-2` to `space-y-3` (8-12px)

## Best Practices

1. **Match Content Layout**: Use skeleton variants that closely match your actual content structure
2. **Consistent Animation**: Use shimmer (default) for most cases; pulse for subtle backgrounds
3. **Stagger for Lists**: Enable `staggerAnimation` for lists to create smooth, progressive loading
4. **Appropriate Line Count**: Match the typical number of lines in your actual content
5. **Show Context**: Include container backgrounds and borders to establish visual hierarchy
6. **Performance**: Skeletons are lightweight; use them generously to improve perceived performance

## Examples

### Article Loading
```tsx
<div className="space-y-6">
  <SkeletonText variant="heading" />
  <SkeletonText lines={6} lastLineWidth="80%" />
  <SkeletonText lines={5} lastLineWidth="65%" />
</div>
```

### Feed Loading
```tsx
<SkeletonList variant="detailed" rows={3} showDivider />
```

### Dashboard Cards
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <SkeletonCard variant="detailed" showActions />
  <SkeletonCard variant="detailed" showActions />
  <SkeletonCard variant="detailed" showActions />
</div>
```

### Comment Thread
```tsx
<div className="space-y-4">
  <SkeletonCard lines={2} />
  <div className="pl-8">
    <SkeletonCard variant="compact" lines={1} />
  </div>
  <SkeletonCard lines={3} />
</div>
```

## Technical Notes

- All components are client components (`'use client'` directive)
- TypeScript with full type safety
- Follows praDeep design system conventions
- Uses `cn` utility from `@/lib/utils` for class merging
- Compatible with Next.js 16 and React 19
- Accessible: skeletons use neutral colors with sufficient contrast

## Integration

To use skeleton components in your pages:

```tsx
'use client'

import { SkeletonCard } from '@/components/ui/SkeletonCard'
import { useState, useEffect } from 'react'

export default function MyPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    fetchData().then(result => {
      setData(result)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <SkeletonCard variant="detailed" />
  }

  return <Card data={data} />
}
```

## Files

- `/web/components/ui/Skeleton.tsx` - Base skeleton component
- `/web/components/ui/SkeletonCard.tsx` - Card skeleton variants
- `/web/components/ui/SkeletonList.tsx` - List skeleton variants
- `/web/components/ui/SkeletonText.tsx` - Text skeleton variants
- `/web/components/ui/skeleton-examples.tsx` - Example usage (demo file)
