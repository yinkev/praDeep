'use client'

import * as React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { cn } from '@/lib/utils'

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--primary))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--info))",
  },
} satisfies ChartConfig

export function ActivityChartDemo({ className }: { className?: string }) {
  const chartData = [
    { month: "January", desktop: 186, mobile: 80 },
    { month: "February", desktop: 305, mobile: 200 },
    { month: "March", desktop: 237, mobile: 120 },
    { month: "April", desktop: 73, mobile: 190 },
    { month: "May", desktop: 209, mobile: 130 },
    { month: "June", desktop: 214, mobile: 140 },
  ]

  return (
    <div className={cn("rounded-xl border border-border bg-surface-elevated/50 p-6 backdrop-blur-md", className)}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold font-serif italic text-text-primary">Learning Activity</h3>
        <p className="text-sm text-text-tertiary">Daily engagement metrics</p>
      </div>
      <ChartContainer config={chartConfig} className="h-[200px] min-h-[200px] w-full">
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => value.slice(0, 3)}
            stroke="var(--color-text-quaternary)"
            fontSize={12}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="line" />}
          />
          <Area
            dataKey="mobile"
            type="natural"
            fill="var(--color-mobile)"
            fillOpacity={0.1}
            stroke="var(--color-mobile)"
            strokeWidth={2}
            stackId="a"
          />
          <Area
            dataKey="desktop"
            type="natural"
            fill="var(--color-desktop)"
            fillOpacity={0.4}
            stroke="var(--color-desktop)"
            strokeWidth={2}
            stackId="a"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}
