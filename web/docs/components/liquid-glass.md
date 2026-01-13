# Liquid Glass: Styling Guide

**Status:** ✅ Design Pattern (Applied Across All Components)

**Year:** 2026 Design System

Liquid Glass is the foundational design aesthetic for praDeep - a sophisticated approach to glass morphism that creates depth, elegance, and visual hierarchy through layered transparency, subtle animations, and prismatic effects.

---

## Design Philosophy

### What is Liquid Glass?

Liquid Glass is not a single effect, but a cohesive design language that combines:

1. **Backdrop Blur** - Semi-transparent, frosted glass appearance
2. **Layered Transparency** - Multiple opacity levels for depth
3. **Gradient Overlays** - Subtle color shifts for dimension
4. **Prismatic Shimmer** - Reflective light effects on hover
5. **Soft Shadows** - Elevation without harshness
6. **Micro-interactions** - Smooth transitions on interaction

### Core Principles

**Clarity Over Decoration**
- Every visual effect serves a purpose
- Blur and transparency aid readability
- Effects enhance, not distract

**Subtle Depth**
- Layered surfaces establish hierarchy
- Important content "floats" forward
- Backgrounds recede into distance

**Purposeful Motion**
- Animations guide attention
- Transitions feel natural and responsive
- No gratuitous effects

**Unified Aesthetic**
- Consistent application across all UI
- Same easing, timing, and curves
- Cohesive brand identity

---

## Technical Implementation

### Core CSS Properties

#### Backdrop Blur

```css
/* Standard blur for glass effect */
backdrop-filter: blur(10px);
/* Tailwind: backdrop-blur-md */

/* Aggressive blur for dramatic effect */
backdrop-filter: blur(20px);
/* Tailwind: backdrop-blur-xl */

/* Subtle blur for light touch */
backdrop-filter: blur(4px);
/* Tailwind: backdrop-blur-sm */
```

**Use Cases:**
- **`backdrop-blur-xl`** (20px): Main containers, modals, headers
- **`backdrop-blur-md`** (10px): Cards, panels, secondary surfaces
- **`backdrop-blur-sm`** (4px): Subtle overlays, text backgrounds

#### Transparency Layers

```css
/* Light mode background */
background-color: rgba(255, 255, 255, 0.8);  /* 80% opaque */
background: rgba(255, 255, 255, 0.4);        /* 40% opaque */
background: rgba(255, 255, 255, 0.25);       /* 25% opaque */

/* Dark mode background */
background-color: rgba(10, 10, 10, 0.95);   /* 95% opaque */
background: rgba(0, 0, 0, 0.8);              /* 80% opaque */
background: rgba(0, 0, 0, 0.5);              /* 50% opaque */
```

**Opacity Scale:**
| Level | Light | Dark | Usage |
|-------|-------|------|-------|
| Primary | 80% | 95% | Main surfaces |
| Secondary | 40-60% | 70-85% | Nested elements |
| Tertiary | 25-40% | 50-70% | Text overlays |

#### Gradient Overlays

```css
/* Directional gradient for depth */
background: linear-gradient(135deg,
  rgba(255, 255, 255, 0.8) 0%,
  rgba(255, 255, 255, 0.6) 100%
);

/* Color-shifted gradient */
background: linear-gradient(to bottom,
  rgba(147, 197, 253, 0.1) 0%,      /* blue tint */
  rgba(255, 255, 255, 0) 100%
);

/* Prismatic shimmer on hover */
background: linear-gradient(135deg,
  rgba(255, 255, 255, 0) 0%,
  rgba(147, 197, 253, 0.1) 50%,
  rgba(255, 255, 255, 0) 100%
);
```

**Gradient Types:**
- **Directional**: Fade from opaque to transparent
- **Color-Shifted**: Tinted gradients for accent colors
- **Prismatic**: Diagonal shimmer for light reflection
- **Radial**: Center glow for focal points

---

## Component Patterns

### Standard Container

The base pattern for all Liquid Glass containers:

```tsx
<div className={`
  relative
  rounded-xl                    /* 12px radius */
  border border-slate-200/50    /* Subtle border with transparency */
  dark:border-slate-700/50

  /* Liquid glass background */
  bg-gradient-to-br
  from-slate-50/80 to-white/60
  dark:from-slate-900/80 dark:to-slate-800/60

  /* Glass effect */
  backdrop-blur-sm

  /* Elevation */
  shadow-sm shadow-slate-200/50
  dark:shadow-slate-900/50

  /* Interaction */
  transition-all duration-200
  hover:shadow-md hover:shadow-slate-200/70
  dark:hover:shadow-slate-900/70

  p-6
