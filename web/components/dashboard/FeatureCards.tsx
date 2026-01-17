'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  PenTool,
  Lightbulb,
  FileText,
  BarChart3,
  MessageSquare,
  BookOpen,
  Zap
} from 'lucide-react'

interface FeatureCard {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  href: string
  badge?: string
  isNew?: boolean
}

const features: FeatureCard[] = [
  {
    id: 'research',
    title: 'Deep Research',
    description: 'Conduct comprehensive research with AI assistance and knowledge base integration',
    icon: Search,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    href: '/research',
    badge: 'Popular'
  },
  {
    id: 'co-writer',
    title: 'Co-Writer',
    description: 'Collaborate with AI to write, edit, and refine documents and content',
    icon: PenTool,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    href: '/co_writer'
  },
  {
    id: 'ideagen',
    title: 'Idea Generation',
    description: 'Generate creative ideas and explore possibilities with structured ideation',
    icon: Lightbulb,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    href: '/ideagen',
    isNew: true
  },
  {
    id: 'question',
    title: 'Q&A Assistant',
    description: 'Get instant answers to complex questions with contextual reasoning',
    icon: MessageSquare,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    href: '/question'
  },
  {
    id: 'notebook',
    title: 'Research Notebook',
    description: 'Organize your findings, notes, and insights in structured notebooks',
    icon: BookOpen,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
    href: '/notebook'
  },
  {
    id: 'analytics',
    title: 'Analytics Dashboard',
    description: 'Monitor your research progress and performance metrics',
    icon: BarChart3,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    href: '/analytics'
  },
  {
    id: 'solver',
    title: 'Problem Solver',
    description: 'Break down complex problems and develop systematic solutions',
    icon: Zap,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    href: '/solver'
  },
  {
    id: 'guide',
    title: 'Learning Guide',
    description: 'Get personalized learning paths and educational content',
    icon: FileText,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 dark:bg-teal-950/20',
    href: '/guide'
  }
]

interface FeatureCardsProps {
  onFeatureClick?: (featureId: string) => void
}

export function FeatureCards({ onFeatureClick }: FeatureCardsProps) {
  const handleCardClick = (feature: FeatureCard) => {
    if (onFeatureClick) {
      onFeatureClick(feature.id)
    } else {
      // Default navigation behavior
      window.location.href = feature.href
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: index * 0.1
      }
    }),
    hover: {
      y: -8,
      transition: {
        duration: 0.2
      }
    }
  }

  const iconVariants = {
    hover: {
      scale: 1.1,
      rotate: 5,
      transition: {
        duration: 0.2
      }
    }
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      initial="hidden"
      animate="visible"
    >
      {features.map((feature, index) => {
        const IconComponent = feature.icon
        return (
          <motion.div
            key={feature.id}
            variants={cardVariants}
            custom={index}
            whileHover="hover"
          >
            <Card
              className="group cursor-pointer border-0 shadow-sm bg-white dark:bg-gray-900 hover:shadow-xl transition-shadow duration-300"
              onClick={() => handleCardClick(feature)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <motion.div
                    className={`p-3 rounded-lg ${feature.bgColor}`}
                    variants={iconVariants}
                  >
                    <IconComponent className={`h-6 w-6 ${feature.color}`} />
                  </motion.div>
                  <div className="flex gap-2">
                    {feature.isNew && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                        New
                      </Badge>
                    )}
                    {feature.badge && (
                      <Badge variant="outline" className="text-xs">
                        {feature.badge}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </CardDescription>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4 p-0 h-auto text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium group-hover:translate-x-1 transition-transform duration-200"
                >
                  Get started →
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}