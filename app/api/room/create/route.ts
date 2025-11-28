import { NextResponse } from 'next/server'
import { roomStore, generateRoomId, cleanupExpiredRooms } from '@/lib/room-store'

export async function POST() {
  cleanupExpiredRooms()
  
  const roomId = generateRoomId()
  
  roomStore.set(roomId, {
    id: roomId,
    createdAt: Date.now(),
    iceCandidatesA: [],
    iceCandidatesB: [],
  })
  
  return NextResponse.json({ roomId })
}
