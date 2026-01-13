# Diff Viewer Component

**Location:** `web/components/ui/DiffViewer.tsx`

**Status:** ✅ Production Ready

The Diff Viewer is a specialized component for displaying code changes, revisions, and textual differences with semantic coloring and visual clarity. It supports both inline and split-view modes with fluid animations.

---

## Purpose & Use Cases

### Primary Purpose
Display before/after changes with clear visual distinction between additions, deletions, and unchanged content.

### When to Use
- **Code Reviews:** Show diffs of code changes
- **Version History:** Display revision changes
- **Content Changes:** Show edits to documents or articles
- **Configuration Updates:** Highlight config file modifications
- **Database Changes:** Visualize data transformations
- **API Response Comparisons:** Show how outputs changed

### When NOT to Use
- **Large Diffs (1000+ lines):** Use virtualization instead
- **Real-time Editing:** Use purpose-built editors
- **Simple Text Replacements:** Use badges or highlights
- **Purely Visual Comparisons:** Use image diff tools

---

## Component API

### Main DiffViewer Component

```typescript
interface DiffViewerProps {
  /** Content to display (additions/deletions as children) */
  children: ReactNode

  /** Display mode: inline (default) or split-view */
  mode?: 'inline' | 'split'

  /** Show line numbers alongside code (default: false) */
  showLineNumbers?: boolean

  /** Additional CSS classes */
  className?: string
}
```

#### Prop Details

**`children: ReactNode`** (Required)
- Content to render inside the diff viewer
- Should contain `Addition` and `Deletion` components
- Can include plain text or other elements
- All children are animated on mount

**`mode?: 'inline' | 'split'`** (Optional)
- **'inline'** (default): Changes shown sequentially
- **'split'**: Before/after shown side-by-side
- Choose based on content length and screen size
- Split mode requires wider screens (900px+ recommended)

**`showLineNumbers?: boolean`** (Optional)
- Display line numbers to the left of content
- Default: `false`
- Useful for code diffs
- Automatically positioned with `absolute` positioning
- Adjust padding: `pl-16` added when enabled

**`className?: string`** (Optional)
- Additional Tailwind classes
- Applied to the container
- Example: `className="my-4 max-w-lg"`
- Useful for custom sizing or spacing

### Addition Component

```typescript
interface AdditionProps {
  /** Text or content added */
  children: ReactNode

  /** Optional line number for context */
  lineNumber?: number
}
```

Renders added content with blue highlight and shimmer effect:
- Background: `rgba(219, 234, 254, 0.4)` (light blue with glass effect)
- Text Color: `text-blue-700 dark:text-blue-300`
- Animation: Slides in from left with fade
- Glow Effect: Subtle blue glow behind text

### Deletion Component

```typescript
interface DeletionProps {
  /** Text or content removed */
  children: ReactNode

  /** Optional line number for context */
  lineNumber?: number
}
```

Renders removed content with red strikethrough:
- Text Color: `text-red-600/70 dark:text-red-400/70`
- Decoration: `line-through decoration-red-500/40`
- Opacity: `50%` for visual de-emphasis
- Glow Effect: Subtle red glow behind text

### CodeDiff Component

```typescript
interface CodeDiffProps {
  /** Array of lines from "before" version */
  before: string[]

  /** Array of lines from "after" version */
  after: string[]

  /** Show line numbers (default: true) */
  showLineNumbers?: boolean

  /** Programming language for syntax highlighting (optional) */
  language?: string
}
```

Convenience component for code diffs:
- Automatically creates split-view layout
- Wraps each line in `Deletion`/`Addition` components
- Includes line numbers by default
- Returns `DiffViewer` with `mode="split"`

---

## Visual Design

### Container Styling

All diff viewers share a consistent container style:

```typescript
// Base classes
'relative rounded-xl border border-slate-200/50 dark:border-slate-700/50'
'bg-gradient-to-br from-slate-50/80 to-white/60 dark:from-slate-900/80 dark:to-slate-800/60'
'backdrop-blur-sm shadow-sm shadow-slate-200/50 dark:shadow-slate-900/50'
'p-6 font-mono text-sm leading-relaxed'
'transition-all duration-200'
'hover:shadow-md hover:shadow-slate-200/70 dark:hover:shadow-slate-900/70'
```

