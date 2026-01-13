'use client'

import { LazyMotion, domAnimation } from 'framer-motion'
import { ReactNode } from 'react'

/**
 * MotionProvider wraps the app with LazyMotion for optimized framer-motion bundle size.
 * Using domAnimation feature set (smaller bundle) instead of full framer-motion features.
 *
 * This reduces the framer-motion bundle from ~60KB to ~25KB.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>{children}</LazyMotion>
  )
}

export default MotionProvider
