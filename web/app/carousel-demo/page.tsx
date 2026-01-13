'use client'

/**
 * Carousel Demo Page
 * Showcases the ChatGPT-style Carousel component with various use cases
 */

import React from 'react'
import { Carousel, Card, PageWrapper } from '@/components/ui'
import { Gamepad2, Video, Clock, BookOpen } from 'lucide-react'

export default function CarouselDemoPage() {
  const [currentGame, setCurrentGame] = React.useState(0)

  const games = [
    {
      id: 1,
      title: 'Chess Master',
      description: 'Strategic thinking game',
      icon: Gamepad2,
      color: 'from-blue-500 to-blue-600',
      progress: 75,
    },
    {
      id: 2,
      title: 'Code Quest',
      description: 'Learn programming basics',
      icon: BookOpen,
      color: 'from-green-500 to-green-600',
      progress: 40,
    },
    {
      id: 3,
      title: 'Math Challenge',
      description: 'Solve puzzles fast',
      icon: Gamepad2,
      color: 'from-purple-500 to-purple-600',
      progress: 90,
    },
    {
      id: 4,
      title: 'Word Wizard',
      description: 'Vocabulary builder',
      icon: BookOpen,
      color: 'from-amber-500 to-amber-600',
      progress: 60,
    },
    {
      id: 5,
      title: 'Science Lab',
      description: 'Experiment and learn',
      icon: Gamepad2,
      color: 'from-pink-500 to-pink-600',
      progress: 30,
    },
    {
      id: 6,
      title: 'History Quest',
      description: 'Travel through time',
      icon: Clock,
      color: 'from-indigo-500 to-indigo-600',
      progress: 85,
    },
  ]

  const videos = [
    { id: 1, title: 'Algebra Basics', duration: '12:34', views: '1.2K' },
    { id: 2, title: 'Chemistry 101', duration: '08:15', views: '856' },
    { id: 3, title: 'World History', duration: '15:42', views: '2.1K' },
    { id: 4, title: 'Physics Intro', duration: '10:23', views: '934' },
    { id: 5, title: 'Biology Deep Dive', duration: '18:56', views: '1.8K' },
  ]

  const sessions = [
    { id: 1, title: 'Math Practice', progress: 75, time: '2h ago' },
    { id: 2, title: 'Reading Challenge', progress: 50, time: '5h ago' },
    { id: 3, title: 'Science Quiz', progress: 90, time: '1d ago' },
    { id: 4, title: 'History Review', progress: 30, time: '2d ago' },
  ]

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Carousel Component Demo</h1>
          <p className="text-lg text-text-secondary">
            ChatGPT-style carousel with Liquid Glass aesthetic, touch gestures, and keyboard
            navigation
          </p>
        </div>

        {/* Featured Games - Glass Cards */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Featured Games</h2>
          <p className="text-sm text-text-tertiary mb-4">
            Glass morphism cards with interactive hover states
          </p>

          <Carousel
            ariaLabel="Featured games carousel"
            itemsPerView={{
              mobile: 1.2,
              tablet: 2.5,
              desktop: 3.5,
            }}
            gap={16}
          >
            {games.map(game => {
              const Icon = game.icon
              return (
                <Card key={game.id} variant="glass" interactive padding="lg" className="h-64">
                  <div
                    className={`w-full h-32 rounded-xl bg-gradient-to-br ${game.color} mb-4 flex items-center justify-center`}
                  >
                    <Icon className="w-16 h-16 text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{game.title}</h3>
                  <p className="text-sm text-text-secondary mb-3">{game.description}</p>
                  <div className="mt-auto">
                    <div className="flex justify-between text-xs text-text-tertiary mb-1">
                      <span>Progress</span>
                      <span>{game.progress}%</span>
                    </div>
                    <div className="w-full bg-surface-muted rounded-full h-1.5">
                      <div
                        className={`bg-gradient-to-r ${game.color} h-1.5 rounded-full transition-all duration-500`}
                        style={{ width: `${game.progress}%` }}
                      />
                    </div>
                  </div>
                </Card>
              )
            })}
          </Carousel>
        </section>

        {/* Video Library - Elevated Cards */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Video Library</h2>
          <p className="text-sm text-text-tertiary mb-4">
            More items visible on larger screens (1.5 → 3 → 4 items)
          </p>

          <Carousel
            ariaLabel="Video library carousel"
            itemsPerView={{
              mobile: 1.5,
              tablet: 3,
              desktop: 4,
            }}
            gap={12}
          >
            {videos.map(video => (
              <Card key={video.id} variant="elevated" interactive padding="md" className="h-48">
                <div className="w-full h-24 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 rounded-lg mb-3 flex items-center justify-center">
                  <Video className="w-12 h-12 text-text-tertiary" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold mb-2 line-clamp-1">{video.title}</h3>
                <div className="flex items-center justify-between text-xs text-text-tertiary">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {video.duration}
                  </span>
                  <span>{video.views} views</span>
                </div>
              </Card>
            ))}
          </Carousel>
        </section>

        {/* Ongoing Sessions - Controlled Carousel */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Ongoing Sessions (Controlled)</h2>
          <p className="text-sm text-text-tertiary mb-4">
            Controlled carousel with state management - viewing session {currentGame + 1} of{' '}
            {sessions.length}
          </p>

          <Carousel
            currentIndex={currentGame}
            onIndexChange={setCurrentGame}
            ariaLabel="Ongoing sessions carousel"
            itemsPerView={{
              mobile: 1,
              tablet: 2,
              desktop: 3,
            }}
            snapToItems
            gap={16}
          >
            {sessions.map(session => (
              <Card key={session.id} variant="elevated" padding="lg" className="h-40">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">{session.title}</h3>
                  <span className="text-xs text-text-tertiary">{session.time}</span>
                </div>
                <div className="w-full bg-surface-muted rounded-full h-2.5 mb-2">
                  <div
                    className="bg-accent-primary h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${session.progress}%` }}
                  />
                </div>
                <p className="text-sm text-text-tertiary">{session.progress}% complete</p>
              </Card>
            ))}
          </Carousel>
        </section>

        {/* Feature List */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Touch Gestures', desc: 'Swipe left/right on mobile' },
              { title: 'Keyboard Nav', desc: 'Arrow keys, Home, End' },
              { title: 'Auto-hide Arrows', desc: 'Show on hover, hide when not needed' },
              { title: 'Responsive', desc: 'Adaptive items per screen size' },
              { title: 'Glass Design', desc: 'Liquid Cloud aesthetic' },
              { title: 'Snap Scroll', desc: 'Smooth item alignment' },
            ].map(feature => (
              <Card key={feature.title} variant="outlined" padding="md">
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-text-secondary">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Usage Instructions */}
        <section>
          <Card variant="glass" padding="lg">
            <h2 className="text-xl font-bold mb-4">Try It Out!</h2>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>• Hover over carousels to see navigation arrows</li>
              <li>• Click arrows or use ← → keys to navigate</li>
              <li>• Swipe/drag on touch devices</li>
              <li>• Press Tab to focus, then use keyboard navigation</li>
              <li>• Try different screen sizes to see responsive behavior</li>
            </ul>
          </Card>
        </section>
      </div>
    </PageWrapper>
  )
}
