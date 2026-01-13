# Visual Diff Components for AI Outputs

Notion-style transparency components for displaying AI-generated content with visual diffs, following 2026 Liquid Glass aesthetic principles.

## Components Overview

### 1. DiffViewer
Main container for displaying content differences with "before → after" visualization.

**Location:** `web/components/ui/DiffViewer.tsx`

**Features:**
- Inline or split view modes
- Optional line numbers
- Liquid glass aesthetic with backdrop blur
- Fast animations (120-200ms) with fluid easing [0.2, 0.8, 0.2, 1]
- Dark mode support

**Usage:**
```tsx
import { DiffViewer, Deletion, Addition } from '@/components/ui/DiffViewer'

// Inline mode
<DiffViewer mode="inline">
  <p>
    The <Deletion>original text</Deletion> <Addition>improved text</Addition>
  </p>
</DiffViewer>

// Split mode
<DiffViewer mode="split" showLineNumbers={true}>
  {/* Content appears in both before/after columns */}
</DiffViewer>
```

**Props:**
- `children: ReactNode` - Content to display
- `mode?: 'inline' | 'split'` - Display mode (default: 'inline')
- `showLineNumbers?: boolean` - Show line numbers (default: false)
- `className?: string` - Additional CSS classes

### 2. Deletion & Addition
Subcomponents for marking deleted and added content.

**Deletion:**
- Gray text with line-through decoration
- 50% opacity
- Red accent color
- Subtle glow effect

**Addition:**
- Blue highlight background (bg-blue-50)
- Bold text
- Gradient backdrop with blur
- Blue glow effect

**Usage:**
```tsx
<Deletion>Old content</Deletion>
<Addition>New AI-generated content</Addition>

// With line numbers
<Deletion lineNumber={1}>Old line 1</Deletion>
<Addition lineNumber={2}>New line 2</Addition>
```

### 3. CodeDiff
Specialized component for code diffs with syntax highlighting support.

**Usage:**
```tsx
import { CodeDiff } from '@/components/ui/DiffViewer'

<CodeDiff
  before={[
    'function calculate(x, y) {',
    '  return x + y;',
    '}'
  ]}
  after={[
    'function calculateSum(x: number, y: number): number {',
    '  const result = x + y;',
    '  return result;',
    '}'
  ]}
  showLineNumbers={true}
  language="typescript"
/>
```

**Props:**
- `before: string[]` - Array of lines (before)
- `after: string[]` - Array of lines (after)
- `showLineNumbers?: boolean` - Show line numbers (default: true)
- `language?: string` - Programming language hint

---

## AI Content Highlighting

### 1. AIContentHighlight
Highlight AI-generated content blocks with badge and glow effects.

**Location:** `web/components/ui/AIContentHighlight.tsx`

**Features:**
- Three variants: default, subtle, prominent
- Optional AI badge with Sparkles icon
- Animated glow on hover
- Liquid glass backdrop
- Metadata support

**Usage:**
```tsx
import { AIContentHighlight } from '@/components/ui/AIContentHighlight'

// Default variant with badge
<AIContentHighlight variant="default">
  <p>AI-generated content here</p>
</AIContentHighlight>

// Subtle variant without badge
<AIContentHighlight variant="subtle" showBadge={false}>
  <p>Subtle AI suggestion</p>
</AIContentHighlight>

// Prominent for important content
<AIContentHighlight variant="prominent">
  <p>Important AI-generated content</p>
</AIContentHighlight>
```

**Props:**
- `children: ReactNode` - Content to highlight
- `variant?: 'default' | 'subtle' | 'prominent'` - Visual style (default: 'default')
- `showBadge?: boolean` - Show AI badge (default: true)
- `animated?: boolean` - Enable animations (default: true)
- `className?: string` - Additional CSS classes
- `onHoverChange?: (isHovering: boolean) => void` - Hover state callback

### 2. AIInlineHighlight
Inline text highlighting for AI-generated phrases within regular text.

**Usage:**
```tsx
import { AIInlineHighlight } from '@/components/ui/AIContentHighlight'

<p>
  This is regular text with{' '}
  <AIInlineHighlight>AI-generated content</AIInlineHighlight>{' '}
  inline.
</p>
```

**Props:**
- `children: ReactNode` - Text to highlight
- `className?: string` - Additional CSS classes

### 3. AIModification
Display AI modifications with timestamp and model information.

**Usage:**
```tsx
import { AIModification } from '@/components/ui/AIContentHighlight'

<AIModification
  timestamp={new Date()}
  modelName="Claude Sonnet 4.5"
>
  <p>Modified content here</p>
</AIModification>
```

**Props:**
- `children: ReactNode` - Modified content
- `timestamp?: Date | string` - When modification occurred
- `modelName?: string` - AI model name (default: 'AI')
- `className?: string` - Additional CSS classes

---

## Accept/Reject Controls

### 1. AcceptRejectControls
Interactive buttons for accepting or rejecting AI suggestions.

**Location:** `web/components/AcceptRejectControls.tsx`

**Features:**
- Accept (green), Reject (red), Revert (gray) buttons
- Optional preview toggle
- Three layout modes: horizontal, vertical, compact
- Animated with hover/tap effects
- Glow effects on interaction

