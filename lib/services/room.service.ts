import { generateRoomCode } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Room, RoomInvitation, RoomMember } from '@/types/room.types'

class RoomService {
  private supabase = createClient()

  async createRoom(name?: string): Promise<Room> {
    const code = generateRoomCode()
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    const { data, error } = await this.supabase
      .from('rooms')
      .insert({ name, code, creator_id: user.id })
      .select()
      .single()
    if (error) throw error
    await this.supabase.from('room_members').insert({ room_id: data.id, user_id: user.id })
    return data as Room
  }

  async getRoom(roomId: string): Promise<Room> {
    const { data, error } = await this.supabase.from('rooms').select('*').eq('id', roomId).single()
    if (error) throw error
    return data as Room
  }

  async getRoomByCode(code: string): Promise<Room> {
    const { data, error } = await this.supabase.from('rooms').select('*').eq('code', code).single()
    if (error) throw error
    return data as Room
  }

  async getRoomMembers(roomId: string): Promise<RoomMember[]> {
    const { data, error } = await this.supabase
      .from('room_members')
      .select('*, profiles:profiles(name, avatar_url)')
      .eq('room_id', roomId)
    if (error) throw error
    return (data || []).map((rm) => ({
      id: rm.id as string,
      room_id: rm.room_id as string,
      user_id: rm.user_id as string,
      status: rm.status as RoomMember['status'],
      joined_at: rm.joined_at as string,
      profile: (rm as unknown as { profiles?: { name?: string; avatar_url?: string } }).profiles,
    }))
  }

  async joinRoom(roomId: string, userId: string): Promise<RoomMember> {
    const { data, error } = await this.supabase
      .from('room_members')
      .insert({ room_id: roomId, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return data as unknown as RoomMember
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const { error } = await this.supabase.from('room_members').delete().eq('room_id', roomId).eq('user_id', userId)
    if (error) throw error
  }

  async updateRoomStatus(roomId: string, status: Room['status']): Promise<Room> {
    const { data, error } = await this.supabase
      .from('rooms')
      .update({ status })
      .eq('id', roomId)
      .select()
      .single()
    if (error) throw error
    return data as Room
  }

  async updateMemberStatus(roomId: string, userId: string, status: RoomMember['status']): Promise<RoomMember> {
    const { data, error } = await this.supabase
      .from('room_members')
      .update({ status })
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return data as unknown as RoomMember
  }

  async sendInvitation(roomId: string, invitedUserId: string): Promise<RoomInvitation> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    const { data, error } = await this.supabase
      .from('room_invitations')
      .insert({ room_id: roomId, inviter_id: user.id, invited_user_id: invitedUserId })
      .select()
      .single()
    if (error) throw error
    return data as unknown as RoomInvitation
  }

  async getInvitations(userId: string): Promise<RoomInvitation[]> {
    const { data, error } = await this.supabase
      .from('room_invitations')
      .select('*, room:rooms(*)')
      .eq('invited_user_id', userId)
      .eq('status', 'pending')
    if (error) throw error
    return (data || []) as unknown as RoomInvitation[]
  }

  async respondToInvitation(invitationId: string, accept: boolean): Promise<void> {
    const { data, error } = await this.supabase
      .from('room_invitations')
      .update({ status: accept ? 'accepted' : 'declined' })
      .eq('id', invitationId)
      .select()
      .single()
    if (error) throw error
    if (accept) {
      const { room_id, invited_user_id } = data as unknown as { room_id: string; invited_user_id: string }
      await this.joinRoom(room_id, invited_user_id)
    }
  }
}

export const roomService = new RoomService()
