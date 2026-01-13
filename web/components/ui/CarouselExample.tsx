'use client'

/**
 * Example usage of the Carousel component
 * This demonstrates the ChatGPT-style carousel with Liquid Glass aesthetic
 */

import React from 'react'
import { Carousel } from './Carousel'
import { Card } from './Card'

export function CarouselExample() {
  // Example: Game cards
  const games = [
    { id: 1, title: 'Chess Master', description: 'Strategic thinking game', color: 'bg-blue-50' },
    { id: 2, title: 'Code Quest', description: 'Learn programming basics', color: 'bg-green-50' },
    { id: 3, title: 'Math Challenge', description: 'Solve puzzles fast', color: 'bg-purple-50' },
    { id: 4, title: 'Word Wizard', description: 'Vocabulary builder', color: 'bg-amber-50' },
    { id: 5, title: 'Science Lab', description: 'Experiment and learn', color: 'bg-pink-50' },
    { id: 6, title: 'History Quest', description: 'Travel through time', color: 'bg-indigo-50' },
    { id: 7, title: 'Art Studio', description: 'Create masterpieces', color: 'bg-rose-50' },
    { id: 8, title: 'Music Maker', description: 'Compose melodies', color: 'bg-cyan-50' },
  ]

  return (
    <div className="w-full max-w-7xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6">Featured Games</h2>

      {/* Basic Carousel with default settings */}
      <Carousel
        ariaLabel="Featured games carousel"
        itemsPerView={{
          mobile: 1.2,
          tablet: 2.5,
          desktop: 3.5,
        }}
        gap={16}
      >
        {games.map(game => (
          <Card key={game.id} variant="glass" interactive padding="md" className="h-48">
            <div className={`w-full h-24 rounded-lg ${game.color} mb-4`} />
            <h3 className="text-lg font-semibold mb-2">{game.title}</h3>
            <p className="text-sm text-text-secondary">{game.description}</p>
          </Card>
        ))}
      </Carousel>

      {/* Controlled Carousel Example */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Ongoing Sessions</h2>
        <CarouselControlledExample />
      </div>
    </div>
  )
}

function CarouselControlledExample() {
  const [currentIndex, setCurrentIndex] = React.useState(0)

  const sessions = [
    { id: 1, title: 'Math Practice', progress: 75 },
    { id: 2, title: 'Reading Challenge', progress: 50 },
    { id: 3, title: 'Science Quiz', progress: 90 },
    { id: 4, title: 'History Review', progress: 30 },
  ]

  return (
    <div>
      <div className="mb-4 text-sm text-text-secondary">
        Viewing session {currentIndex + 1} of {sessions.length}
      </div>

      <Carousel
        currentIndex={currentIndex}
        onIndexChange={setCurrentIndex}
        ariaLabel="Ongoing sessions carousel"
        itemsPerView={{
          mobile: 1,
          tablet: 2,
          desktop: 3,
        }}
        snapToItems
      >
        {sessions.map(session => (
          <Card key={session.id} variant="elevated" padding="lg" className="h-32">
            <h3 className="text-lg font-semibold mb-3">{session.title}</h3>
            <div className="w-full bg-surface-muted rounded-full h-2">
              <div
                className="bg-accent-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${session.progress}%` }}
              />
            </div>
            <p className="text-sm text-text-tertiary mt-2">{session.progress}% complete</p>
          </Card>
        ))}
      </Carousel>
    </div>
  )
}

// Usage in a page:
// import { CarouselExample } from '@/components/ui/CarouselExample'
// <CarouselExample />
