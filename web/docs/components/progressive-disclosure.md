# Progressive Disclosure Component

**Location:** `web/components/ui/ProgressiveDisclosure.tsx`

**Status:** ✅ Production Ready

Progressive Disclosure is a collapsible content container that reveals information gradually as users explore deeper into an interface. This reduces cognitive load by showing only what's needed at the current level.

---

## Purpose & Use Cases

### Primary Purpose
Hide secondary or advanced information to maintain a clean, focused interface while making complexity accessible on demand.

### When to Use
- **Settings & Configuration:** Organize options by importance
- **FAQ Sections:** Hide answers until clicked
- **Advanced Features:** Keep power-user features accessible but out of the way
- **Nested Information:** Build hierarchical content structures
- **Detail Panes:** Progressive revelation of content details
- **Help & Documentation:** Step-by-step explanation sections

### When NOT to Use
- **Required Information:** Don't hide critical information
- **Navigation:** Use proper navigation, not disclosure containers
- **Multiple Simultaneous Expansions:** Use accordion for mutually exclusive items
- **Performance-Critical:** Each expansion mounts new DOM nodes

---

## Component API

### Props

```typescript
interface ProgressiveDisclosureProps {
  /** The title text shown in the header, always visible */
  title: string

  /** Content to be revealed when expanded */
  children: ReactNode

  /** Whether to start in expanded state (default: false) */
  defaultExpanded?: boolean

  /** Visual hierarchy level: 1 (primary) or 2 (secondary) */
  level?: 1 | 2
}
```

#### Prop Details

**`title: string`** (Required)
- The header text displayed in the always-visible button
- Automatically converted to lowercase in the header
- Used as base for `aria-controls` ID generation
- Avoid very long titles (80+ chars) for mobile UX

**`children: ReactNode`** (Required)
- The content that appears when expanded
- Can be text, components, or complex JSX
- Animations apply automatically
- No need to manage visibility state

**`defaultExpanded?: boolean`** (Optional)
- Controls initial expansion state
- Default: `false` (starts collapsed)
- Use for commonly needed information
- Useful for first-load guidance

**`level?: 1 | 2`** (Optional)
- Visual hierarchy level affecting size, shadows, and borders
- **Level 1** (default): Primary disclosures with larger text and stronger shadows
- **Level 2**: Secondary/nested disclosures with smaller text and subtle shadows
- Use Level 2 for disclosures nested inside disclosures

---

## Visual Design

### Level 1 (Primary)

```typescript
container: 'bg-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.06)]'
header: 'text-[15px] tracking-wide'
border: 'border-slate-200/60'
```

**Characteristics:**
- Stronger visual presence
- Larger text (15px)
- Prominent shadow
- More opaque background
- Used for main sections

### Level 2 (Secondary)

```typescript
container: 'bg-white/25 shadow-[0_4px_16px_rgba(0,0,0,0.04)]'
header: 'text-[13px] tracking-wider'
border: 'border-slate-200/40'
```

**Characteristics:**
- Subtle visual presence
- Smaller text (13px)
- Delicate shadow
- More transparent background
- Used for nested/advanced options

### Visual Effects

**Container Styling:**
- Rounded corners: `rounded-2xl`
- Border: Subtle slate with liquid glass effect
- Backdrop blur: `backdrop-blur-xl` (aggressive glass morphism)
- Overflow: Hidden to keep content within bounds

**Hover Effects:**
- Level 1: `shadow-[0_12px_40px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.5) inset]`
- Level 2: `shadow-[0_6px_20px rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.3) inset]`
- Prismatic shimmer: Gradient overlay with blue tint
- Transition: `duration-300` smooth fade

**Bottom Accent:**
- Thin gradient line at the bottom
- `from-transparent via-white/60 to-transparent`
- Enhances glass effect with reflected light

---

## Animations

### Chevron Icon Animation

The right-facing chevron rotates 90° when expanded:

