# praDeep Design System

**Version:** 1.0.0
**Last Updated:** January 2026

---

## 1. Brand Overview

### Brand Personality
praDeep embodies five core attributes:
- **Precise** - Every interaction is intentional and clear
- **Thoughtful** - Design anticipates user needs without overwhelming
- **Empowering** - Tools that amplify cognitive capabilities
- **Trustworthy** - Reliable, consistent, and transparent
- **Composed** - Calm, focused interface that reduces cognitive load

### Target Audience: The Rigorous Learner
Graduate students, researchers, and advanced learners who:
- Engage deeply with complex material
- Value precision and thoroughness
- Seek tools that match their intellectual rigor
- Appreciate subtlety over flashiness

### Emotional Positioning
**Intellectual Confidence** - praDeep makes users feel capable, focused, and in control of their learning journey.

### Brand Tagline
> "Think deeper. Learn faster."

### Design Philosophy: Liquid Clarity
- **Subtle depth** - Layered surfaces with gentle elevation changes
- **Focused clarity** - Information hierarchy guides attention naturally
- **Purposeful restraint** - Decoration only when it serves function
- **Signature element** - Dotted grid background maintains visual consistency

---

## 2. Design Principles

### 1. Clarity Over Cleverness
Every element should have an obvious purpose. Avoid decorative flourishes that don't aid comprehension.

### 2. Progressive Disclosure
Show what's needed now. Reveal complexity gradually as users dive deeper.

### 3. Consistent Elevation
Use surface layering to establish clear information hierarchy. More important content sits "higher."

### 4. Responsive Feedback
Every interaction provides immediate, subtle confirmation. Users should never wonder if something worked.

### 5. Keyboard-First Navigation
Power users should be able to navigate entirely via keyboard. Mouse is a fallback, not a requirement.

---

## 3. Color Tokens

### CSS Variables

```css
:root {
  /* Light Mode Surfaces */
  --surface-base: #FAFAFA;
  --surface-elevated: #FFFFFF;
  --surface-raised: #FFFFFF;
  --surface-overlay: rgba(255, 255, 255, 0.95);

  /* Light Mode Text */
  --text-primary: #09090B;     /* zinc-950 */
  --text-body: #3F3F46;        /* zinc-700 */
  --text-muted: #71717A;       /* zinc-500 */
  --text-disabled: #A1A1AA;    /* zinc-400 */

  /* Light Mode Borders */
  --border-subtle: #E4E4E7;    /* zinc-200 */
  --border-default: #D4D4D8;   /* zinc-300 */
  --border-strong: #A1A1AA;    /* zinc-400 */

  /* Primary Accent */
  --primary-50: #EFF6FF;
  --primary-100: #DBEAFE;
  --primary-200: #BFDBFE;
  --primary-300: #93C5FD;
  --primary-400: #60A5FA;
  --primary-500: #3B82F6;      /* Primary */
  --primary-600: #2563EB;
  --primary-700: #1D4ED8;
  --primary-800: #1E40AF;
  --primary-900: #1E3A8A;

  /* Secondary Accent */
  --secondary-50: #FAF5FF;
  --secondary-100: #F3E8FF;
  --secondary-200: #E9D5FF;
  --secondary-300: #D8B4FE;
  --secondary-400: #C084FC;
  --secondary-500: #8B5CF6;    /* Secondary */
  --secondary-600: #7C3AED;
  --secondary-700: #6D28D9;
  --secondary-800: #5B21B6;
  --secondary-900: #4C1D95;

  /* Semantic Colors */
  --success: #10B981;          /* green-500 */
  --warning: #F59E0B;          /* amber-500 */
  --error: #EF4444;            /* red-500 */
  --info: #3B82F6;             /* blue-500 */

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] {
  /* Dark Mode Surfaces */
  --surface-base: #000000;
  --surface-elevated: #0A0A0A;
  --surface-raised: #141414;
  --surface-overlay: rgba(10, 10, 10, 0.95);

  /* Dark Mode Text */
  --text-primary: #FAFAFA;     /* zinc-50 */
  --text-body: #D4D4D8;        /* zinc-300 */
  --text-muted: #A1A1AA;       /* zinc-400 */
  --text-disabled: #71717A;    /* zinc-500 */

  /* Dark Mode Borders */
  --border-subtle: #27272A;    /* zinc-800 */
  --border-default: #3F3F46;   /* zinc-700 */
  --border-strong: #52525B;    /* zinc-600 */

  /* Dark Mode Shadows (more subtle) */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6);
}
```

