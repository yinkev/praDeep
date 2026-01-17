'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  Search,
  PenTool,
  Lightbulb,
  MessageSquare,
  Clock,
  CheckCircle,
  Circle,
  ArrowRight
} from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'research' | 'writing' | 'question' | 'idea' | 'system'
  title: string
  description: string
  timestamp: Date
  status: 'completed' | 'in-progress' | 'pending'
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'research',
    title: 'Deep Research Session',
    description: 'Analyzed quantum computing advancements in 2024',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    status: 'completed',
    icon: Search,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20'
  },
  {
    id: '2',
    type: 'writing',
    title: 'Co-Writing Document',
    description: 'Collaborated on research paper about AI ethics',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    status: 'in-progress',
    icon: PenTool,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20'
  },
  {
    id: '3',
    type: 'question',
    title: 'Q&A Session',
    description: 'Answered 15 questions about machine learning algorithms',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    status: 'completed',
    icon: MessageSquare,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20'
  },
  {
    id: '4',
    type: 'idea',
    title: 'Idea Generation',
    description: 'Generated 23 ideas for sustainable energy solutions',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    status: 'completed',
    icon: Lightbulb,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20'
  },
  {
    id: '5',
    type: 'system',
    title: 'System Update',
    description: 'Knowledge base updated with latest research papers',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    status: 'completed',
    icon: CheckCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-950/20'
  }
]

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`

  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d ago`
}

function getStatusIcon(status: ActivityItem['status']) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-success" />
    case 'in-progress':
      return <Circle className="h-4 w-4 text-accent-primary animate-pulse" />
    case 'pending':
      return <Clock className="h-4 w-4 text-text-tertiary" />
  }
}

function getStatusBadge(status: ActivityItem['status']) {
  switch (status) {
    case 'completed':
      return <Badge variant="secondary" className="bg-success-muted text-success border-success/20">Completed</Badge>
    case 'in-progress':
      return <Badge variant="secondary" className="bg-accent-primary/10 text-accent-primary border-accent-primary/20">In Progress</Badge>
    case 'pending':
      return <Badge variant="outline" className="border-border text-text-secondary">Pending</Badge>
  }
}

interface ActivityTimelineProps {
  maxItems?: number
  showViewAll?: boolean
}

export function ActivityTimeline({ maxItems = 5, showViewAll = true }: ActivityTimelineProps) {
  const [activities, setActivities] = React.useState<ActivityItem[]>(mockActivities.slice(0, maxItems))

  // Simulate real-time updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActivities(prev => prev.map(activity => ({
        ...activity,
        timestamp: new Date(activity.timestamp.getTime() + 1000) // Add 1 second for demo
      })))
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="surface-elevated border border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          Recent Activity
        </CardTitle>
        {showViewAll && (
          <Button variant="ghost" size="sm" className="text-accent-primary hover:bg-accent-primary/10">
            View all
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity, index) => {
          const IconComponent = activity.icon
          return (
            <div key={activity.id} className="flex gap-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className={cn("p-2 rounded-full border-2 border-background shadow-sm", activity.bgColor)}>
                  <IconComponent className={cn("h-4 w-4", activity.color)} />
                </div>
                {index < activities.length - 1 && (
                  <div className="w-px h-12 bg-border-subtle mt-2"></div>
                )}
              </div>

              {/* Activity content */}
              <div className="flex-1 space-y-2 pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium text-text-primary">
                      {activity.title}
                    </h4>
                    <p className="text-sm text-text-secondary">
                      {activity.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(activity.status)}
                    {getStatusBadge(activity.status)}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <Clock className="h-3 w-3" />
                  {formatTimeAgo(activity.timestamp)}
                </div>
              </div>
            </div>
          )
        })}

        {activities.length === 0 && (
          <div className="text-center py-8 text-text-tertiary">
            <Circle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}