```typescript
const chevronVariants: Variants = {
  collapsed: {
    rotate: 0,
    transition: { duration: 0.15, ease: [0.2, 0.8, 0.2, 1] },
  },
  expanded: {
    rotate: 90,
    transition: { duration: 0.15, ease: [0.2, 0.8, 0.2, 1] },
  },
}
```

### Content Expand/Collapse Animation

Content smoothly fades and resizes:

```typescript
const contentVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.15, ease: [0.2, 0.8, 0.2, 1] },
      opacity: { duration: 0.12, ease: [0.2, 0.8, 0.2, 1] },
    },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.15, ease: [0.2, 0.8, 0.2, 1] },
      opacity: { duration: 0.18, ease: [0.2, 0.8, 0.2, 1], delay: 0.05 },
    },
  },
}
```

**Animation Details:**
- **Height Animation:** 150ms height change with fluid easing
- **Opacity Animation:** Staggered - slightly delayed to create entrance effect
- **Easing:** Custom fluid curve `[0.2, 0.8, 0.2, 1]` for smooth, natural feel
- **Total Duration:** ~165ms collapsed → expanded

### Transition Timing

| Phase | Duration | Effect |
|-------|----------|--------|
| Collapse | 150ms | Height shrinks, opacity fades |
| Expand | 165ms | Content appears, height grows |
| Hover Shimmer | 300ms | Glow effect fades in/out |

---

## Usage Examples

### Basic Usage

```tsx
import { ProgressiveDisclosure } from '@/components/ui/ProgressiveDisclosure'

export function FAQSection() {
  return (
    <div className="space-y-3">
      <ProgressiveDisclosure title="What is praDeep?">
        <p>praDeep is a learning platform designed for rigorous learners.</p>
      </ProgressiveDisclosure>

      <ProgressiveDisclosure title="How does the AI work?">
        <p>Our multi-agent system provides nuanced responses to complex queries.</p>
      </ProgressiveDisclosure>

      <ProgressiveDisclosure title="Is my data private?">
        <p>Yes, all data is encrypted and stored securely.</p>
      </ProgressiveDisclosure>
    </div>
  )
}
```

### Pre-Expanded for Important Info

```tsx
export function SettingsPanel() {
  return (
    <div className="space-y-3">
      {/* This one is open by default to guide users */}
      <ProgressiveDisclosure
        title="Required: API Key Setup"
        defaultExpanded={true}
      >
        <p>Enter your API key to enable AI features:</p>
        <input type="password" placeholder="Enter API key" />
      </ProgressiveDisclosure>

      {/* Advanced options hidden by default */}
      <ProgressiveDisclosure title="Advanced Preferences">
        <label>
          <input type="checkbox" /> Enable experimental features
        </label>
      </ProgressiveDisclosure>
    </div>
  )
}
```

### Nested Hierarchies with Levels

```tsx
export function AdvancedSettings() {
  return (
    <div className="space-y-4">
      {/* Level 1: Main sections */}
      <ProgressiveDisclosure title="Display Settings" level={1}>
        <div className="space-y-3">
          {/* Level 2: Subsections nested inside */}
          <ProgressiveDisclosure
            title="Theme Options"
            level={2}
          >
            <label>
              <input type="radio" name="theme" /> Light Mode
            </label>
            <label>
              <input type="radio" name="theme" /> Dark Mode
            </label>
          </ProgressiveDisclosure>

          <ProgressiveDisclosure
            title="Font Preferences"
            level={2}
          >
            <select>
              <option>Inter (default)</option>
              <option>IBM Plex</option>
            </select>
          </ProgressiveDisclosure>
        </div>
      </ProgressiveDisclosure>

      {/* Level 1: Another main section */}
      <ProgressiveDisclosure title="Notifications" level={1}>
        <div className="space-y-3">
          <label>
            <input type="checkbox" /> Email notifications
          </label>
          <label>
            <input type="checkbox" /> Push notifications
          </label>
        </div>
      </ProgressiveDisclosure>
    </div>
  )
}
```

