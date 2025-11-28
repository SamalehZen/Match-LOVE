'use client'

import { useRef, useState } from 'react'
import type { Place } from '@/lib/types'

interface SwipeCardProps {
  place: Place
  onSwipe: (direction: 'LIKE' | 'NOPE') => void
  isTop: boolean
}

export function SwipeCard({ place, onSwipe, isTop }: SwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [showLike, setShowLike] = useState(false)
  const [showNope, setShowNope] = useState(false)
  const startPos = useRef({ x: 0, y: 0 })

  const handleStart = (clientX: number, clientY: number) => {
    if (!isTop) return
    setIsDragging(true)
    startPos.current = { x: clientX - position.x, y: clientY - position.y }
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || !isTop) return
    
    const newX = clientX - startPos.current.x
    const newY = clientY - startPos.current.y
    const newRotation = newX * 0.1
    
    setPosition({ x: newX, y: newY })
    setRotation(newRotation)
    setShowLike(newX > 50)
    setShowNope(newX < -50)
  }

  const handleEnd = () => {
    if (!isDragging || !isTop) return
    setIsDragging(false)
    
    const threshold = 100
    
    if (position.x > threshold) {
      animateOut('right')
      setTimeout(() => onSwipe('LIKE'), 200)
    } else if (position.x < -threshold) {
      animateOut('left')
      setTimeout(() => onSwipe('NOPE'), 200)
    } else {
      setPosition({ x: 0, y: 0 })
      setRotation(0)
      setShowLike(false)
      setShowNope(false)
    }
  }

  const animateOut = (direction: 'left' | 'right') => {
    const x = direction === 'right' ? 500 : -500
    setPosition({ x, y: position.y })
    setRotation(direction === 'right' ? 30 : -30)
  }

  const handleButtonSwipe = (direction: 'LIKE' | 'NOPE') => {
    if (!isTop) return
    setShowLike(direction === 'LIKE')
    setShowNope(direction === 'NOPE')
    animateOut(direction === 'LIKE' ? 'right' : 'left')
    setTimeout(() => onSwipe(direction), 200)
  }

  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY)
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY)
  const onMouseUp = () => handleEnd()
  const onMouseLeave = () => isDragging && handleEnd()

  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY)
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY)
  const onTouchEnd = () => handleEnd()

  const priceLabel = place.priceLevel ? '€'.repeat(place.priceLevel) : ''

  return (
    <div className="absolute inset-0 flex flex-col">
      <div
        ref={cardRef}
        className="flex-1 bg-white rounded-3xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          zIndex: isTop ? 10 : 1,
          pointerEvents: isTop ? 'auto' : 'none',
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="relative h-full">
          {place.photoUrl ? (
            <img
              src={place.photoUrl}
              alt={place.name}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
              <span className="text-white text-6xl">🍽️</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          
          {showLike && (
            <div className="absolute top-8 left-8 border-4 border-green-500 text-green-500 text-4xl font-bold px-4 py-2 rounded-lg rotate-[-20deg]">
              LIKE
            </div>
          )}
          
          {showNope && (
            <div className="absolute top-8 right-8 border-4 border-red-500 text-red-500 text-4xl font-bold px-4 py-2 rounded-lg rotate-[20deg]">
              NOPE
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h2 className="text-3xl font-bold mb-2">{place.name}</h2>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1">
                <span className="text-yellow-400">★</span>
                <span className="font-semibold">{place.rating.toFixed(1)}</span>
              </div>
              {priceLabel && (
                <span className="text-green-400 font-semibold">{priceLabel}</span>
              )}
            </div>
            <p className="text-gray-200 text-sm">{place.vicinity}</p>
          </div>
        </div>
      </div>
      
      {isTop && (
        <div className="flex justify-center gap-8 py-6">
          <button
            onClick={() => handleButtonSwipe('NOPE')}
            className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-3xl border-2 border-red-400 hover:bg-red-50 active:scale-90 transition-all"
          >
            ✕
          </button>
          <button
            onClick={() => handleButtonSwipe('LIKE')}
            className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-3xl border-2 border-green-400 hover:bg-green-50 active:scale-90 transition-all"
          >
            ♥
          </button>
        </div>
      )}
    </div>
  )
}
