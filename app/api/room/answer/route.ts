import { NextRequest, NextResponse } from 'next/server'
import { roomStore } from '@/lib/room-store'

export async function POST(request: NextRequest) {
  const { roomId, answer } = await request.json()
  
  console.log(`[API] POST /answer - roomId: ${roomId}, hasAnswer: ${!!answer}`)
  
  const room = roomStore.get(roomId)
  if (!room) {
    console.log(`[API] Room not found: ${roomId}`)
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }
  
  room.answer = answer
  roomStore.set(roomId, room)
  
  console.log(`[API] Answer stored for room: ${roomId}`)
  
  return NextResponse.json({ success: true })
}

export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get('roomId')
  
  if (!roomId) {
    return NextResponse.json({ error: 'roomId required' }, { status: 400 })
  }
  
  const room = roomStore.get(roomId)
  if (!room) {
    return NextResponse.json({ error: 'Room not found', answer: null }, { status: 200 })
  }
  
  console.log(`[API] GET /answer - roomId: ${roomId}, hasAnswer: ${!!room.answer}`)
  
  return NextResponse.json({ answer: room.answer || null })
}