### Tailwind Config Extension

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        surface: {
          base: 'var(--surface-base)',
          elevated: 'var(--surface-elevated)',
          raised: 'var(--surface-raised)',
          overlay: 'var(--surface-overlay)',
        },
        text: {
          primary: 'var(--text-primary)',
          body: 'var(--text-body)',
          muted: 'var(--text-muted)',
          disabled: 'var(--text-disabled)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          default: 'var(--border-default)',
          strong: 'var(--border-strong)',
        },
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'DEFAULT': 'var(--shadow-md)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
      },
    },
  },
}
```

---

## 4. Typography Scale

### Font Families

**Primary (UI Text):** Inter Variable
**Monospace (Code):** JetBrains Mono

```css
:root {
  --font-sans: 'Inter Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', monospace;
}
```

### Type Scale

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `display-lg` | 48px | 1.2 | 700 | Hero sections |
| `display-md` | 36px | 1.2 | 700 | Page titles |
| `display-sm` | 30px | 1.3 | 600 | Section headers |
| `heading-lg` | 24px | 1.4 | 600 | Card titles |
| `heading-md` | 20px | 1.4 | 600 | Subheadings |
| `heading-sm` | 16px | 1.5 | 600 | Small headings |
| `body-lg` | 18px | 1.6 | 400 | Large body text |
| `body-md` | 16px | 1.6 | 400 | Default body |
| `body-sm` | 14px | 1.5 | 400 | Secondary text |
| `caption` | 12px | 1.4 | 500 | Labels, metadata |
| `code` | 14px | 1.6 | 400 | Code blocks |

### CSS Implementation

```css
/* Display */
.text-display-lg { font-size: 48px; line-height: 1.2; font-weight: 700; }
.text-display-md { font-size: 36px; line-height: 1.2; font-weight: 700; }
.text-display-sm { font-size: 30px; line-height: 1.3; font-weight: 600; }

/* Headings */
.text-heading-lg { font-size: 24px; line-height: 1.4; font-weight: 600; }
.text-heading-md { font-size: 20px; line-height: 1.4; font-weight: 600; }
.text-heading-sm { font-size: 16px; line-height: 1.5; font-weight: 600; }

/* Body */
.text-body-lg { font-size: 18px; line-height: 1.6; font-weight: 400; }
.text-body-md { font-size: 16px; line-height: 1.6; font-weight: 400; }
.text-body-sm { font-size: 14px; line-height: 1.5; font-weight: 400; }

/* Utility */
.text-caption { font-size: 12px; line-height: 1.4; font-weight: 500; }
.text-code { font-family: var(--font-mono); font-size: 14px; line-height: 1.6; }
```

---

## 5. Spacing System

### Base Unit: 8px

All spacing uses multiples of 8px for visual consistency.

| Token | Value | Usage |
|-------|-------|-------|
| `space-0` | 0px | Reset |
| `space-1` | 8px | Tight spacing |
| `space-2` | 16px | Compact spacing |
| `space-3` | 24px | Default spacing |
| `space-4` | 32px | Comfortable spacing |
| `space-5` | 40px | Generous spacing |
| `space-6` | 48px | Section spacing |
| `space-8` | 64px | Large section spacing |
| `space-10` | 80px | Major section dividers |
| `space-12` | 96px | Page-level spacing |

### Container Sizes

```css
:root {
  --container-sm: 640px;   /* Narrow content */
  --container-md: 768px;   /* Standard content */
  --container-lg: 1024px;  /* Wide content */
  --container-xl: 1280px;  /* Full-width app */
  --container-2xl: 1536px; /* Ultra-wide */
}
```

---

## 6. Component Patterns

### Border Radius

Subtle, not pill-shaped:

```css
:root {
  --radius-sm: 4px;   /* Small elements (badges, tags) */
  --radius-md: 6px;   /* Buttons, inputs */
  --radius-lg: 8px;   /* Cards, panels */
  --radius-xl: 12px;  /* Modals, large containers */
}
```

**Never use** `rounded-full` for rectangles. Pill shapes are only for circular avatars or badges.

### Button Variants

#### Primary Button
```tsx
<button className="
  px-4 py-2
  bg-primary-500 hover:bg-primary-600
  text-white font-medium
  rounded-md
  shadow-sm hover:shadow-md
  transition-all duration-200 ease-out-expo
  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
">
  Primary Action
</button>
```

#### Secondary Button
```tsx
<button className="
  px-4 py-2
  bg-surface-elevated hover:bg-zinc-100 dark:hover:bg-zinc-800
  text-text-primary font-medium
  border border-border-default
  rounded-md
  shadow-sm hover:shadow-md
  transition-all duration-200 ease-out-expo
  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
">
  Secondary Action
</button>
```

#### Ghost Button
```tsx
<button className="
  px-4 py-2
  bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800
  text-text-body font-medium
  rounded-md
  transition-all duration-200 ease-out-expo
  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
">
  Tertiary Action
</button>
```

### Card Pattern

```tsx
<div className="
  bg-surface-elevated
  border border-border-subtle
  rounded-lg
  shadow-md hover:shadow-lg
  transition-all duration-300 ease-out-expo
  p-6
">
  {/* Card content */}
</div>
```

### Input Field

```tsx
<input className="
  w-full px-4 py-2
  bg-surface-elevated
  border border-border-default focus:border-primary-500
  rounded-md
  text-text-primary placeholder:text-text-muted
  transition-all duration-200 ease-out-expo
  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20