**Effects:**
- Rounded corners: `rounded-xl` (12px radius)
- Liquid glass: `backdrop-blur-sm` with gradient background
- Borders: Subtle slate with reduced opacity in dark mode
- Shadows: Responsive to hover state
- Padding: `p-6` (24px) inside and outside
- Typography: Monospace font for code readability

### Mode-Specific Styling

#### Inline Mode (Default)

```typescript
<div className="space-y-1.5">
  {children}
</div>
```

**Layout:**
- Content flows vertically
- Changes shown one after another
- Compact for small diffs
- Better for mobile/narrow screens
- Each change gets its own line

#### Split Mode

```typescript
<div className="grid grid-cols-2 gap-6">
  <div className="space-y-2 pr-3 border-r border-slate-200 dark:border-slate-700">
    <div className="text-xs uppercase tracking-wider text-red-500/70 font-sans font-semibold mb-3">
      Before
    </div>
    {children}
  </div>
  <div className="space-y-2 pl-3">
    <div className="text-xs uppercase tracking-wider text-blue-500/70 font-sans font-semibold mb-3">
      After
    </div>
    {children}
  </div>
</div>
```

**Layout:**
- Side-by-side comparison
- Headers: "Before" (red) and "After" (blue)
- Vertical divider between columns
- Best for wide screens (900px+)
- Easier to compare corresponding lines

### Addition Styling

```typescript
// Container
<span className="relative inline-block px-1 -mx-1 rounded-sm">
  {/* Main text */}
  <span className="relative z-10 text-blue-700 dark:text-blue-300 font-medium">
    {children}
  </span>

  {/* Liquid glass backdrop */}
  <span className="absolute inset-0 bg-gradient-to-br from-blue-100/60 to-blue-50/40 dark:from-blue-500/20 dark:to-blue-600/10 rounded-sm backdrop-blur-[2px] -z-10" />

  {/* Subtle glow */}
  <span className="absolute inset-0 blur-[6px] bg-blue-400/10 -z-20" />
</span>
```

**Visual Details:**
- Background: Gradient from brighter to more subtle blue
- Text: Bold and dark blue
- Backdrop: Slight blur for glass effect
- Glow: Soft blue glow extending beyond text
- Padding: `-mx-1` creates visual breathing room

### Deletion Styling

```typescript
// Container
<span className="relative inline-block">
  {/* Main text with strikethrough */}
  <span className="relative z-10 line-through decoration-red-500/40 decoration-1">
    {children}
  </span>

  {/* Subtle glow effect */}
  <span className="absolute inset-0 blur-[8px] bg-red-500/5 -z-10" />
</span>
```

**Visual Details:**
- Text: Red with strikethrough
- Strikethrough: Subtle red with reduced opacity
- Opacity: 50% overall for visual de-emphasis
- Glow: Very subtle red glow
- Effect: Indicates removal without harshness

### Line Numbers

Optional line numbers appear to the left:

```typescript
{lineNumber !== undefined && (
  <span className="absolute -left-12 top-0 text-xs text-blue-500/60 font-mono tabular-nums select-none">
    {lineNumber}
  </span>
)}
```

**Styling:**
- Color: Blue for additions, red for deletions, gray for context
- Opacity: Reduced (`/60`) for de-emphasis
- Font: Monospace with tabular numbers
- Position: Absolutely positioned to left
- Selection: `select-none` to prevent copying line numbers
- Width: Reserved space with `pl-16` on container

---

## Animations

### Diff Animation Entry

```typescript
const diffVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -8,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.18,
      ease: [0.2, 0.8, 0.2, 1], // fluid easing
    },
  },
}
```

Applied to the entire DiffViewer container.

### Addition Animation

```typescript
const additionVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -6,
    backgroundColor: 'rgba(219, 234, 254, 0)',
  },
  visible: {
    opacity: 1,
    x: 0,
    backgroundColor: 'rgba(219, 234, 254, 0.4)',
    transition: {
      duration: 0.2,
      ease: [0.2, 0.8, 0.2, 1],
    },
  },
}
```

