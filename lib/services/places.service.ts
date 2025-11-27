import type { Place } from '@/types/place.types'
import { createClient } from '@/lib/supabase/client'

export class PlacesService {
  async searchPlaces(query: string, options?: { location?: string; type?: string }) {
    const response = await fetch('/api/places/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, ...options }),
    })
    if (!response.ok) throw new Error('Search failed')
    return response.json() as Promise<{ places: Place[]; total: number }>
  }

  async getPlace(placeId: string): Promise<Place> {
    const supabase = createClient()
    const { data, error } = await supabase.from('places').select('*').eq('id', placeId).single()
    if (error) throw error
    return data as unknown as Place
  }

  async getPlaces(placeIds: string[]): Promise<Place[]> {
    if (placeIds.length === 0) return []
    const supabase = createClient()
    const { data, error } = await supabase.from('places').select('*').in('id', placeIds)
    if (error) throw error
    return (data || []) as unknown as Place[]
  }
}

export const placesService = new PlacesService()
