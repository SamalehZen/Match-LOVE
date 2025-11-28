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
  
  console.log(`[API] Room created: ${roomId}, Total rooms: ${roomStore.size}`)
  
  return NextResponse.json({ roomId })
}

export async function GET() {
  return NextResponse.json({ 
    rooms: roomStore.size,
    roomIds: Array.from(roomStore.keys())
  })
}