`}>
  {/* Content */}
</div>
```

### Primary Surface (Modal/Panel)

For prominent, focused content:

```tsx
<motion.div className={`
  fixed inset-0 z-50
  bg-black/40
  backdrop-blur-md
  flex items-center justify-center
`}>
  <motion.div className={`
    relative
    rounded-2xl
    border border-slate-200/40
    dark:border-slate-700/40

    bg-white/90
    dark:bg-slate-900/90

    backdrop-blur-xl

    shadow-xl
    shadow-slate-200/50
    dark:shadow-slate-950/50

    max-w-lg w-full
    p-8
  `}>
    {/* Modal content */}
  </motion.div>
</motion.div>
```

### Secondary Surface (Card/Section)

For nested or less-prominent content:

```tsx
<div className={`
  rounded-xl
  border border-slate-200/40
  dark:border-slate-700/40

  bg-white/40
  dark:bg-slate-800/40

  backdrop-blur-md

  shadow-sm

  p-4
`}>
  {/* Card content */}
</div>
```

### Tertiary Surface (Overlay/Badge)

For very light, minimal elements:

```tsx
<span className={`
  inline-block
  px-3 py-1
  rounded-lg

  bg-blue-100/40
  dark:bg-blue-900/30

  backdrop-blur-sm

  text-blue-900
  dark:text-blue-100
  text-sm
`}>
  Label
</span>
```

---

## Hover & Interactive States

### Standard Hover Effect

```tsx
<motion.div
  whileHover={{
    boxShadow: '0 12px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.5) inset',
    transition: { duration: 0.15 },
  }}
  className="..."
>
  {/* Content */}
</motion.div>
```

**Effect:**
- Stronger shadow for elevation
- Inner ring for glass reflection
- 150ms smooth transition
- Responsive to mouse presence

### Prismatic Shimmer Effect

```tsx
<div className="group relative rounded-2xl ...">
  {/* Main content */}

  {/* Shimmer overlay */}
  <div
    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"
    style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(147,197,253,0.1) 50%, rgba(255,255,255,0) 100%)',
    }}
  />
</div>
```

**Effect:**
- Diagonal shimmer across surface
- Blue-tinted light reflection
- Smooth 300ms fade in/out
- Creates prismatic light effect

### Bottom Glass Reflection

```tsx
<div className="relative rounded-xl ...">
  {/* Content */}

  {/* Bottom accent line */}
  <div
    className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none"
  />
</div>
```

**Effect:**
- Thin highlight line at bottom
- Suggests light reflection
- Creates glass-like appearance
- Enhances depth perception

---

## Color Application

### Light Mode Palette

```css
/* Primary backgrounds */
--bg-primary: rgba(255, 255, 255, 0.8);    /* 80% white */
--bg-secondary: rgba(255, 255, 255, 0.4);  /* 40% white */
--bg-tertiary: rgba(255, 255, 255, 0.25);  /* 25% white */

/* Accent backgrounds */
--bg-blue: rgba(219, 234, 254, 0.4);       /* Light blue */
--bg-red: rgba(254, 226, 226, 0.4);        /* Light red */
--bg-green: rgba(220, 252, 231, 0.4);      /* Light green */

/* Text colors */
--text-primary: #09090B;                    /* zinc-950 */
--text-secondary: #3F3F46;                  /* zinc-700 */
--text-muted: #71717A;                      /* zinc-500 */

/* Border colors */
--border-light: rgba(229, 231, 235, 0.5);  /* Subtle gray */
--border-strong: rgba(229, 231, 235, 0.8); /* More visible */
```

### Dark Mode Palette

```css
/* Primary backgrounds */
--bg-primary: rgba(10, 10, 10, 0.95);      /* 95% black */
--bg-secondary: rgba(20, 20, 20, 0.8);     /* 80% dark */
--bg-tertiary: rgba(30, 30, 30, 0.6);      /* 60% dark */

/* Accent backgrounds */
--bg-blue: rgba(30, 58, 138, 0.4);         /* Dark blue */
--bg-red: rgba(127, 29, 29, 0.4);          /* Dark red */
--bg-green: rgba(20, 83, 56, 0.4);         /* Dark green */

/* Text colors */
--text-primary: #FAFAFA;                    /* zinc-50 */
--text-secondary: #D4D4D8;                  /* zinc-300 */
--text-muted: #A1A1AA;                      /* zinc-400 */

/* Border colors */
--border-light: rgba(39, 39, 42, 0.5);     /* Subtle dark */
--border-strong: rgba(39, 39, 42, 0.8);    /* More visible */
```

