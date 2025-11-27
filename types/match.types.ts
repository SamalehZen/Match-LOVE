import type { Place } from './place.types'

export interface Match {
  id: string
  room_id: string
  place_id: string
  round_number: number
  matched_at: string
  user_ids: string[]
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  created_at: string
  place?: Place
}

export interface MatchResult {
  matched: boolean
  place?: Place
  selections: {
    user1_places: Place[]
    user2_places: Place[]
  }
}
