# Animation Patterns Research (Liquid Cloud)

This document synthesizes modern motion patterns across leading design systems to guide praDeep's Liquid Cloud animation strategy. References are provided for future verification.

References (official sources, unverified in this run):
- Linear - https://linear.app/design
- Vercel - https://vercel.com/design
- Stripe - https://stripe.com/docs/design
- Framer - https://www.framer.com/docs/
- Raycast - https://www.raycast.com
- Arc Browser - https://arc.net

---

## Executive Summary: Key Trends in 2026 Animation Design

Modern systems converge on fast, subtle motion that reinforces clarity without stealing focus. Linear and Raycast favor crisp micro-interactions and short fades that make dense UIs feel lighter. Vercel leans into minimal, production-friendly transitions that feel instantaneous with slight spatial hints. Stripe and Arc Browser tend to layer depth and continuity with gentle easing, showing more dimensionality in overlays and nested surfaces. Framer remains the expressive reference for orchestration and multi-step motion, but still keeps functional UI patterns grounded with consistent timing.

Common threads:
- Motion is utility-first: confirm, guide, and compress time-to-understand.
- Defaults skew faster (120-240ms) with a small number of easing curves.
- Layered UIs rely on shared layout transitions for continuity.
- Gestures and drag affordances adopt spring physics with tight damping.
- Accessibility is standard, not optional: prefers-reduced-motion is respected by default.

Liquid Cloud should adopt a restrained, precise motion language with a small palette of durations and easings, reserving expressive choreography for onboarding and exceptional moments.

---

## Animation Categories (By Use Case)

### 1) Micro-interactions (buttons, toggles, checkboxes)
**Pattern:** Press feedback via subtle scale (0.98-0.99), short opacity or background changes, quick snap back. Linear and Raycast reflect this style: fast, no bounce, slight easing in/out.

**Example uses:** Primary CTA press, toggle switch, checkmark confirmation.

### 2) Hover and Focus Feedback
**Pattern:** Soft elevation shift, border/intensity change, and 2-4px translate for focus clarity. Vercel and Linear keep these to 100-160ms with low amplitude.

**Example uses:** List rows, cards, inline actions, input focus.

### 3) Page/Route Transitions
**Pattern:** Small y-axis translate (6-12px) with fade, or crossfade on route change. Stripe uses clear structural continuity; Framer favors shared-layout animations for hero transitions.

**Example uses:** Page change, tabs, workspace switching.

### 4) Overlays and Modals
**Pattern:** Fade backdrop + scale/translate content. Arc and Stripe often add soft blur depth; keep blur modest and short for performance.

**Example uses:** Dialogs, side sheets, command palette.

### 5) List and Content Orchestration
**Pattern:** Staggered entrance at 12-40ms offsets with short distance. Framer and Linear use predictable stagger to support scanning.

**Example uses:** Task lists, search results, notification stacks.

### 6) Loading States
**Pattern:** Skeleton shimmer or pulse; avoid looping large areas. Vercel and Linear use subtle opacity oscillations.

**Example uses:** Cards, tables, inline content.

### 7) Data Visualization
**Pattern:** Progressive reveal with spring or smooth ease; start from baseline, avoid bounce on charts unless playful intent.

**Example uses:** Progress bars, KPI change, chart transitions.

### 8) Drag, Reorder, and Gestures
**Pattern:** Springs with tight damping to feel anchored. Raycast and Framer emphasize immediate response and clean settle.

**Example uses:** Drag to reorder, slider, swipe actions.

### 9) Notifications and Toasts
**Pattern:** Short slide-in from edge, fade out; queue and stack cleanly. Stripe-style UIs add subtle elevation.

**Example uses:** Success toast, error banner, background sync updates.

---

## Timing and Easing Reference

Use a small set of motion tokens. Default to faster transitions; reserve slow curves for large, content-heavy changes.

