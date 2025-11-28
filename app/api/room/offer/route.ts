import { NextRequest, NextResponse } from 'next/server'
import { roomStore } from '@/lib/room-store'

export async function POST(request: NextRequest) {
  const { roomId, offer } = await request.json()
  
  const room = roomStore.get(roomId)
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }
  
  room.offer = offer
  roomStore.set(roomId, room)
  
  return NextResponse.json({ success: true })
}

export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get('roomId')
  
  if (!roomId) {
    return NextResponse.json({ error: 'roomId required' }, { status: 400 })
  }
  
  const room = roomStore.get(roomId)
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }
  
  return NextResponse.json({ offer: room.offer || null })
}