---

## Animation Easing

### Fluid Easing Curve

The Liquid Glass aesthetic uses a custom easing function that feels natural and responsive:

```typescript
const fluidEasing = [0.2, 0.8, 0.2, 1] as const
// cubic-bezier(0.2, 0.8, 0.2, 1)
```

**Characteristics:**
- Quick start (accelerates initially)
- Smooth middle
- Natural deceleration at end
- Feels "weighty" and intentional
- Not overly bouncy or stiff

### Timing Scale

```typescript
// Micro-interactions (immediate feedback)
duration: 0.15s (150ms)
// Usage: Hover, toggle, toggle switches

// Standard interactions (responsive feel)
duration: 0.2s (200ms)
// Usage: Button clicks, input focus, card transitions

// Moderate transitions (deliberate movement)
duration: 0.3s (300ms)
// Usage: Panel open/close, content reveal, hover shimmer

// Deliberate animations (draw attention)
duration: 0.4s (400ms)
// Usage: Modal entrance, focus transitions, major reveals
```

### Framer Motion Variants

```typescript
// Fade in (standard entrance)
const fadeInVariant: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.2, 0.8, 0.2, 1],
    },
  },
}

// Slide up with fade (element entrance from bottom)
const slideUpVariant: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.2, 0.8, 0.2, 1],
    },
  },
}

// Scale on hover (micro-interaction)
const scaleHoverVariant: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.15,
      ease: [0.2, 0.8, 0.2, 1],
    },
  },
}

// Expand height (disclosure animation)
const expandVariant: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: [0.2, 0.8, 0.2, 1],
    },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      duration: 0.15,
      ease: [0.2, 0.8, 0.2, 1],
    },
  },
}
```

---

## Complete Component Examples

### Example 1: Liquid Glass Card

```tsx
import { motion } from 'framer-motion'

export function GlassCard({ title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      whileHover={{
        boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
      }}
      className={`
        relative rounded-xl
        border border-slate-200/50 dark:border-slate-700/50
        bg-gradient-to-br from-slate-50/80 to-white/60
        dark:from-slate-900/80 dark:to-slate-800/60
        backdrop-blur-md
        shadow-sm shadow-slate-200/50 dark:shadow-slate-900/50
        p-6
        transition-all duration-200
        group
      `}
    >
      {/* Shimmer overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(147,197,253,0.1) 50%, rgba(255,255,255,0) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
          {title}
        </h3>
        <div className="text-slate-600 dark:text-slate-400">
          {children}
        </div>
      </div>

      {/* Bottom reflection line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none"
      />
    </motion.div>
  )
}
```

### Example 2: Liquid Glass Modal

```tsx
import { motion, AnimatePresence } from 'framer-motion'

export function GlassModal({ isOpen, onClose, title, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={`
              relative rounded-2xl
              border border-slate-200/40 dark:border-slate-700/40
              bg-white/90 dark:bg-slate-900/90
              backdrop-blur-xl
              shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50
              max-w-lg w-full
              p-8
              group
            `}
          >
            {/* Shimmer */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(147,197,253,0.1) 50%, rgba(255,255,255,0) 100%)',
              }}
            />

            {/* Content */}
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                {title}
              </h2>
              <div className="text-slate-600 dark:text-slate-400 mb-8">
                {children}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>

            {/* Bottom line */}
            <div
              className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

### Example 3: Liquid Glass Button with Shimmer

```tsx
import { motion } from 'framer-motion'

