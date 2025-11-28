import { NextRequest, NextResponse } from 'next/server'
import { roomStore } from '@/lib/room-store'

export async function POST(request: NextRequest) {
  const { roomId, candidate, role } = await request.json()
  
  const room = roomStore.get(roomId)
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }
  
  if (role === 'A') {
    room.iceCandidatesA.push(candidate)
  } else {
    room.iceCandidatesB.push(candidate)
  }
  
  roomStore.set(roomId, room)
  
  return NextResponse.json({ success: true })
}

export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get('roomId')
  const role = request.nextUrl.searchParams.get('role')
  
  if (!roomId || !role) {
    return NextResponse.json({ error: 'roomId and role required' }, { status: 400 })
  }
  
  const room = roomStore.get(roomId)
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }
  
  const candidates = role === 'A' ? room.iceCandidatesB : room.iceCandidatesA
  
  return NextResponse.json({ candidates })
}
