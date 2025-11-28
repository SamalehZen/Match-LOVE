import { NextRequest, NextResponse } from 'next/server'
import type { Place } from '@/lib/types'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || ''

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get('lat')
  const lng = request.nextUrl.searchParams.get('lng')
  const type = request.nextUrl.searchParams.get('type') || 'restaurant'
  const radius = request.nextUrl.searchParams.get('radius') || '2000'

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 })
  }

  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ places: getMockPlaces() })
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_API_KEY}`
    
    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status)
      return NextResponse.json({ places: getMockPlaces() })
    }

    const places: Place[] = await Promise.all(
      (data.results || []).slice(0, 20).map(async (place: any) => {
        let photoUrl = undefined
        if (place.photos && place.photos[0]) {
          photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
        }

        return {
          id: place.place_id,
          name: place.name,
          rating: place.rating || 0,
          priceLevel: place.price_level,
          vicinity: place.vicinity,
          photoUrl,
          types: place.types || [],
          location: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
          },
        }
      })
    )

    return NextResponse.json({ places })
  } catch (error) {
    console.error('Error fetching places:', error)
    return NextResponse.json({ places: getMockPlaces() })
  }
}

function getMockPlaces(): Place[] {
  const mockPlaces: Place[] = [
    {
      id: '1',
      name: 'Le Petit Bistro',
      rating: 4.5,
      priceLevel: 2,
      vicinity: '12 Rue de la Paix, Paris',
      photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
      types: ['restaurant', 'french'],
      location: { lat: 48.8566, lng: 2.3522 },
    },
    {
      id: '2',
      name: 'Sakura Sushi',
      rating: 4.7,
      priceLevel: 3,
      vicinity: '45 Avenue des Champs-Élysées',
      photoUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800',
      types: ['restaurant', 'japanese'],
      location: { lat: 48.8698, lng: 2.3075 },
    },
    {
      id: '3',
      name: 'Café Romantique',
      rating: 4.3,
      priceLevel: 1,
      vicinity: '8 Place du Tertre, Montmartre',
      photoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
      types: ['cafe', 'romantic'],
      location: { lat: 48.8867, lng: 2.3406 },
    },
    {
      id: '4',
      name: 'La Trattoria',
      rating: 4.6,
      priceLevel: 2,
      vicinity: '23 Rue Saint-Honoré',
      photoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      types: ['restaurant', 'italian'],
      location: { lat: 48.8606, lng: 2.3376 },
    },
    {
      id: '5',
      name: 'Le Jardin Secret',
      rating: 4.8,
      priceLevel: 3,
      vicinity: '15 Rue de Rivoli',
      photoUrl: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800',
      types: ['restaurant', 'garden'],
      location: { lat: 48.8558, lng: 2.3599 },
    },
    {
      id: '6',
      name: 'Thai Palace',
      rating: 4.4,
      priceLevel: 2,
      vicinity: '67 Boulevard Haussmann',
      photoUrl: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800',
      types: ['restaurant', 'thai'],
      location: { lat: 48.8738, lng: 2.3290 },
    },
    {
      id: '7',
      name: 'Wine & Dine',
      rating: 4.5,
      priceLevel: 3,
      vicinity: '3 Rue du Faubourg Saint-Antoine',
      photoUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800',
      types: ['bar', 'wine'],
      location: { lat: 48.8530, lng: 2.3710 },
    },
    {
      id: '8',
      name: 'Burger Gourmet',
      rating: 4.2,
      priceLevel: 1,
      vicinity: '89 Rue Oberkampf',
      photoUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
      types: ['restaurant', 'burger'],
      location: { lat: 48.8656, lng: 2.3785 },
    },
  ]
  return mockPlaces
}
