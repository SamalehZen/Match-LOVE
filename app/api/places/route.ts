import { NextRequest, NextResponse } from 'next/server'
import type { Place } from '@/lib/types'

const SERPER_API_KEY = process.env.SERPER_API_KEY || ''

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get('lat')
  const lng = request.nextUrl.searchParams.get('lng')
  const type = request.nextUrl.searchParams.get('type') || 'restaurant'

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 })
  }

  if (!SERPER_API_KEY) {
    console.log('No SERPER_API_KEY, using mock data')
    return NextResponse.json({ places: getMockPlaces() })
  }

  try {
    const query = `${type}s near ${lat},${lng}`
    
    const response = await fetch('https://google.serper.dev/places', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        gl: 'fr',
        hl: 'fr',
      }),
    })

    if (!response.ok) {
      console.error('Serper API error:', response.status)
      return NextResponse.json({ places: getMockPlaces() })
    }

    const data = await response.json()

    if (!data.places || data.places.length === 0) {
      return NextResponse.json({ places: getMockPlaces() })
    }

    const places: Place[] = data.places.slice(0, 20).map((place: any, index: number) => ({
      id: place.cid || `place-${index}`,
      name: place.title || 'Unknown',
      rating: place.rating || 0,
      priceLevel: parsePriceLevel(place.priceLevel),
      vicinity: place.address || '',
      photoUrl: place.thumbnailUrl || getPlaceholderImage(type),
      types: place.category ? [place.category.toLowerCase()] : [type],
      location: {
        lat: place.latitude || parseFloat(lat),
        lng: place.longitude || parseFloat(lng),
      },
    }))

    return NextResponse.json({ places })
  } catch (error) {
    console.error('Error fetching places from Serper:', error)
    return NextResponse.json({ places: getMockPlaces() })
  }
}

function parsePriceLevel(price: string | undefined): number {
  if (!price) return 0
  const count = (price.match(/\$/g) || price.match(/€/g) || []).length
  return Math.min(count, 4)
}

function getPlaceholderImage(type: string): string {
  const images: Record<string, string> = {
    restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    cafe: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
    bar: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800',
  }
  return images[type] || images.restaurant
}

function getMockPlaces(): Place[] {
  return [
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
}
