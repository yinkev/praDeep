import { Variants, Transition } from 'framer-motion'

// Timing constants
export const duration = {
  instant: 0,
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  slower: 0.7,
} as const

// Easing functions
export const easing = {
  // Default out-expo - smooth deceleration
  default: [0.16, 1, 0.3, 1] as const,
  // Gentle ease-out
  gentle: [0.4, 0, 0.2, 1] as const,
  // Snappy ease-in-out
  snappy: [0.87, 0, 0.13, 1] as const,
  // Linear
  linear: [0, 0, 1, 1] as const,
}

// Spring configurations
export const spring = {
  tight: { type: 'spring', stiffness: 400, damping: 30 } as const,
  gentle: { type: 'spring', stiffness: 200, damping: 20 } as const,
  bouncy: { type: 'spring', stiffness: 300, damping: 15 } as const,
}

// Reusable variants
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.normal, ease: easing.default } },
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: easing.default } },
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: easing.default } },
}

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: duration.normal, ease: easing.default } },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: duration.normal, ease: easing.default } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.normal, ease: easing.default },
  },
}

// Stagger container
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: easing.default },
  },
}

// Modal variants
export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.fast } },
  exit: { opacity: 0, transition: { duration: duration.fast } },
}

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: duration.normal, ease: easing.default },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: duration.fast },
  },
}

// Toast variants
export const toastSlideIn: Variants = {
  hidden: { opacity: 0, x: 100, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { ...spring.tight },
  },
  exit: {
    opacity: 0,
    x: 100,
    transition: { duration: duration.fast, ease: easing.default },
  },
}

// Button interaction
export const buttonTap = {
  scale: 0.98,
  transition: { duration: duration.instant },
}

export const buttonHover = {
  scale: 1.02,
  transition: { duration: duration.fast, ease: easing.default },
}

// Card hover
export const cardHover = {
  y: -2,
  boxShadow: '0 12px 28px rgba(0, 0, 0, 0.08)',
  transition: { duration: duration.normal, ease: easing.default },
}

// Page transition
export const pageTransition: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: duration.normal, ease: easing.default },
  },
  exit: {
    opacity: 0,
    transition: { duration: duration.fast },
  },
}

// Utility: get transition with custom duration
export const getTransition = (dur: number = duration.normal): Transition => ({
  duration: dur,
  ease: easing.default,
})

// Reduced motion hook helper
export const reducedMotionVariants = (variants: Variants): Variants => ({
  ...variants,
  visible: {
    ...variants.visible,
    transition: { duration: 0 },
  },
})
