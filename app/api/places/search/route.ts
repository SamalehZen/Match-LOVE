import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SerperPlace {
  position: number
  title: string
  placeId: string
  address?: string
  latitude?: number
  longitude?: number
  rating?: number
  ratingCount?: number
  category?: string
  phoneNumber?: string
  website?: string
  thumbnail?: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { query, location = 'France', type } = body as { query: string; location?: string; type?: string }

    let searchQuery = query
    if (type) searchQuery += ` ${type}`
    if (location) searchQuery += ` ${location}`

    const response = await fetch('https://google.serper.dev/places', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: searchQuery, gl: 'fr', hl: 'fr' }),
    })

    if (!response.ok) throw new Error('Serper API failed')

    const serperData = (await response.json()) as { places?: SerperPlace[] }
    const serperPlaces: SerperPlace[] = serperData.places || []

    const places = await Promise.all(
      serperPlaces.map(async (sp) => {
        const { data: existing } = await supabase
          .from('places')
          .select('*')
          .eq('external_id', sp.placeId)
          .maybeSingle()

        if (existing) return existing

        const { data: newPlace } = await supabase
          .from('places')
          .insert({
            external_id: sp.placeId,
            name: sp.title,
            address: sp.address,
            location: sp.latitude && sp.longitude ? { lat: sp.latitude, lng: sp.longitude } : null,
            type: sp.category,
            rating: sp.rating,
            total_ratings: sp.ratingCount,
            phone: sp.phoneNumber,
            website: sp.website,
            photos: sp.thumbnail ? [sp.thumbnail] : [],
            metadata: { position: sp.position },
          })
          .select()
          .single()

        return newPlace
      })
    )

    return NextResponse.json({ places: places.filter(Boolean), total: places.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