### Rich Content Inside

```tsx
export function DocumentationSection() {
  return (
    <ProgressiveDisclosure title="API Documentation" level={1}>
      <div className="space-y-4">
        <h4 className="font-semibold text-slate-900">Endpoints</h4>

        <code className="block bg-slate-100 p-3 rounded text-sm overflow-x-auto">
          GET /api/v1/users
        </code>

        <p className="text-sm text-slate-600">
          Returns a paginated list of users with their profiles and settings.
        </p>

        <ProgressiveDisclosure
          title="Parameters"
          level={2}
          defaultExpanded={false}
        >
          <ul className="text-sm space-y-1 text-slate-600">
            <li>• page (int): Page number (default: 1)</li>
            <li>• limit (int): Items per page (default: 20)</li>
            <li>• sort (string): Sort field (default: created_at)</li>
          </ul>
        </ProgressiveDisclosure>
      </div>
    </ProgressiveDisclosure>
  )
}
```

### With Dynamic Content

```tsx
export function DynamicSettings({ settings }) {
  const [expanded, setExpanded] = useState({})

  return (
    <div className="space-y-3">
      {settings.map((section) => (
        <ProgressiveDisclosure
          key={section.id}
          title={section.title}
          level={section.level || 1}
        >
          {section.items.map((item) => (
            <div key={item.id} className="mb-2">
              <input
                type="text"
                value={item.value}
                onChange={(e) => {
                  // Update value in state
                }}
              />
            </div>
          ))}
        </ProgressiveDisclosure>
      ))}
    </div>
  )
}
```

---

## Accessibility

### ARIA Attributes

The component automatically applies proper accessibility attributes:

```tsx
// Header button
<button
  aria-expanded={isExpanded}
  aria-controls={`disclosure-${title.replace(/\s+/g, '-')}`}
>

// Content container
<div id={`disclosure-${title.replace(/\s+/g, '-')}`}>
```

### Keyboard Navigation

| Key | Behavior |
|-----|----------|
| `Space/Enter` | Toggle expanded state |
| `Tab` | Move focus to next interactive element |
| `Shift+Tab` | Move focus to previous element |

### Screen Reader Support

- Header button labeled with title text
- `aria-expanded` correctly indicates state
- `aria-controls` links button to content
- Content marked with proper ID
- Focus outline visible on keyboard navigation

### Color Contrast

- Header text (slate-700): WCAG AA compliant on white backgrounds
- Hover text (slate-900): Higher contrast for emphasis
- Border colors: Sufficient contrast for visibility

---

## Design Guidelines

### When to Use Which Level

**Level 1 - Primary Disclosure:**
- Top-level groupings
- Important settings
- Main content sections
- High visual prominence needed

**Level 2 - Secondary Disclosure:**
- Nested under Level 1 disclosures
- Advanced or less-common options
- Tertiary information
- Subtle visual appearance

### Content Organization

```
❌ Don't:
- Hide required information
- Use for navigation
- Create deeply nested hierarchies (3+ levels)
- Put very long content (1000+ chars) inside

✅ Do:
- Show section headers at top level
- Hide optional or advanced features
- Limit nesting to Level 1 → Level 2
- Keep content concise and scannable
```

### Spacing

```tsx
// Single disclosure
<ProgressiveDisclosure title="...">...</ProgressiveDisclosure>

// Multiple disclosures (use gap)
<div className="space-y-3">
  <ProgressiveDisclosure>...</ProgressiveDisclosure>
  <ProgressiveDisclosure>...</ProgressiveDisclosure>
</div>

// Grouped disclosures with section title
<div>
  <h3 className="text-heading-md mb-4">Settings</h3>
  <div className="space-y-3">
    <ProgressiveDisclosure>...</ProgressiveDisclosure>
  </div>
</div>
```

### Mobile Considerations

