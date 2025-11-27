'use client'

import { useState } from 'react'
import { placesService } from '@/lib/services/places.service'
import type { Place } from '@/types/place.types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'

export function PlaceSearch({ onResults, onLoadingChange }: { onResults: (places: Place[]) => void; onLoadingChange?: (loading: boolean) => void }) {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [type, setType] = useState('')
  const [loading, setLoading] = useState(false)

  const search = async () => {
    setLoading(true)
    onLoadingChange?.(true)
    try {
      const { places } = await placesService.searchPlaces(query, { location, type })
      onResults(places)
      toast.success(`${places.length} lieux trouvés`)
    } catch {
      toast.error('Erreur lors de la recherche')
    } finally {
      setLoading(false)
      onLoadingChange?.(false)
    }
  }

  return (
    <div className="rounded-lg border p-4 bg-white space-y-3">
      <div className="grid sm:grid-cols-3 gap-3">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Recherche (ex: restaurant italien)" />
        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Localisation (ex: Paris)" />
        <select value={type} onChange={(e) => setType(e.target.value)} className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm">
          <option value="">Type</option>
          <option value="restaurant">Restaurant</option>
          <option value="café">Café</option>
          <option value="bar">Bar</option>
        </select>
      </div>
      <Button onClick={search} disabled={loading}>
        {loading ? 'Recherche…' : 'Rechercher'}
      </Button>
    </div>
  )
}
