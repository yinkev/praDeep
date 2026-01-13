'use client'

import * as React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Carousel Component - Liquid Glass Design System
 * ChatGPT-style horizontal carousel with touch/keyboard navigation
 * Optimized for 3-8 items with scannability and smooth interactions
 */

export interface CarouselProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  children: React.ReactNode
  /** Number of items visible at once (responsive) */
  itemsPerView?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  /** Gap between items in pixels */
  gap?: number
  /** Show navigation arrows */
  showArrows?: boolean
  /** Enable drag/swipe */
  enableDrag?: boolean
  /** Snap to items when scrolling */
  snapToItems?: boolean
  /** Current scroll index (controlled) */
  currentIndex?: number
  /** Callback when scroll index changes */
  onIndexChange?: (index: number) => void
  /** Aria label for accessibility */
  ariaLabel?: string
}

export const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  (
    {
      children,
      itemsPerView = { mobile: 1.2, tablet: 2.5, desktop: 3.5 },
      gap = 16,
      showArrows = true,
      enableDrag = true,
      snapToItems = true,
      currentIndex: controlledIndex,
      onIndexChange,
      ariaLabel = 'Carousel',
      className,
      ...props
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const [internalIndex, setInternalIndex] = useState(0)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)
    const [itemWidth, setItemWidth] = useState(0)
    const [visibleItems, setVisibleItems] = useState(itemsPerView.desktop || 3.5)
    const dragX = useMotionValue(0)

    // Use controlled or uncontrolled index
    const currentIndex = controlledIndex !== undefined ? controlledIndex : internalIndex

    // Convert children to array for counting
    const childArray = React.Children.toArray(children)
    const totalItems = childArray.length

    // Update scroll button visibility
    const updateScrollButtons = useCallback(() => {
      const scroll = scrollRef.current
      if (!scroll) return

      const scrollLeft = scroll.scrollLeft
      const scrollWidth = scroll.scrollWidth
      const clientWidth = scroll.clientWidth
      const maxScroll = scrollWidth - clientWidth

      setCanScrollLeft(scrollLeft > 1)
      setCanScrollRight(scrollLeft < maxScroll - 1)
    }, [])

    // Calculate item width and visible items based on screen size
    const updateDimensions = useCallback(() => {
      const container = containerRef.current
      if (!container) return

      const width = container.offsetWidth
      let items = itemsPerView.desktop || 3.5

      // Responsive breakpoints
      if (width < 640) {
        items = itemsPerView.mobile || 1.2
      } else if (width < 1024) {
        items = itemsPerView.tablet || 2.5
      }

      setVisibleItems(items)
      setItemWidth((width - gap * (Math.floor(items) - 1)) / items)
    }, [itemsPerView, gap])

    // Scroll to specific index
    const scrollToIndex = useCallback(
      (index: number, behavior: ScrollBehavior = 'smooth') => {
        const scroll = scrollRef.current
        if (!scroll) return

        const targetIndex = Math.max(0, Math.min(index, totalItems - 1))
        const scrollPosition = targetIndex * (itemWidth + gap)

        scroll.scrollTo({
          left: scrollPosition,
          behavior,
        })

        if (controlledIndex === undefined) {
          setInternalIndex(targetIndex)
        }
        onIndexChange?.(targetIndex)
      },
      [itemWidth, gap, totalItems, controlledIndex, onIndexChange]
    )

    // Navigation handlers
    const scrollLeft = useCallback(() => {
      const newIndex = Math.max(0, currentIndex - 1)
      scrollToIndex(newIndex)
    }, [currentIndex, scrollToIndex])

    const scrollRight = useCallback(() => {
      const newIndex = Math.min(totalItems - 1, currentIndex + 1)
      scrollToIndex(newIndex)
    }, [currentIndex, totalItems, scrollToIndex])

    // Keyboard navigation
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault()
            scrollLeft()
            break
          case 'ArrowRight':
            e.preventDefault()
            scrollRight()
            break
          case 'Home':
            e.preventDefault()
            scrollToIndex(0)
            break
          case 'End':
            e.preventDefault()
            scrollToIndex(totalItems - 1)
            break
        }
      },
      [scrollLeft, scrollRight, scrollToIndex, totalItems]
    )

    // Drag end handler
    const handleDragEnd = useCallback(
      (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const scroll = scrollRef.current
        if (!scroll) return

        const threshold = 50
        const velocity = info.velocity.x

        if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 500) {
          if (info.offset.x > 0 || velocity > 500) {
            scrollLeft()
          } else if (info.offset.x < 0 || velocity < -500) {
            scrollRight()
          }
        }

        dragX.set(0)
      },
      [scrollLeft, scrollRight, dragX]
    )

    // Update on scroll
    const handleScroll = useCallback(() => {
      const scroll = scrollRef.current
      if (!scroll) return

      updateScrollButtons()

      // Update current index based on scroll position
      if (snapToItems && controlledIndex === undefined) {
        const scrollLeft = scroll.scrollLeft
        const newIndex = Math.round(scrollLeft / (itemWidth + gap))
        if (newIndex !== internalIndex) {
          setInternalIndex(newIndex)
          onIndexChange?.(newIndex)
        }
      }
    }, [
      updateScrollButtons,
      snapToItems,
      controlledIndex,
      itemWidth,
      gap,
      internalIndex,
      onIndexChange,
    ])

    // Setup resize observer and scroll listener
    useEffect(() => {
      updateDimensions()
      updateScrollButtons()

      const resizeObserver = new ResizeObserver(() => {
        updateDimensions()
        updateScrollButtons()
      })

      const scroll = scrollRef.current
      if (scroll) {
        resizeObserver.observe(scroll)
        scroll.addEventListener('scroll', handleScroll, { passive: true })
      }

      return () => {
        resizeObserver.disconnect()
        scroll?.removeEventListener('scroll', handleScroll)
      }
    }, [updateDimensions, updateScrollButtons, handleScroll])

    // Check if all items are visible (hide arrows)
    const allItemsVisible = totalItems <= Math.floor(visibleItems)
    const showNavigationArrows = showArrows && !allItemsVisible

    return (
      <div
        ref={ref}
        className={cn('relative group', className)}
        onKeyDown={handleKeyDown}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        {...props}
      >
        <div ref={containerRef} className="relative">
          {/* Left Arrow */}
          {showNavigationArrows && (
            <motion.button
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className={cn(
                // Positioning - absolute left with safe spacing
                'absolute left-2 top-1/2 -translate-y-1/2 z-10',
                // Glass morphism with liquid aesthetic
                'bg-white/70 dark:bg-zinc-950/70',
                'backdrop-blur-md',
                'border border-border/50 dark:border-border/30',
                'shadow-sm dark:shadow-zinc-950/40',
                'rounded-xl',
                // Size and layout
                'w-10 h-10',
                'flex items-center justify-center',
                // Transitions - fast 150ms
                'transition-all duration-[150ms]',
                '[transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)]',
                // Interactive states
                !canScrollLeft
                  ? 'opacity-0 pointer-events-none'
                  : [
                      'opacity-0 group-hover:opacity-100',
                      'hover:bg-white/90 dark:hover:bg-zinc-950/90',
                      'hover:border-border/70 dark:hover:border-border/40',
                      'hover:shadow-md dark:hover:shadow-zinc-950/60',
                      'hover:scale-105',
                      'active:scale-95',
                    ],
                // Focus states
                'focus:outline-none',
                'focus-visible:opacity-100',
                'focus-visible:ring-2 focus-visible:ring-zinc-400/50 dark:focus-visible:ring-zinc-500/50',
                'focus-visible:ring-offset-2',
                // Disabled state
                'disabled:opacity-0 disabled:pointer-events-none'
              )}
              aria-label="Scroll left"
              initial={{ opacity: 0 }}
              animate={{ opacity: canScrollLeft ? 1 : 0 }}
              transition={{ duration: 0.15 }}
            >
              <ChevronLeft className="w-5 h-5 text-text-primary" strokeWidth={2.5} />
            </motion.button>
          )}

          {/* Scrollable Container */}
          <motion.div
            ref={scrollRef}
            className={cn(
              'overflow-x-auto overflow-y-hidden',
              'scrollbar-hide',
              // Snap scrolling
              snapToItems && 'snap-x snap-mandatory',
              // Touch optimization
              'touch-pan-x',
              // Hide scrollbar
              '[&::-webkit-scrollbar]:hidden',
              '[-ms-overflow-style:none]',
              '[scrollbar-width:none]'
            )}
            drag={enableDrag ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            style={{ x: dragX }}
          >
            <div
              className="flex"
              style={{
                gap: `${gap}px`,
                paddingLeft: showNavigationArrows ? '48px' : '0',
                paddingRight: showNavigationArrows ? '48px' : '0',
              }}
            >
              {React.Children.map(children, (child, index) => (
                <motion.div
                  key={index}
                  className={cn(
                    'flex-shrink-0',
                    snapToItems && 'snap-start',
                    // Focus management
                    'focus-within:z-10'
                  )}
                  style={{ width: `${itemWidth}px` }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: index * 0.05,
                    ease: [0.2, 0.8, 0.2, 1],
                  }}
                >
                  {child}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Arrow */}
          {showNavigationArrows && (
            <motion.button
              onClick={scrollRight}
              disabled={!canScrollRight}
              className={cn(
                // Positioning - absolute right with safe spacing
                'absolute right-2 top-1/2 -translate-y-1/2 z-10',
                // Glass morphism with liquid aesthetic
                'bg-white/70 dark:bg-zinc-950/70',
                'backdrop-blur-md',
                'border border-border/50 dark:border-border/30',
                'shadow-sm dark:shadow-zinc-950/40',
                'rounded-xl',
                // Size and layout
                'w-10 h-10',
                'flex items-center justify-center',
                // Transitions - fast 150ms
                'transition-all duration-[150ms]',
                '[transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)]',
                // Interactive states
                !canScrollRight
                  ? 'opacity-0 pointer-events-none'
                  : [
                      'opacity-0 group-hover:opacity-100',
                      'hover:bg-white/90 dark:hover:bg-zinc-950/90',
                      'hover:border-border/70 dark:hover:border-border/40',
                      'hover:shadow-md dark:hover:shadow-zinc-950/60',
                      'hover:scale-105',
                      'active:scale-95',
                    ],
                // Focus states
                'focus:outline-none',
                'focus-visible:opacity-100',
                'focus-visible:ring-2 focus-visible:ring-zinc-400/50 dark:focus-visible:ring-zinc-500/50',
                'focus-visible:ring-offset-2',
                // Disabled state
                'disabled:opacity-0 disabled:pointer-events-none'
              )}
              aria-label="Scroll right"
              initial={{ opacity: 0 }}
              animate={{ opacity: canScrollRight ? 1 : 0 }}
              transition={{ duration: 0.15 }}
            >
              <ChevronRight className="w-5 h-5 text-text-primary" strokeWidth={2.5} />
            </motion.button>
          )}
        </div>

        {/* Progress Indicator (Optional - for visual feedback) */}
        {!allItemsVisible && totalItems > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {Array.from({ length: Math.min(totalItems, 8) }).map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToIndex(index)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-[150ms]',
                  '[transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)]',
                  'focus:outline-none',
                  'focus-visible:ring-2 focus-visible:ring-zinc-400/50',
                  'focus-visible:ring-offset-2',
                  index === currentIndex
                    ? 'w-6 bg-text-primary'
                    : 'w-1.5 bg-text-quaternary hover:bg-text-tertiary'
                )}
                aria-label={`Go to item ${index + 1}`}
                aria-current={index === currentIndex ? 'true' : 'false'}
              />
            ))}
          </div>
        )}
      </div>
    )
  }
)

Carousel.displayName = 'Carousel'

export default Carousel