**Effect:**
- Content slides in from left
- Background color fades in
- Smooth 200ms entrance
- Creates visual pop

### Deletion Animation

```typescript
const deletionVariants: Variants = {
  hidden: {
    opacity: 0,
    scaleX: 0.95,
    filter: 'blur(2px)',
  },
  visible: {
    opacity: 0.5,
    scaleX: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.15,
      ease: [0.2, 0.8, 0.2, 1],
    },
  },
}
```

**Effect:**
- Content scales in horizontally
- Blur effect clears
- 150ms entrance (slightly faster than additions)
- Subtle and non-distracting

### Easing

All animations use the same fluid easing curve for consistency:

```typescript
const fluidEasing = [0.2, 0.8, 0.2, 1] as const
// Equivalent to: cubic-bezier(0.2, 0.8, 0.2, 1)
```

This creates a natural, smooth feel that matches the praDeep design aesthetic.

---

## Usage Examples

### Basic Inline Diff

```tsx
import { DiffViewer, Addition, Deletion } from '@/components/ui/DiffViewer'

export function BasicDiff() {
  return (
    <DiffViewer>
      <Deletion>const userName = 'john'</Deletion>
      <Addition>const userName = 'john_doe'</Addition>
    </DiffViewer>
  )
}
```

### Inline Diff with Context

```tsx
export function InlineWithContext() {
  return (
    <DiffViewer mode="inline" showLineNumbers={true}>
      <div>const config = {'{'}</div>
      <div>
        <Deletion lineNumber={2}>apiKey: 'old_key_123',</Deletion>
        <Addition lineNumber={2}>apiKey: process.env.API_KEY,</Addition>
      </div>
      <div>{'}'}</div>
    </DiffViewer>
  )
}
```

### Split-View Code Diff

```tsx
export function SplitCodeDiff() {
  const before = [
    'function add(a, b) {',
    '  return a + b',
    '}',
  ]

  const after = [
    'function add(a, b) {',
    '  // Add two numbers',
    '  return a + b',
    '}',
  ]

  return <CodeDiff before={before} after={after} language="javascript" />
}
```

### Diff with Line Numbers

```tsx
export function DiffWithLineNumbers() {
  return (
    <DiffViewer mode="inline" showLineNumbers={true}>
      <div className="relative">
        <span className="absolute -left-12 text-xs text-slate-400 font-mono tabular-nums">1</span>
        <Deletion>old_value</Deletion>
      </div>
      <div className="relative">
        <span className="absolute -left-12 text-xs text-slate-400 font-mono tabular-nums">1</span>
        <Addition>new_value</Addition>
      </div>
    </DiffViewer>
  )
}
```

### Large Code Diff

```tsx
export function LargeCodeDiff() {
  const before = [
    'class User {',
    '  constructor(name, email) {',
    '    this.name = name',
    '    this.email = email',
    '  }',
    '}',
  ]

  const after = [
    'class User {',
    '  constructor(name, email, phone) {',
    '    this.name = name',
    '    this.email = email',
    '    this.phone = phone',
    '  }',
    '}',
  ]

  return (
    <CodeDiff
      before={before}
      after={after}
      showLineNumbers={true}
      language="javascript"
    />
  )
}
```

### Diff in a Modal

```tsx
export function DiffModal({ isOpen, onClose }) {
  return isOpen ? (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-2xl max-h-[80vh] overflow-auto">
        <h2 className="text-2xl font-bold mb-4">Changes</h2>
        <CodeDiff
          before={['const x = 1']}
          after={['const x = 2']}
          showLineNumbers={true}
        />
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
          Close
        </button>
      </div>
    </div>
  ) : null
}
```

### Multi-File Diff View

```tsx
export function MultiFileDiff({ changes }) {
  return (
    <div className="space-y-6">
      {changes.map((file) => (
        <div key={file.id}>
          <h3 className="text-lg font-semibold mb-3">{file.path}</h3>
          <DiffViewer mode={file.largeChange ? 'inline' : 'split'}>
            {file.additions.map((line, i) => (
              <Addition key={i} lineNumber={line.number}>
                {line.text}
              </Addition>
            ))}
            {file.deletions.map((line, i) => (
              <Deletion key={i} lineNumber={line.number}>
                {line.text}
              </Deletion>
            ))}
          </DiffViewer>
        </div>
      ))}
    </div>
  )
}
```

