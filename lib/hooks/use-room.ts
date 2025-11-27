'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Room, RoomMember } from '@/types/room.types'
import { subscribeToRoom, type RoomPresence, trackPresence, sendBroadcast } from '@/lib/supabase/realtime'

export function useRoom(
  roomId: string,
  currentUser: { id: string; name?: string; avatar_url?: string } | null
) {
  const supabase = createClient()
  const [room, setRoom] = useState<Room | null>(null)
  const [members, setMembers] = useState<RoomMember[]>([])
  const [presences, setPresences] = useState<RoomPresence[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<ReturnType<typeof subscribeToRoom> | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      const { data: r, error: roomError } = await supabase.from('rooms').select('*').eq('id', roomId).maybeSingle()
      if (roomError) {
        console.error('Error loading room:', roomError)
      }
      if (!active) return
      setRoom(r as Room)

      const { data: m, error: membersError } = await supabase
        .from('room_members')
        .select('*, profiles:profiles(name, avatar_url)')
        .eq('room_id', roomId)

      if (membersError) {
        console.error('Error loading members:', membersError)
      }
      if (!active) return
      setMembers((m as unknown as RoomMember[]) || [])


      channelRef.current = subscribeToRoom(roomId, {
        onPresence: setPresences,
        onLaunch: (payload) => {
          setRoom((prev) => (prev ? { ...prev, status: 'selecting' } : prev))
        },
      })

      if (channelRef.current && currentUser) {
        trackPresence(channelRef.current, {
          room_id: roomId,
          user_id: currentUser.id,
          status: 'idle',
          username: currentUser.name || 'Utilisateur',
          avatar_url: currentUser.avatar_url,
        })
      }

      setLoading(false)
    }

    load()
    return () => {
      active = false
      if (channelRef.current) channelRef.current.unsubscribe()
    }
  }, [roomId, supabase, currentUser])

  const refreshMembers = async () => {
    const { data: m } = await supabase
      .from('room_members')
      .select('*, profiles:profiles(name, avatar_url)')
      .eq('room_id', roomId)
    setMembers((m as unknown as RoomMember[]) || [])
  }

  const updateStatus = async (status: RoomMember['status']) => {
    if (!currentUser) return
    await supabase
      .from('room_members')
      .update({ status })
      .eq('room_id', roomId)
      .eq('user_id', currentUser.id)
    await refreshMembers()
    // Reflect in presence as well
    if (channelRef.current) {
      trackPresence(channelRef.current, {
        room_id: roomId,
        user_id: currentUser.id,
        status,
        username: currentUser.name || 'Utilisateur',
        avatar_url: currentUser.avatar_url,
      })
    }
  }

  const launch = async () => {
    // Update room + members status, then broadcast
    await supabase.from('rooms').update({ status: 'selecting' }).eq('id', roomId)
    if (currentUser) {
      await supabase
        .from('room_members')
        .update({ status: 'selecting' })
        .eq('room_id', roomId)
        .eq('user_id', currentUser.id)
    }
    await refreshMembers()
    setRoom((prev) => (prev ? { ...prev, status: 'selecting' } : prev))
    if (channelRef.current) sendBroadcast(channelRef.current, 'launch', { roomId })
  }

  const leaveRoom = async () => {
    if (!currentUser) return
    await supabase.from('room_members').delete().eq('room_id', roomId).eq('user_id', currentUser.id)
    await refreshMembers()
  }

  return { room, members, presences, loading, updateStatus, leaveRoom, launch }
}
