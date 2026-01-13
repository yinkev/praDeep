'use client'

/**
 * Skeleton Loading Examples
 *
 * This file demonstrates all the skeleton loading components
 * available in the praDeep design system.
 */

import { Skeleton, EditorSkeleton, ChartSkeleton, CardSkeleton } from './Skeleton'
import { SkeletonCard } from './SkeletonCard'
import { SkeletonList } from './SkeletonList'
import { SkeletonText } from './SkeletonText'

export function SkeletonExamples() {
  return (
    <div className="space-y-12 p-8">
      <section>
        <h2 className="text-title font-semibold mb-6">Base Skeleton Components</h2>
        <div className="space-y-4">
          <div>
            <p className="text-meta text-text-tertiary mb-2">Shimmer Animation (Default)</p>
            <Skeleton className="h-12 w-full" animation="shimmer" />
          </div>
          <div>
            <p className="text-meta text-text-tertiary mb-2">Pulse Animation</p>
            <Skeleton className="h-12 w-full" animation="pulse" />
          </div>
          <div className="flex gap-4">
            <div>
              <p className="text-meta text-text-tertiary mb-2">Circular</p>
              <Skeleton variant="circular" className="h-16 w-16" />
            </div>
            <div>
              <p className="text-meta text-text-tertiary mb-2">Text</p>
              <Skeleton variant="text" className="w-48" />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-title font-semibold mb-6">Skeleton Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-meta text-text-tertiary mb-2">Default Card</p>
            <SkeletonCard />
          </div>
          <div>
            <p className="text-meta text-text-tertiary mb-2">Compact Card</p>
            <SkeletonCard variant="compact" />
          </div>
          <div>
            <p className="text-meta text-text-tertiary mb-2">Detailed Card</p>
            <SkeletonCard variant="detailed" showActions />
          </div>
          <div>
            <p className="text-meta text-text-tertiary mb-2">Card without Avatar</p>
            <SkeletonCard showAvatar={false} lines={3} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-title font-semibold mb-6">Skeleton Lists</h2>
        <div className="space-y-8">
          <div>
            <p className="text-meta text-text-tertiary mb-2">Simple List (3 rows)</p>
            <SkeletonList rows={3} />
          </div>
          <div>
            <p className="text-meta text-text-tertiary mb-2">Compact List with Dividers</p>
            <SkeletonList variant="compact" rows={4} showDivider />
          </div>
          <div>
            <p className="text-meta text-text-tertiary mb-2">Detailed List</p>
            <SkeletonList variant="detailed" rows={2} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-title font-semibold mb-6">Skeleton Text</h2>
        <div className="space-y-8">
          <div>
            <p className="text-meta text-text-tertiary mb-2">Paragraph (Default)</p>
            <SkeletonText lines={4} />
          </div>
          <div>
            <p className="text-meta text-text-tertiary mb-2">Heading</p>
            <SkeletonText variant="heading" />
          </div>
          <div>
            <p className="text-meta text-text-tertiary mb-2">Caption</p>
            <SkeletonText variant="caption" lines={3} />
          </div>
          <div>
            <p className="text-meta text-text-tertiary mb-2">Mixed (Title + Body)</p>
            <SkeletonText variant="mixed" lines={5} lastLineWidth="60%" />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-title font-semibold mb-6">Specialized Skeletons</h2>
        <div className="space-y-6">
          <div>
            <p className="text-meta text-text-tertiary mb-2">Editor Skeleton</p>
            <EditorSkeleton />
          </div>
          <div>
            <p className="text-meta text-text-tertiary mb-2">Chart Skeleton</p>
            <ChartSkeleton />
          </div>
          <div>
            <p className="text-meta text-text-tertiary mb-2">Card Skeleton (Legacy)</p>
            <CardSkeleton />
          </div>
        </div>
      </section>
    </div>
  )
}

export default SkeletonExamples
