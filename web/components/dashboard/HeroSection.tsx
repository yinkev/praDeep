'use client'

import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Separator } from '@/components/ui/separator'
import { Brain, TrendingUp, Clock, Users } from 'lucide-react'

interface HeroSectionProps {
  userName?: string
  userAvatar?: string
  stats?: {
    totalSessions: number
    totalQuestions: number
    avgResponseTime: number
    successRate: number
  }
}

export function HeroSection({
  userName = "Researcher",
  userAvatar,
  stats = {
    totalSessions: 0,
    totalQuestions: 0,
    avgResponseTime: 0,
    successRate: 0
  }
}: HeroSectionProps) {
  const currentTime = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }, [])

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Welcome Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-white shadow-lg flex-shrink-0">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg font-semibold">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {greeting}, {userName}!
                </h1>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 self-start sm:self-auto">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  Active
                </Badge>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                Welcome back to your praDeep research dashboard
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Last updated: {currentTime}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-3 sm:gap-4 lg:gap-6 w-full lg:w-auto">
            <div className="flex items-center gap-3 bg-white/60 dark:bg-gray-800/60 rounded-lg px-4 py-3 shadow-sm">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Sessions</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalSessions}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/60 dark:bg-gray-800/60 rounded-lg px-4 py-3 shadow-sm">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Questions</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalQuestions}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/60 dark:bg-gray-800/60 rounded-lg px-4 py-3 shadow-sm">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Success Rate</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.successRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            Start New Research
          </Button>
          <Button variant="outline" className="border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800">
            View Recent Activity
          </Button>
          <Button variant="outline" className="border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800">
            Generate Report
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}