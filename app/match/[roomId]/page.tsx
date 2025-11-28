'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { Place } from '@/lib/types'

export default function MatchPage() {
  const router = useRouter()
  const [matchedPlaces, setMatchedPlaces] = useState<Place[]>([])
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    const stored = sessionStorage.getItem('matchedPlaces')
    if (stored) {
      setMatchedPlaces(JSON.parse(stored))
    }
    
    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const openMaps = (place: Place) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.id}`
    window.open(url, '_blank')
  }

  return (
    <div className="min-h-screen p-6">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute text-2xl animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
              }}
            >
              {['✨', '💕', '🎉', '❤️', '💖'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      <div className="text-center mb-8">
        <div className="text-6xl mb-4">✨</div>
        <h1 className="text-3xl font-bold gradient-text mb-2">
          {matchedPlaces.length > 0 ? 'Vos Matchs!' : 'Aucun match'}
        </h1>
        <p className="text-gray-600">
          {matchedPlaces.length > 0
            ? `Vous avez ${matchedPlaces.length} lieu${matchedPlaces.length > 1 ? 'x' : ''} en commun!`
            : 'Vous n\'avez pas aimé les mêmes lieux cette fois-ci'}
        </p>
      </div>

      {matchedPlaces.length > 0 ? (
        <div className="space-y-4 mb-8">
          {matchedPlaces.map((place, index) => (
            <div
              key={place.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex">
                {place.photoUrl && (
                  <img
                    src={place.photoUrl}
                    alt={place.name}
                    className="w-24 h-24 object-cover"
                  />
                )}
                <div className="flex-1 p-4">
                  <h3 className="font-bold text-lg mb-1">{place.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <span className="text-yellow-500">★ {place.rating.toFixed(1)}</span>
                    {place.priceLevel && (
                      <span className="text-green-600">{'€'.repeat(place.priceLevel)}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{place.vicinity}</p>
                </div>
              </div>
              <button
                onClick={() => openMaps(place)}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Voir sur Google Maps
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😅</div>
          <p className="text-gray-600 mb-6">
            Essayez à nouveau avec d'autres lieux!
          </p>
        </div>
      )}

      <div className="flex justify-center">
        <Button onClick={() => router.push('/')} size="lg">
          Nouvelle partie
        </Button>
      </div>
    </div>
  )
}
