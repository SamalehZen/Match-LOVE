import { createClient } from '@/lib/supabase/client'
import { selectionService } from '@/lib/services/selection.service'
import { placesService } from '@/lib/services/places.service'
import type { MatchResult } from '@/types/match.types'

class MatchService {
  private supabase = createClient()

  async checkMatch(roomId: string, roundNumber: number): Promise<MatchResult> {
    const selections = await selectionService.getRoomSelections(roomId, roundNumber)
    if (selections.length !== 2) throw new Error('Both must validate')

    const [sel1, sel2] = selections as Array<{ user_id: string; place_ids: string[] }>
    const commonIds = sel1.place_ids.filter((id) => sel2.place_ids.includes(id))

    if (commonIds.length > 0) {
      const matchedPlaceId = commonIds[0]
      const matchedPlace = await placesService.getPlace(matchedPlaceId)

      await this.supabase.from('matches').insert({
        room_id: roomId,
        place_id: matchedPlaceId,
        round_number: roundNumber,
        user_ids: [sel1.user_id, sel2.user_id],
      })

      await this.supabase.from('rooms').update({ status: 'matched' }).eq('id', roomId)

      for (const userId of [sel1.user_id, sel2.user_id]) {
        await this.supabase.rpc('create_notification', {
          p_user_id: userId,
          p_type: 'match',
          p_title: 'Match trouvé ! 🎉',
          p_message: `Vous avez trouvé: ${matchedPlace.name}`,
        })
      }

      return { matched: true, place: matchedPlace, selections: { user1_places: [], user2_places: [] } }
    } else {
      for (const placeId of [...sel1.place_ids, ...sel2.place_ids]) {
        await selectionService.burnPlace(roomId, placeId, roundNumber)
      }

      await this.supabase
        .from('rooms')
        .update({ current_round: roundNumber + 1, status: 'waiting' })
        .eq('id', roomId)

      return { matched: false, selections: { user1_places: [], user2_places: [] } }
    }
  }

  async getUserMatches(userId: string) {
    const { data, error } = await this.supabase
      .from('matches')
      .select('*, place:places(*)')
      .contains('user_ids', [userId])
      .order('matched_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  async updateMatchStatus(matchId: string, status: 'pending' | 'confirmed' | 'completed' | 'cancelled') {
    const { data, error } = await this.supabase
      .from('matches')
      .update({ status })
      .eq('id', matchId)
      .select()
      .single()
    if (error) throw error
    return data
  }
}

export const matchService = new MatchService()