### Version History Timeline

```tsx
export function VersionHistory({ versions }) {
  return (
    <div className="space-y-8">
      {versions.map((version, idx) => (
        <div key={version.id}>
          <div className="mb-3">
            <h4 className="font-semibold">{version.name}</h4>
            <p className="text-sm text-gray-600">{version.date}</p>
          </div>
          {idx > 0 && (
            <DiffViewer mode="inline">
              {version.changes.map((change) =>
                change.type === 'add' ? (
                  <Addition key={change.id}>{change.text}</Addition>
                ) : (
                  <Deletion key={change.id}>{change.text}</Deletion>
                )
              )}
            </DiffViewer>
          )}
        </div>
      ))}
    </div>
  )
}
```

---

## Accessibility

### ARIA Attributes

Diff Viewer includes semantic HTML and proper roles:

```tsx
// Container has proper semantic structure
<div role="region" aria-label="Code differences">
  <div className="...">
    <Addition>...</Addition>
    <Deletion>...</Deletion>
  </div>
</div>
```

### Screen Reader Support

- Additions and deletions are visually indicated
- Line numbers (if shown) are accessible
- Color is not the only indicator of change
- Text content is always readable

### Color Contrast

| Element | Light Mode | Dark Mode | WCAG Level |
|---------|-----------|-----------|-----------|
| Addition Text | Blue-700 | Blue-300 | ✅ AA |
| Deletion Text | Red-600 | Red-400 | ✅ AA |
| Line Numbers | Slate-400 | Slate-600 | ✅ AA |

### Keyboard Navigation

- Tab through content normally
- No special keyboard shortcuts
- Focus visible on all interactive elements
- Copy/paste works normally

---

## Design Guidelines

### Inline vs Split Mode

**Use Inline Mode When:**
- Showing small diffs (< 10 lines)
- Mobile/narrow screens (< 900px)
- Changes are scattered throughout
- You need vertical space

**Use Split Mode When:**
- Comparing full files or large sections
- Wide screens available (900px+)
- Changes are concentrated
- Visual comparison is primary goal

### Content Considerations

```
❌ Don't:
- Mix too many changes (use pagination)
- Show very large diffs (1000+ lines)
- Use for binary files
- Forget context around changes

✅ Do:
- Show surrounding unchanged lines
- Use proper line numbering
- Group related changes
- Limit to 200-300 lines per viewer
```

### Styling Best Practices

```tsx
// Good: Use wrapper for sizing
<div className="max-w-4xl mx-auto">
  <DiffViewer mode="split" showLineNumbers={true}>
    ...
  </DiffViewer>
</div>

// Good: Use in a card for context
<div className="p-4 border rounded-lg">
  <h3 className="mb-4 font-semibold">Changes</h3>
  <DiffViewer>...</DiffViewer>
</div>

// Avoid: Very narrow containers (< 300px)
<div className="w-64">
  <DiffViewer mode="split" /> {/* Will look cramped */}
</div>
```

### Mobile Considerations

- Default to inline mode on mobile
- Show line numbers for code context
- Use monospace font for readability
- Limit content width for horizontal scroll prevention
- Consider horizontal scrolling for very long lines

---

## Performance Considerations

### Rendering

- Each addition/deletion is individually animated
- Use `React.memo` for large lists of changes:

```tsx
const ChangeItem = React.memo(({ change }) => (
  <div>
    {change.type === 'add' ? (
      <Addition>{change.text}</Addition>
    ) : (
      <Deletion>{change.text}</Deletion>
    )}
  </div>
))
```

### Animation Performance

- Framer Motion handles GPU acceleration
- No jank on animations
- Safe for 100+ items on a page
- Consider virtual scrolling for 1000+ items

### Best Practices

