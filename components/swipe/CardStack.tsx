'use client'

import { SwipeCard } from './SwipeCard'
import type { Place } from '@/lib/types'

interface CardStackProps {
  places: Place[]
  currentIndex: number
  onSwipe: (direction: 'LIKE' | 'NOPE') => void
}

export function CardStack({ places, currentIndex, onSwipe }: CardStackProps) {
  const visibleCards = places.slice(currentIndex, currentIndex + 2)

  if (visibleCards.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">🎉</span>
          <p className="text-xl text-gray-600">Plus de lieux à découvrir!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 relative">
      {visibleCards.map((place, index) => (
        <SwipeCard
          key={place.id}
          place={place}
          onSwipe={onSwipe}
          isTop={index === 0}
        />
      )).reverse()}
    </div>
  )
}
