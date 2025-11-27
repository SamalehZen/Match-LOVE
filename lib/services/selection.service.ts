import { createClient } from '@/lib/supabase/client'
import { MAX_PLACES_PER_ROUND } from '@/lib/constants'

class SelectionService {
  private supabase = createClient()

  async createSelection(roomId: string, roundNumber: number, placeIds: string[]) {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    const ids = Array.from(new Set(placeIds)).slice(0, MAX_PLACES_PER_ROUND)
    const { data, error } = await this.supabase
      .from('selections')
      .insert({ room_id: roomId, user_id: user.id, round_number: roundNumber, place_ids: ids, validated: false })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async updateSelection(selectionId: string, placeIds: string[]) {
    const ids = Array.from(new Set(placeIds)).slice(0, MAX_PLACES_PER_ROUND)
    const { data, error } = await this.supabase
      .from('selections')
      .update({ place_ids: ids })
      .eq('id', selectionId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async validateSelection(selectionId: string) {
    const { data, error } = await this.supabase
      .from('selections')
      .update({ validated: true, validated_at: new Date().toISOString() })
      .eq('id', selectionId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async getSelection(roomId: string, userId: string, roundNumber: number) {
    const { data, error } = await this.supabase
      .from('selections')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .eq('round_number', roundNumber)
      .maybeSingle()
    if (error) throw error
    return data
  }

  async getRoomSelections(roomId: string, roundNumber: number) {
    const { data, error } = await this.supabase
      .from('selections')
      .select('*')
      .eq('room_id', roomId)
      .eq('round_number', roundNumber)
      .eq('validated', true)
    if (error) throw error
    return data || []
  }

  async getBurnedPlaces(roomId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('burned_places')
      .select('place_id')
      .eq('room_id', roomId)
    if (error) throw error
    return (data || []).map((r) => r.place_id)
  }

  async burnPlace(roomId: string, placeId: string, roundNumber: number) {
    const { error } = await this.supabase
      .from('burned_places')
      .upsert({ room_id: roomId, place_id: placeId, round_number: roundNumber }, { onConflict: 'room_id,place_id' })
    if (error) throw error
  }
}

export const selectionService = new SelectionService()
