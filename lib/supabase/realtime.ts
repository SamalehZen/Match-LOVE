import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type RoomPresence = {
  room_id: string
  user_id: string
  status: 'idle' | 'ready' | 'selecting' | 'validating'
  username: string
  avatar_url?: string
}

export function subscribeToRoom(
  roomId: string,
  callbacks: {
    onPresence?: (presences: RoomPresence[]) => void
    onLaunch?: (data: unknown) => void
    onSelection?: (data: unknown) => void
    onMatch?: (data: unknown) => void
  }
): RealtimeChannel {
  const supabase = createClient()
  const channel = supabase.channel(`room:${roomId}`)

  if (callbacks.onPresence) {
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const presences = Object.values(state).flat() as unknown as RoomPresence[]
      callbacks.onPresence!(presences)
    })
  }

  if (callbacks.onLaunch) {
    channel.on('broadcast', { event: 'launch' }, ({ payload }) => {
      callbacks.onLaunch!(payload)
    })
  }

  if (callbacks.onSelection) {
    channel.on('broadcast', { event: 'selection' }, ({ payload }) => {
      callbacks.onSelection!(payload)
    })
  }

  if (callbacks.onMatch) {
    channel.on('broadcast', { event: 'match' }, ({ payload }) => {
      callbacks.onMatch!(payload)
    })
  }

  channel.subscribe()
  return channel
}

export function trackPresence(channel: RealtimeChannel, presence: RoomPresence) {
  return channel.track(presence)
}

export function sendBroadcast(channel: RealtimeChannel, event: string, payload: unknown) {
  return channel.send({ type: 'broadcast', event, payload })
}