- Titles should be ≤ 40 characters for mobile readability
- Avoid very long content (use secondary disclosures to break it up)
- Tap target is full width (easy to tap on mobile)
- Animation timing is snappy (not too slow)
- Works well with swipe-based navigation

---

## Common Patterns

### Settings Panel

```tsx
export function SettingsPanel() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <ProgressiveDisclosure title="Account Settings" level={1}>
        {/* Account form */}
      </ProgressiveDisclosure>

      <ProgressiveDisclosure title="Privacy & Security" level={1}>
        {/* Privacy form */}
      </ProgressiveDisclosure>

      <ProgressiveDisclosure title="Experimental Features" level={1}>
        {/* Experimental options */}
      </ProgressiveDisclosure>
    </div>
  )
}
```

### FAQ/Help Section

```tsx
export function HelpCenter() {
  const faqs = [
    { q: "How do I...", a: "To do this..." },
    { q: "What is...", a: "It's..." },
  ]

  return (
    <div className="space-y-2">
      {faqs.map((faq) => (
        <ProgressiveDisclosure key={faq.q} title={faq.q}>
          {faq.a}
        </ProgressiveDisclosure>
      ))}
    </div>
  )
}
```

### Feature Explanation

```tsx
export function FeatureGuide() {
  return (
    <ProgressiveDisclosure
      title="How Council Deliberation Works"
      defaultExpanded={true}
      level={1}
    >
      <div className="space-y-4">
        <p>Our multi-agent system works in three phases:</p>

        <ProgressiveDisclosure title="Phase 1: Analysis" level={2}>
          Each agent analyzes the query independently.
        </ProgressiveDisclosure>

        <ProgressiveDisclosure title="Phase 2: Deliberation" level={2}>
          Agents discuss their findings and reasoning.
        </ProgressiveDisclosure>

        <ProgressiveDisclosure title="Phase 3: Consensus" level={2}>
          A unified response is synthesized from the discussion.
        </ProgressiveDisclosure>
      </div>
    </ProgressiveDisclosure>
  )
}
```

---

## Performance Considerations

### DOM Management
- Content is mounted when component loads (not just when expanded)
- CSS `height: 0` and `opacity: 0` hide the content
- No lazy loading of content
- Safe for long lists of disclosures

### Animation Performance
- Uses Framer Motion's GPU-accelerated transforms
- Height animation may cause layout recalculations
- Optimized for smooth 60fps animations
- Safe to use many instances on same page

### Best Practices
- Don't put heavy computations in children
- Don't use as lazy-loading for large datasets
- Cache expensive content calculations
- Use `React.memo` for complex child components

---

## Troubleshooting

### Content Not Expanding
- Check that `title` prop is provided and non-empty
- Verify `children` is not null or undefined
- Check browser console for errors
- Ensure Framer Motion is installed

### Styling Issues
- If background color looks wrong, check CSS variable overrides
- For custom colors, use inline styles or className
- Light/dark mode: Check `[data-theme]` attribute on html

### Accessibility Issues
- Use semantic HTML inside content
- Provide alternative text for images
- Ensure proper heading hierarchy
- Test with screen readers

---

## API Reference

### Component Export

```tsx
// Named export
import { ProgressiveDisclosure } from '@/components/ui/ProgressiveDisclosure'

// Or with default
import ProgressiveDisclosure from '@/components/ui/ProgressiveDisclosure'
```

### Related Components
- `DiffViewer` - For showing code/text changes
- `CommandMenu` - For action palettes
- `Modal` - For focused content
- `Card` - For static containers

---

## Browser Support

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome/Edge | ✅ Full | All features supported |
| Firefox | ✅ Full | All features supported |
| Safari | ✅ Full | All features supported |
| iOS Safari | ✅ Full | Touch-friendly |
| Mobile Chrome | ✅ Full | Touch-friendly |

---

**Last Updated:** January 2026
**Component Version:** 1.0.0
**Maintained By:** praDeep Design Team
