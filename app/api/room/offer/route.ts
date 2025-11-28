import { NextRequest, NextResponse } from 'next/server'
import { roomStore } from '@/lib/room-store'

export async function POST(request: NextRequest) {
  const { roomId, offer } = await request.json()
  
  console.log(`[API] POST /offer - roomId: ${roomId}, hasOffer: ${!!offer}`)
  
  const room = await roomStore.get(roomId)
  if (!room) {
    console.log(`[API] Room not found: ${roomId}`)
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }
  
  room.offer = offer
  await roomStore.set(roomId, room)
  
  console.log(`[API] Offer stored for room: ${roomId}`)
  
  return NextResponse.json({ success: true })
}

export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get('roomId')
  
  console.log(`[API] GET /offer - roomId: ${roomId}`)
  
  if (!roomId) {
    return NextResponse.json({ error: 'roomId required' }, { status: 400 })
  }
  
  const room = await roomStore.get(roomId)
  if (!room) {
    console.log(`[API] Room not found: ${roomId}`)
    return NextResponse.json({ error: 'Room not found', offer: null }, { status: 200 })
  }
  
  console.log(`[API] Returning offer for room ${roomId}: ${!!room.offer}`)
  
  return NextResponse.json({ offer: room.offer || null })
}
