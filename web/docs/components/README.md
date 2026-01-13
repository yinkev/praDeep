# Component Documentation

Welcome to the praDeep component library documentation. This directory contains detailed guides for the core UI components that power the praDeep platform.

## Component Overview

### Core UI Components

The praDeep design system is built on the principle of **Liquid Clarity** - subtle depth with focused clarity and purposeful restraint. All components follow the 2026 soft minimalism aesthetic with carefully tuned animations and glass-morphism effects.

#### 1. **Progressive Disclosure** (`ProgressiveDisclosure.tsx`)
A collapsible content container that reveals information gradually as users explore. Essential for managing complex information hierarchies.

- **Purpose:** Hide secondary information to reduce cognitive load
- **Visual Style:** Liquid glass with two hierarchy levels
- **Animations:** Smooth expand/collapse with chevron rotation
- **Use Cases:** FAQ sections, detailed settings, collapsible explanations

**Quick Link:** [Full Documentation →](./progressive-disclosure.md)

---

#### 2. **Diff Viewer** (`DiffViewer.tsx`)
Specialized component for displaying code changes, revisions, and textual differences with visual clarity.

- **Purpose:** Show before/after comparisons with semantic coloring
- **Visual Style:** Inline or split-view modes with liquid glass backdrop
- **Animations:** Staggered entrance animations for additions and deletions
- **Use Cases:** Code diffs, revision history, content comparisons

**Quick Link:** [Full Documentation →](./diff-viewer.md)

---

#### 3. **Command Menu** (`CommandMenu.tsx`)
A Notion-style slash command palette for quick access to actions and navigation.

- **Purpose:** Provide keyboard-first access to all major commands
- **Visual Style:** Floating glass panel with icon-labeled commands
- **Animations:** Smooth scale-up entrance with hover interactions
- **Use Cases:** Command palette, action menus, keyboard shortcuts

**Quick Link:** [Full Documentation →](./command-menu.md)

---

#### 4. **Liquid Glass Styling** (Design Pattern)
The foundational design pattern used across all components for the 2026 visual aesthetic.

- **Purpose:** Create depth and elegance through layered transparency
- **Visual Style:** Backdrop blur with gradient overlays and shimmer effects
- **Animations:** Micro-interactions on hover and focus states
- **Use Cases:** All elevated surfaces, modals, cards, panels

**Quick Link:** [Full Documentation →](./liquid-glass.md)

---

## Design Principles

### 1. Clarity Over Cleverness
Every component serves a clear purpose. Animations and visual effects enhance, not distract.

### 2. Progressive Disclosure
Show what's needed now. Complex features are revealed as users explore deeper.

### 3. Liquid Clarity
Subtle depth through:
- Backdrop blur filters
- Layered transparency
- Gradient overlays
- Prismatic shimmer effects
- Soft shadows

### 4. Responsive Feedback
Every interaction provides immediate, subtle confirmation.

### 5. Keyboard-First
Power users can navigate entirely via keyboard. Mouse is a fallback.

---

## Animation Standards

All components use these standardized animation properties:

```tsx
// Timing
- Micro: 150ms (hover, toggles)
- Standard: 200ms (clicks, focus)
- Moderate: 300ms (card transitions)
- Deliberate: 400ms (modals, drawers)

// Easing (out-expo)
[0.16, 1, 0.3, 1]
cubic-bezier(0.16, 1, 0.3, 1)

// Framer Motion Defaults
- Initial: false (no animation on mount unless specified)
- AnimatePresence: true (exit animations for removed components)
```

---

## Color System

### Primary Palette
- **Primary:** #3B82F6 (Blue-500)
- **Secondary:** #8B5CF6 (Violet-500)
- **Success:** #10B981 (Green-500)
- **Warning:** #F59E0B (Amber-500)
- **Error:** #EF4444 (Red-500)

### Surface Colors
```tsx
// Light Mode
--surface-base: #FAFAFA
--surface-elevated: #FFFFFF
--surface-raised: #FFFFFF
--surface-overlay: rgba(255, 255, 255, 0.95)

// Dark Mode
--surface-base: #000000
--surface-elevated: #0A0A0A
--surface-raised: #141414
--surface-overlay: rgba(10, 10, 10, 0.95)
```

### Text Colors
```tsx
// Light Mode
--text-primary: #09090B (zinc-950)
--text-body: #3F3F46 (zinc-700)
--text-muted: #71717A (zinc-500)
--text-disabled: #A1A1AA (zinc-400)

// Dark Mode
--text-primary: #FAFAFA (zinc-50)
--text-body: #D4D4D8 (zinc-300)
--text-muted: #A1A1AA (zinc-400)
--text-disabled: #71717A (zinc-500)
```

---

## Typography

### Font Families
- **UI Text:** Inter Variable (system fallback)
- **Monospace:** JetBrains Mono (SF Mono fallback)
- **Display/Serif:** Cormorant Garamond (used in ProgressiveDisclosure)
- **Code Labels:** IBM Plex Mono (used in ProgressiveDisclosure headers)