```tsx
// ✅ Good: Memoize complex content
const DiffContent = React.memo(({ changes }) => (
  <DiffViewer>
    {changes.map(c => (
      c.type === 'add' ?
        <Addition key={c.id}>{c.text}</Addition> :
        <Deletion key={c.id}>{c.text}</Deletion>
    ))}
  </DiffViewer>
))

// ❌ Avoid: Recreating objects every render
export function BadDiff({ changes }) {
  return (
    <DiffViewer>
      {changes.map((change) => ({ ...change }))} {/* Creates new object! */}
    </DiffViewer>
  )
}
```

---

## Common Patterns

### Git Commit View

```tsx
export function CommitDiff({ commit }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">{commit.message}</h3>
        <p className="text-sm text-gray-600">{commit.author} • {commit.date}</p>
      </div>
      {commit.files.map((file) => (
        <div key={file.id}>
          <h4 className="font-mono text-sm mb-2">{file.path}</h4>
          <DiffViewer showLineNumbers={true}>
            {file.changes.map((line, i) => (
              line.added ? (
                <Addition key={i} lineNumber={line.number}>{line.text}</Addition>
              ) : line.removed ? (
                <Deletion key={i} lineNumber={line.number}>{line.text}</Deletion>
              ) : (
                <div key={i} className="text-gray-500">{line.text}</div>
              )
            ))}
          </DiffViewer>
        </div>
      ))}
    </div>
  )
}
```

### API Response Comparison

```tsx
export function APIComparison({ oldResponse, newResponse }) {
  return (
    <DiffViewer mode="split">
      <div className="text-sm font-mono">
        {JSON.stringify(oldResponse, null, 2).split('\n').map((line, i) => (
          <Deletion key={i}>{line}</Deletion>
        ))}
      </div>
      <div className="text-sm font-mono">
        {JSON.stringify(newResponse, null, 2).split('\n').map((line, i) => (
          <Addition key={i}>{line}</Addition>
        ))}
      </div>
    </DiffViewer>
  )
}
```

### Document Edit View

```tsx
export function DocumentEdits({ edits }) {
  return (
    <div className="space-y-4">
      {edits.map((edit) => (
        <div key={edit.id}>
          <div className="mb-2">
            <span className="font-semibold">{edit.field}</span>
            <span className="text-sm text-gray-600 ml-2">{edit.date}</span>
          </div>
          <DiffViewer mode="inline">
            <Deletion>{edit.oldValue}</Deletion>
            <Addition>{edit.newValue}</Addition>
          </DiffViewer>
        </div>
      ))}
    </div>
  )
}
```

---

## Troubleshooting

### Styling Issues

**Problem:** Colors look wrong
- **Solution:** Check CSS variable definitions in globals.css
- Ensure Tailwind is properly configured
- Verify dark mode selector is working

**Problem:** Animations feel sluggish
- **Solution:** Check browser performance (DevTools)
- Reduce number of animated items
- Consider removing blur effects for performance

### Content Issues

**Problem:** Line numbers don't align
- **Solution:** Ensure consistent line height
- Use monospace font for all content
- Check for zero-width characters

**Problem:** Split mode looks cramped
- **Solution:** Use inline mode instead
- Increase container width
- Reduce font size if needed

---

## API Reference

### Exports

```tsx
// DiffViewer component
import { DiffViewer } from '@/components/ui/DiffViewer'

// Addition component
import { Addition } from '@/components/ui/DiffViewer'

// Deletion component
import { Deletion } from '@/components/ui/DiffViewer'

// CodeDiff convenience component
import { CodeDiff } from '@/components/ui/DiffViewer'
```

### Related Components
- `ProgressiveDisclosure` - For hiding detailed information
- `Modal` - For showing diffs in a modal
- `Card` - For containing diffs
- `Button` - For accepting/rejecting changes

---

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome/Edge | ✅ Full | All features supported |
| Firefox | ✅ Full | All features supported |
| Safari | ✅ Full | All features supported |
| iOS Safari | ✅ Full | Inline mode recommended |
| Mobile Chrome | ✅ Full | Inline mode recommended |

---

**Last Updated:** January 2026
**Component Version:** 1.0.0
**Maintained By:** praDeep Design Team