| Token | Duration | Easing | Usage |
| --- | --- | --- | --- |
| `duration.instant` | 80-100ms | `easeOut` | Hover, focus, tiny UI feedback |
| `duration.fast` | 120-160ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Button press, subtle hover lift |
| `duration.base` | 180-240ms | `cubic-bezier(0.2, 0.6, 0.2, 1)` | Modals, panels, card transitions |
| `duration.slow` | 260-360ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Page transitions, complex content |
| `spring.tight` | n/a | `spring` (stiffness 500, damping 40) | Drag, reorder, snap |
| `spring.gentle` | n/a | `spring` (stiffness 260, damping 26) | Hero elements, shared layout |

Common easings observed:
- Productive ease-out: `cubic-bezier(0.2, 0.8, 0.2, 1)`
- Smooth ease-in-out: `cubic-bezier(0.2, 0.6, 0.2, 1)`
- Expressive ease: `cubic-bezier(0.16, 1, 0.3, 1)`

---

## Framer Motion Implementation Patterns (React 19 + TypeScript)

All examples are production-ready and can be copied as-is.

### 1) Micro-interaction: Button Press + Hover
```tsx
import { motion, Variants, useReducedMotion } from "framer-motion";

const buttonVariants: Variants = {
  rest: { scale: 1, opacity: 1 },
  hover: { scale: 1.01 },
  press: { scale: 0.985 },
};

export function MotionButton({ children }: { children: React.ReactNode }) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.button
      variants={buttonVariants}
      initial="rest"
      animate="rest"
      whileHover={prefersReduced ? undefined : "hover"}
      whileTap={prefersReduced ? undefined : "press"}
      transition={{ duration: 0.12, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.button>
  );
}
```

### 2) Hover + Focus Lift for Cards
```tsx
import { motion, Variants } from "framer-motion";

const cardVariants: Variants = {
  rest: { y: 0, boxShadow: "0 1px 2px rgba(0,0,0,0.06)" },
  hover: { y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" },
  focus: { y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.14)" },
};

export function MotionCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      tabIndex={0}
      variants={cardVariants}
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileFocus="focus"
      transition={{ duration: 0.14, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

### 3) Page Transition (Route Switch)
```tsx
import { AnimatePresence, motion, Variants } from "framer-motion";

const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

export function PageTransition({ children, routeKey }: {
  children: React.ReactNode;
  routeKey: string;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={routeKey}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.24, ease: [0.2, 0.6, 0.2, 1] }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}
```

### 4) Modal + Backdrop Orchestration
```tsx
import { AnimatePresence, motion, Variants } from "framer-motion";

const backdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modal: Variants = {
  hidden: { opacity: 0, scale: 0.98, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

export function Modal({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdrop}
          transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)" }}
        >
          <motion.div
            variants={modal}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ margin: "10vh auto 0", width: 520 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### 5) List Stagger for Results
```tsx
import { motion, Variants } from "framer-motion";

const list: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
};

export function MotionList({ items }: { items: string[] }) {
  return (
    <motion.ul variants={list} initial="hidden" animate="visible">
      {items.map((value) => (
        <motion.li
          key={value}
          variants={item}
          transition={{ duration: 0.18, ease: [0.2, 0.6, 0.2, 1] }}
        >
          {value}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

### 6) Skeleton Pulse (Loading)
```tsx
import { motion } from "framer-motion";

export function SkeletonBlock() {
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 0.9, 0.6] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      style={{ height: 16, borderRadius: 6, background: "#E4E4E7" }}
    />
  );
}
```

### 7) Shared Layout for Continuity (Cards -> Detail)
```tsx
import { LayoutGroup, motion } from "framer-motion";

export function SharedLayoutExample({ items }: { items: { id: string; title: string }[] }) {
  return (
    <LayoutGroup>
      <div style={{ display: "grid", gap: 12 }}>
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            style={{ padding: 16, borderRadius: 12, background: "white" }}
          >
            {item.title}
          </motion.div>
        ))}
      </div>
    </LayoutGroup>
  );
}
```

### 8) Drag and Reorder with Tight Springs
```tsx
import { Reorder } from "framer-motion";