**Usage:**
```tsx
import { AcceptRejectControls } from '@/components/AcceptRejectControls'

<AcceptRejectControls
  onAccept={() => console.log('Accepted')}
  onReject={() => console.log('Rejected')}
  onRevert={() => console.log('Reverted')}
  layout="horizontal"
/>

// With preview toggle
<AcceptRejectControls
  onAccept={() => {}}
  onReject={() => {}}
  showPreview={true}
  isPreviewEnabled={previewState}
  onTogglePreview={() => setPreviewState(!previewState)}
/>

// Compact layout for inline use
<AcceptRejectControls
  onAccept={() => {}}
  onReject={() => {}}
  layout="compact"
/>
```

**Props:**
- `onAccept?: () => void` - Accept callback
- `onReject?: () => void` - Reject callback
- `onRevert?: () => void` - Revert callback (optional)
- `showPreview?: boolean` - Show preview toggle (default: false)
- `isPreviewEnabled?: boolean` - Preview state (default: false)
- `onTogglePreview?: () => void` - Preview toggle callback
- `disabled?: boolean` - Disable all buttons (default: false)
- `layout?: 'horizontal' | 'vertical' | 'compact'` - Layout mode (default: 'horizontal')
- `className?: string` - Additional CSS classes

### 2. InlineAcceptReject
Compact circular buttons for inline accept/reject actions.

**Usage:**
```tsx
import { InlineAcceptReject } from '@/components/AcceptRejectControls'

<InlineAcceptReject
  onAccept={() => console.log('Accepted')}
  onReject={() => console.log('Rejected')}
/>
```

**Props:**
- `onAccept?: () => void` - Accept callback
- `onReject?: () => void` - Reject callback
- `disabled?: boolean` - Disable buttons (default: false)
- `className?: string` - Additional CSS classes

---

## Design Principles

### Liquid Glass Aesthetic
- **Backdrop blur:** `backdrop-blur-sm` and `backdrop-blur-[2px]`
- **Gradients:** Multi-stop gradients for depth
- **Layered glows:** Subtle blur effects for luminosity
- **Transparency:** Opacity variations for glass effect

### Animation Timing
- **Duration:** 120-200ms for most transitions
- **Easing:** `[0.2, 0.8, 0.2, 1]` - fluid, natural motion
- **Stagger:** 40ms delay between sequential elements
- **Hover:** Faster transitions (120ms) for responsiveness

### Color Palette
- **Additions/AI:** Blue (blue-50 to blue-600)
- **Deletions:** Red (red-400 to red-600)
- **Accept:** Green (emerald-500 to green-600)
- **Reject:** Red (red-500 to rose-600)
- **Neutral:** Slate (slate-200 to slate-800)

### Accessibility
- **ARIA labels:** All icon buttons have labels
- **Color contrast:** WCAG AA compliant
- **Keyboard navigation:** Full support
- **Screen readers:** Proper semantic markup

---

## Demo Page

View all components in action at `/diff-demo`:

```bash
# Start the dev server
npm run dev

# Navigate to:
http://localhost:3783/diff-demo
```

The demo showcases:
- Inline and split diff views
- Code diffs with line numbers
- AI content highlighting (all variants)
- Inline AI highlights
- Accept/Reject controls (all layouts)
- Interactive state management
- Dark mode support

---

## Integration Examples

### Complete Workflow
```tsx
import { useState } from 'react'
import { DiffViewer, Deletion, Addition } from '@/components/ui/DiffViewer'
import { AcceptRejectControls } from '@/components/AcceptRejectControls'

function AIEditSuggestion() {
  const [status, setStatus] = useState<'pending' | 'accepted' | 'rejected'>('pending')

  return (
    <div>
      <DiffViewer mode="inline">
        <p>
          <Deletion>Original sentence</Deletion>{' '}
          <Addition>AI-improved sentence</Addition>
        </p>
      </DiffViewer>

      {status === 'pending' && (
        <AcceptRejectControls
          onAccept={() => setStatus('accepted')}
          onReject={() => setStatus('rejected')}
        />
      )}

      {status !== 'pending' && (
        <div>Changes {status}!</div>
      )}
    </div>
  )
}
```

### With Metadata
```tsx
import { AIModification } from '@/components/ui/AIContentHighlight'
import { AcceptRejectControls } from '@/components/AcceptRejectControls'

function AIGeneratedContent() {
  return (
    <>
      <AIModification
        timestamp={new Date()}
        modelName="Claude Sonnet 4.5"
      >
        <p>AI-generated content with context</p>
      </AIModification>

      <AcceptRejectControls
        onAccept={() => {}}
        onReject={() => {}}
        showPreview={true}
      />
    </>
  )
}
```

---

## Technical Stack

- **Framework:** Next.js 16 + React 19
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **TypeScript:** Full type safety

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with backdrop-filter support

## Performance

- **Bundle size:** ~8KB gzipped (all components)
- **Animation:** GPU-accelerated transforms
- **Renders:** Optimized with React.memo where appropriate
- **SSR compatible:** All components work with Next.js SSR
