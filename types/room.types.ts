export interface Room {
  id: string
  code: string
  name?: string
  creator_id: string
  status: 'waiting' | 'ready' | 'selecting' | 'comparing' | 'matched'
  current_round: number
  expires_at: string
  created_at: string
  updated_at: string
}

export interface RoomMember {
  id: string
  room_id: string
  user_id: string
  status: 'idle' | 'ready' | 'selecting' | 'validating'
  joined_at: string
  profile?: { name?: string; avatar_url?: string }
}

export interface RoomInvitation {
  id: string
  room_id: string
  inviter_id: string
  invited_user_id: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  created_at: string
  inviter?: { name: string; avatar_url?: string }
  room?: Room
}