export function GlassButton({ children, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative
        px-6 py-3
        rounded-lg

        bg-blue-500 hover:bg-blue-600
        text-white font-medium

        shadow-lg shadow-blue-500/30
        hover:shadow-xl hover:shadow-blue-500/40

        transition-all duration-200
        group

        overflow-hidden
      `}
    >
      {/* Inner shine effect */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'radial-gradient(circle at top left, rgba(255,255,255,0.3), transparent)',
        }}
      />

      {/* Text */}
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}
```

---

## Implementation Checklist

When building a new component with Liquid Glass:

- [ ] Use `backdrop-blur-*` for glass effect
- [ ] Apply layered opacity for depth
- [ ] Add subtle gradient for dimension
- [ ] Include bottom reflection line for elegance
- [ ] Implement prismatic shimmer on hover
- [ ] Use fluid easing `[0.2, 0.8, 0.2, 1]`
- [ ] Keep animation duration 150-400ms
- [ ] Test light and dark modes
- [ ] Verify color contrast (WCAG AA minimum)
- [ ] Ensure motion respects `prefers-reduced-motion`
- [ ] Document animation behavior

---

## Browser Support

| Feature | Chrome | Firefox | Safari | Notes |
|---------|--------|---------|--------|-------|
| Backdrop Filter | ✅ Full | ✅ Full | ✅ Full | Wide support |
| CSS Gradients | ✅ Full | ✅ Full | ✅ Full | Standard feature |
| Framer Motion | ✅ Full | ✅ Full | ✅ Full | GPU acceleration |
| RGBA Colors | ✅ Full | ✅ Full | ✅ Full | Standard CSS |
| Dark Mode | ✅ Full | ✅ Full | ✅ Full | CSS variables |

**Mobile:**
- iOS Safari: ✅ Full support
- Android Chrome: ✅ Full support
- Performance: May be reduced on older devices (reduce blur for performance)

---

## Accessibility Considerations

### Reduced Motion

```tsx
// Respect user's motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const animationConfig = prefersReducedMotion
  ? { duration: 0 } // No animation
  : { duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }
```

### Color Contrast

- Ensure sufficient contrast between background and text
- Test in light and dark modes
- Verify with accessibility tools
- Minimum WCAG AA (4.5:1 for text)

### Alternative Indicators

- Don't rely solely on color or blur to indicate meaning
- Use text labels, icons, or semantic HTML
- Provide clear affordances for interactive elements

---

## Performance Optimization

### Reduce Blur for Performance

On slower devices, reduce blur effects:

```tsx
// Detect performance
const isLowEndDevice = navigator.deviceMemory < 4

const blurAmount = isLowEndDevice ? 'blur-sm' : 'blur-xl'

<div className={`backdrop-${blurAmount}`} />
```

### Use Hardware Acceleration

```tsx
// Enable GPU acceleration
<div
  className="..."
  style={{
    transform: 'translateZ(0)', // Force GPU rendering
    willChange: 'transform',
  }}
/>
```

### Avoid Excessive Effects

```tsx
// ❌ Too many effects - sluggish
<div className="backdrop-blur-xl shadow-xl shadow-blue-500/50">
  <div className="shimmer-overlay" />
  <div className="inner-glow" />
  <div className="reflection-line" />
</div>

// ✅ Essential effects only - smooth
<div className="backdrop-blur-md shadow-lg">
  <div className="shimmer-overlay" />
</div>
```

---

## Troubleshooting

### Blur Not Visible

**Problem:** Backdrop blur isn't showing
- **Check:** Browser support (all modern browsers support it)
- **Check:** Parent element has `position: relative`
- **Check:** No `overflow: hidden` preventing effect
- **Solution:** Use `isolation: isolate` on parent

### Colors Look Different Light/Dark

**Problem:** Colors don't match in dark mode
- **Check:** Using CSS variables properly
- **Check:** Dark mode selector is working
- **Check:** Opacity values are appropriate for both modes
- **Solution:** Test with `data-theme="dark"` attribute

### Animation Stuttering

**Problem:** Animations feel janky
- **Check:** GPU acceleration enabled
- **Check:** Reduce number of effects
- **Check:** Use `will-change` property
- **Solution:** Profile with DevTools

---

## Design Resources

### Reference Files
- DESIGN_SYSTEM.md - Complete system reference
- animation-patterns-research.md - Animation studies
- 2026-design-compliance-report.md - Compliance details

### Component Examples
- ProgressiveDisclosure - Liquid glass with animations
- DiffViewer - Subtle glass effects
- CommandMenu - Floating glass panel

---

## Quick Reference

### Common Class Combinations

```tsx
// Primary container
'relative rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-slate-50/80 to-white/60 dark:from-slate-900/80 dark:to-slate-800/60 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-200'

// Modal overlay
'fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center'

// Glass accent
'bg-blue-100/40 dark:bg-blue-900/30 backdrop-blur-sm'

// Hover shimmer
'opacity-0 group-hover:opacity-100 transition-opacity duration-300'
```

### Easing Reference

```typescript
// Fluid easing (standard for Liquid Glass)
[0.2, 0.8, 0.2, 1]

// Out-expo (snappy, responsive)
[0.16, 1, 0.3, 1]

// In-out-smooth (smooth, deliberate)
[0.45, 0, 0.55, 1]
```

---

**Last Updated:** January 2026
**Design Version:** 2026.1
**Maintained By:** praDeep Design Team

---

## Additional Resources

For more information on component-specific Liquid Glass usage, see:
- progressive-disclosure.md
- diff-viewer.md
- command-menu.md
- README.md (component overview)