" />
```

### Modal Pattern

```tsx
<div className="
  fixed inset-0 z-50
  bg-black/50 backdrop-blur-sm
  flex items-center justify-center
  animate-fadeIn
">
  <div className="
    bg-surface-elevated
    border border-border-subtle
    rounded-xl shadow-xl
    max-w-lg w-full
    p-6
    animate-slideUp
  ">
    {/* Modal content */}
  </div>
</div>
```

### Empty State Pattern

```tsx
<div className="
  flex flex-col items-center justify-center
  py-12 px-6
  text-center
">
  <div className="text-text-muted mb-4">
    {/* Icon (24px) */}
  </div>
  <h3 className="text-heading-md text-text-primary mb-2">
    No items yet
  </h3>
  <p className="text-body-sm text-text-muted mb-6">
    Get started by creating your first item
  </p>
  <button className="btn-primary">
    Create Item
  </button>
</div>
```

### Skeleton Loader

```tsx
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div>
  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6"></div>
</div>
```

---

## 7. Animation Specs

### Timing Functions

```css
:root {
  /* Custom easing curves */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out-smooth: cubic-bezier(0.45, 0, 0.55, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Duration Scale

| Context | Duration | Usage |
|---------|----------|-------|
| Micro | 150ms | Hover states, toggles |
| Standard | 200ms | Button clicks, input focus |
| Moderate | 300ms | Card transitions, tooltips |
| Deliberate | 400ms | Modals, drawers |
| Slow | 500ms | Page transitions |

### Tailwind Easing Extension

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-smooth': 'cubic-bezier(0.45, 0, 0.55, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
}
```

### Framer Motion Variants

```tsx
// Standard fade in
const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  },
}

// Slide in from left
const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  },
}

// Scale on hover (micro-interaction)
const scaleOnHover: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] }
  },
}

// Stagger children
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open command palette |
| `Cmd+B` / `Ctrl+B` | Toggle sidebar |
| `Cmd+/` / `Ctrl+/` | Show keyboard shortcuts |
| `Esc` | Close modal/drawer |
| `Tab` / `Shift+Tab` | Navigate focus |
| `Enter` | Confirm action |

---

## 8. Implementation Status

### ✅ Completed Features

**Foundation:**
- CSS variables in `globals.css` with full theme support
- Tailwind config extended with custom tokens
- Inter Variable and JetBrains Mono fonts configured
- Dark mode system with `[data-theme]` attribute
- Theme toggle component (`ThemeScript.tsx`)

**Core Components:**
- Button component with primary, secondary, and ghost variants
- Card component with elevation and hover states
- Input/Textarea components with focus states
- Modal component with Framer Motion animations
- Toast notification system
- Empty state patterns
- Skeleton loader components

**Interactions:**
- Keyboard navigation support across UI
- Focus management and trap for modals
- Loading states for async operations
- Form validation patterns
- Framer Motion animations throughout

**Polish:**
- Micro-interactions on buttons and cards
- Page transition animations
- Success/error toast messages
- Dark mode tested across all pages
- WCAG AA color contrast compliance

**Mobile & PWA:**
- Touch-optimized components (PullToRefresh, SwipeNavigator, ContextMenu)
- PWA support with service worker
- Responsive design for all screen sizes
- Haptic feedback for mobile interactions

### 🚧 In Progress

**AI Transparency Features:**
- Reasoning step displays with collapsible sections
- Confidence indicators and progress tracking
- Council deliberation visualization
- Token usage and cost tracking

### 📋 Future Enhancements

- Command palette (Cmd+K) - not yet implemented
- Sidebar keyboard toggle (Cmd+B) - not yet implemented
- Comprehensive Storybook documentation
- Automated accessibility testing suite

---

## Appendix: Quick Reference

### Most Common Classes

```tsx
/* Layout */
.container-app { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
.section-spacing { padding: 64px 0; }

/* Surface hierarchy */
.surface-base { background: var(--surface-base); }
.surface-elevated { background: var(--surface-elevated); border: 1px solid var(--border-subtle); }
.surface-raised { background: var(--surface-raised); box-shadow: var(--shadow-md); }

/* Text hierarchy */
.text-primary { color: var(--text-primary); }
.text-body { color: var(--text-body); }
.text-muted { color: var(--text-muted); }

/* Interactive states */
.interactive {
  transition: all 200ms var(--ease-out-expo);
}
.interactive:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}
.interactive:active {
  transform: translateY(0);
}
```

### Design Tokens at a Glance

```
Spacing: 8px base grid
Radius: 4px → 6px → 8px → 12px
Timing: 150ms → 200ms → 300ms → 400ms
Easing: out-expo [0.16, 1, 0.3, 1]
Primary: #3B82F6 (blue-500)
Secondary: #8B5CF6 (violet-500)
```

---

**Document Maintained By:** praDeep Design Team
**Questions?** Open an issue in the repo or reach out on Slack.
