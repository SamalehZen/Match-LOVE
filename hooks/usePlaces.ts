'use client'

import { useState, useCallback } from 'react'
import type { Place } from '@/lib/types'

export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPlaces = useCallback(async (lat?: number, lng?: number) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (lat && lng) {
        params.set('lat', lat.toString())
        params.set('lng', lng.toString())
      } else {
        params.set('lat', '48.8566')
        params.set('lng', '2.3522')
      }
      params.set('type', 'restaurant')
      params.set('radius', '3000')

      const res = await fetch(`/api/places?${params}`)
      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setPlaces(data.places || [])
      return data.places || []
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to fetch places'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const getLocation = useCallback((): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        () => {
          resolve(null)
        }
      )
    })
  }, [])

  return {
    places,
    loading,
    error,
    fetchPlaces,
    getLocation,
  }
}
