import { NextRequest, NextResponse } from 'next/server'
import { roomStore } from '@/lib/room-store'

export async function POST(request: NextRequest) {
  const { roomId, offer } = await request.json()
  
  console.log(`[API] POST /offer - roomId: ${roomId}, hasOffer: ${!!offer}`)
  console.log(`[API] Available rooms: ${Array.from(roomStore.keys()).join(', ')}`)
  
  const room = roomStore.get(roomId)
  if (!room) {
    console.log(`[API] Room not found: ${roomId}`)
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }
  
  room.offer = offer
  roomStore.set(roomId, room)
  
  console.log(`[API] Offer stored for room: ${roomId}`)
  
  return NextResponse.json({ success: true })
}

export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get('roomId')
  
  console.log(`[API] GET /offer - roomId: ${roomId}`)
  console.log(`[API] Available rooms: ${Array.from(roomStore.keys()).join(', ')}`)
  
  if (!roomId) {
    return NextResponse.json({ error: 'roomId required' }, { status: 400 })
  }
  
  const room = roomStore.get(roomId)
  if (!room) {
    console.log(`[API] Room not found: ${roomId}`)
    return NextResponse.json({ error: 'Room not found', offer: null }, { status: 200 })
  }
  
  console.log(`[API] Returning offer for room ${roomId}: ${!!room.offer}`)
  
  return NextResponse.json({ offer: room.offer || null })
}
