export interface Place {
  id: string
  external_id: string
  name: string
  address?: string
  location?: { lat: number; lng: number }
  type?: string
  price_range?: string
  rating?: number
  total_ratings?: number
  phone?: string
  website?: string
  photos?: string[]
  metadata?: unknown
  created_at: string
  updated_at: string
}

export interface Selection {
  id: string
  room_id: string
  user_id: string
  round_number: number
  place_ids: string[]
  validated: boolean
  validated_at?: string
  created_at: string
}
