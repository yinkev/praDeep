"use client"

import { createContext, useContext, useEffect, useState, useRef } from "react"
import { motion, useReducedMotion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

// Size presets
export type SizePresets = "compact" | "large" | "tall" | "long" | "medium" | "ultra"

// Context
type DynamicIslandContextType = {
  size: SizePresets
  setSize: (size: SizePresets) => void
  previousSize: SizePresets
  isAnimating: boolean
}

const DynamicIslandContext = createContext<DynamicIslandContextType | undefined>(undefined)

export function DynamicIslandProvider({
  children,
  initialSize = "compact",
}: {
  children: React.ReactNode
  initialSize?: SizePresets
}) {
  const [size, setSize] = useState<SizePresets>(initialSize)
  const [previousSize, setPreviousSize] = useState<SizePresets>(initialSize)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleSetSize = (newSize: SizePresets) => {
    if (newSize === size) return
    setPreviousSize(size)
    setSize(newSize)
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 600) // Match transition duration
  }

  return (
    <DynamicIslandContext.Provider
      value={{
        size,
        setSize: handleSetSize,
        previousSize,
        isAnimating,
      }}
    >
      {children}
    </DynamicIslandContext.Provider>
  )
}

export function useDynamicIslandSize() {
  const context = useContext(DynamicIslandContext)
  if (!context) {
    throw new Error("useDynamicIslandSize must be used within a DynamicIslandProvider")
  }
  return context
}

// Main Component
export function DynamicIsland({
  children,
  className,
  id,
  ...props
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  const { size } = useDynamicIslandSize()
  const shouldReduceMotion = useReducedMotion()

  const variants = {
    compact: { width: 120, height: 40, borderRadius: 24 },
    large: { width: 300, height: 160, borderRadius: 32 },
    tall: { width: 200, height: 300, borderRadius: 32 },
    long: { width: 300, height: 60, borderRadius: 28 },
    medium: { width: 240, height: 140, borderRadius: 28 },
    ultra: { width: 340, height: 200, borderRadius: 32 },
  }

  return (
    <motion.div
      id={id}
      layout
      variants={variants}
      initial={false}
      animate={size}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
        duration: shouldReduceMotion ? 0 : 0.5,
      }}
      className={cn(
        "relative mx-auto bg-black text-white shadow-2xl overflow-hidden backdrop-blur-xl border border-white/10 z-50",
        className
      )}
      {...props}
    >
      <div className="relative h-full w-full">{children}</div>
    </motion.div>
  )
}

// Helpers
export function DynamicContainer({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(4px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, filter: "blur(4px)" }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={cn("h-full w-full", className)}
    >
      {children}
    </motion.div>
  )
}

export function DynamicTitle({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <h3 className={cn("text-lg font-bold", className)}>{children}</h3>
}

export function DynamicDescription({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <p className={cn("text-sm text-neutral-400", className)}>{children}</p>
}

export function DynamicDiv({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={className}>{children}</div>
}