### Type Scale
| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `heading-lg` | 24px | 600 | Card titles |
| `heading-md` | 20px | 600 | Subheadings |
| `heading-sm` | 16px | 600 | Small headings |
| `body-md` | 16px | 400 | Default body |
| `body-sm` | 14px | 400 | Secondary text |
| `caption` | 12px | 500 | Labels |
| `code` | 14px | 400 | Code blocks |

---

## Spacing System

All spacing uses multiples of 8px for visual consistency:

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 8px | Tight spacing |
| `space-2` | 16px | Compact spacing |
| `space-3` | 24px | Default spacing |
| `space-4` | 32px | Comfortable spacing |
| `space-5` | 40px | Generous spacing |
| `space-6` | 48px | Section spacing |

---

## Accessibility

### WCAG Compliance
- All components meet WCAG AA color contrast requirements
- Proper `aria-` attributes for semantic meaning
- Focus management and keyboard navigation support
- Proper heading hierarchy
- Alt text for all icons and images

### Keyboard Navigation
- Tab/Shift+Tab for forward/backward navigation
- Enter to activate buttons and links
- Escape to close modals and dialogs
- Arrow keys for menu navigation
- Custom shortcuts documented in component

### Screen Readers
- ARIA labels on all interactive elements
- Proper `role` attributes for custom components
- Status announcements for dynamic content
- Live regions for async updates

---

## Implementation Guidelines

### Props Typing
All components use TypeScript with explicit interfaces:

```tsx
interface ComponentProps {
  /** Primary content */
  children: ReactNode
  /** Optional CSS class for styling */
  className?: string
  /** Callback when action is triggered */
  onAction?: (id: string) => void
}
```

### Styling Approach
- **Tailwind CSS** for utility classes
- **Framer Motion** for animations
- **CSS-in-JS** for dynamic styles
- **CSS Variables** for theming

### Best Practices
1. **Use Framer Motion for complex animations** - not CSS transitions
2. **Set `initial={false}` on Framer Motion components** - prevents unwanted mount animations
3. **Use `AnimatePresence`** - for exit animations on removal
4. **Prefer utility classes** - over inline styles
5. **Use CSS Variables** - for theme-aware colors
6. **Keep props minimal** - expose only necessary controls
7. **Document all variants** - in the component guide

---

## File Locations

```
web/components/
├── ui/
│   ├── ProgressiveDisclosure.tsx
│   ├── DiffViewer.tsx
│   ├── CommandMenu.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   └── ... (other UI components)
├── mobile/
│   ├── SwipeNavigator.tsx
│   ├── PullToRefresh.tsx
│   └── ContextMenu.tsx
├── ai/
│   ├── ThinkingIndicator.tsx
│   ├── ReasoningSteps.tsx
│   └── ConfidenceBadge.tsx
└── ... (other component categories)

web/docs/components/
├── README.md (this file)
├── progressive-disclosure.md
├── diff-viewer.md
├── command-menu.md
└── liquid-glass.md
```

---

## Quick Start

### Using ProgressiveDisclosure
```tsx
import { ProgressiveDisclosure } from '@/components/ui/ProgressiveDisclosure'

export function MyComponent() {
  return (
    <ProgressiveDisclosure title="Advanced Options" level={1}>
      <p>This content is hidden by default and reveals on click.</p>
    </ProgressiveDisclosure>
  )
}
```

### Using DiffViewer
```tsx
import { DiffViewer, Addition, Deletion } from '@/components/ui/DiffViewer'

export function MyDiff() {
  return (
    <DiffViewer mode="inline">
      <Deletion>const oldValue = 'foo'</Deletion>
      <Addition>const newValue = 'bar'</Addition>
    </DiffViewer>
  )
}
```

### Using CommandMenu
```tsx
import { CommandMenu, COMMANDS } from '@/components/ui/CommandMenu'

export function MyApp() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <CommandMenu
      isOpen={isOpen}
      query=""
      selectedIndex={0}
      onSelect={(id) => console.log(id)}
      onClose={() => setIsOpen(false)}
    />
  )
}
```

---

## Component Status

| Component | Status | Notes |
|-----------|--------|-------|
| ProgressiveDisclosure | ✅ Production | Fully implemented and tested |
| DiffViewer | ✅ Production | Supports inline and split modes |
| CommandMenu | ✅ Production | Keyboard navigation ready |
| Liquid Glass | ✅ Pattern | Applied across all components |

---

## Contributing

When adding new components:

1. **Follow the design system** - Use colors, spacing, and typography from tokens
2. **Use Framer Motion** - For all non-trivial animations
3. **Write TypeScript** - Explicit prop types required
4. **Test responsiveness** - Mobile, tablet, and desktop
5. **Test dark mode** - Use CSS variables for theming
6. **Document thoroughly** - Add a `.md` file in this directory
7. **Follow naming** - Use PascalCase for components, camelCase for props
8. **Include examples** - Show common usage patterns

---

## Related Documentation

- [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) - Complete design system reference
- [animation-patterns-research.md](../animation-patterns-research.md) - Animation research and best practices
- [2026-design-compliance-report.md](../2026-design-compliance-report.md) - Design system compliance

---

**Last Updated:** January 2026
**Maintained By:** praDeep Design Team