export function ReorderList({ items, setItems }: {
  items: string[];
  setItems: (items: string[]) => void;
}) {
  return (
    <Reorder.Group axis="y" values={items} onReorder={setItems}>
      {items.map((item) => (
        <Reorder.Item
          key={item}
          value={item}
          transition={{ type: "spring", stiffness: 520, damping: 42 }}
        >
          {item}
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}
```

### 9) Toasts with Queue Behavior
```tsx
import { AnimatePresence, motion } from "framer-motion";

export function Toasts({ toasts }: { toasts: { id: string; text: string }[] }) {
  return (
    <div style={{ position: "fixed", right: 16, bottom: 16, display: "grid", gap: 8 }}>
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ padding: 12, borderRadius: 10, background: "white" }}
          >
            {toast.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

### 10) Data Visualization: Progress Bar
```tsx
import { motion } from "framer-motion";

export function ProgressBar({ value }: { value: number }) {
  return (
    <div style={{ height: 6, borderRadius: 999, background: "#E4E4E7" }}>
      <motion.div
        style={{ height: 6, borderRadius: 999, background: "#3B82F6" }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.3, ease: [0.2, 0.6, 0.2, 1] }}
      />
    </div>
  );
}
```

---

## Accessibility Guidelines

- Respect `prefers-reduced-motion` by disabling non-essential motion and reducing parallax.
- Keep attention-preserving: avoid large motion spanning the entire viewport.
- Provide non-motion cues (color, text, state change) for all interactions.
- Avoid infinite animations on primary content areas; use subtle pulses only for placeholders.
- Keep focus visible; motion should not replace focus rings.

Recommended Framer Motion pattern:
```tsx
import { useReducedMotion } from "framer-motion";

const prefersReduced = useReducedMotion();
const motionSafe = !prefersReduced;
```

---

## Design System Integration (Reusable Variants)

Structure motion tokens alongside color/typography in Liquid Cloud:

- `motion.duration`: `instant`, `fast`, `base`, `slow`
- `motion.easing`: `productive`, `smooth`, `expressive`
- `motion.spring`: `tight`, `gentle`

Example token usage:
```tsx
export const motionTokens = {
  duration: {
    instant: 0.1,
    fast: 0.14,
    base: 0.22,
    slow: 0.32,
  },
  easing: {
    productive: [0.2, 0.8, 0.2, 1] as const,
    smooth: [0.2, 0.6, 0.2, 1] as const,
    expressive: [0.16, 1, 0.3, 1] as const,
  },
  spring: {
    tight: { type: "spring", stiffness: 520, damping: 42 },
    gentle: { type: "spring", stiffness: 260, damping: 26 },
  },
};
```

Variant factory for consistency:
```tsx
import { Variants } from "framer-motion";
import { motionTokens } from "./motionTokens";

export function createFadeLift(distance = 8): Variants {
  return {
    hidden: { opacity: 0, y: distance },
    visible: { opacity: 1, y: 0 },
  };
}

export const fadeLiftTransition = {
  duration: motionTokens.duration.base,
  ease: motionTokens.easing.smooth,
};
```

---

## Performance Considerations

- Avoid animating layout-affecting properties (`width`, `height`, `top`) when possible; prefer `transform` and `opacity`.
- Use `will-change: transform, opacity` sparingly and only for active elements.
- Reduce blur usage on large surfaces; it is costly on lower-end GPUs.
- Use `layout` animations for continuity, but avoid overusing on large lists.
- Gate heavier animations behind visibility (e.g., only animate on mount or when in viewport).

---

## Design System Notes by Reference

These observations map to the styles commonly associated with each system and should be verified against the latest official docs.

- Linear: Fast, minimal transitions; crisp micro-interactions; clear focus on efficiency.
- Vercel: Subtle, production-first motion; simple fades and small spatial shifts.
- Stripe: Layered surfaces; clean modal choreography; clear content continuity.
- Framer: Expressive motion language; strong orchestration and shared layout.
- Raycast: Snappy keyboard-first feedback; tight springs for drag/reorder.
- Arc Browser: Fluid, soft transitions; smooth easing for layered panels.

---

## Actionable Guidance for Liquid Cloud

- Default to `duration.fast` for hover/press, `duration.base` for layout changes.
- Use `ease productive` for functional UI, `ease expressive` for onboarding.
- Prefer shared layout for navigation continuity; keep list animations minimal.
- Reduce motion gracefully via a single `motionSafe` flag pattern.

