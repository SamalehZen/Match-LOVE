import { NextRequest, NextResponse } from 'next/server'
import { roomStore } from '@/lib/room-store'

export async function POST(request: NextRequest) {
  const { roomId, candidate, role } = await request.json()
  
  const room = await roomStore.get(roomId)
  if (!room) {
    console.log(`[API] POST /ice - Room not found: ${roomId}`)
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }
  
  if (role === 'A') {
    room.iceCandidatesA.push(candidate)
  } else {
    room.iceCandidatesB.push(candidate)
  }
  
  await roomStore.set(roomId, room)
  
  console.log(`[API] ICE candidate stored - room: ${roomId}, role: ${role}, totalA: ${room.iceCandidatesA.length}, totalB: ${room.iceCandidatesB.length}`)
  
  return NextResponse.json({ success: true })
}

export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get('roomId')
  const role = request.nextUrl.searchParams.get('role')
  
  if (!roomId || !role) {
    return NextResponse.json({ error: 'roomId and role required' }, { status: 400 })
  }
  
  const room = await roomStore.get(roomId)
  if (!room) {
    return NextResponse.json({ candidates: [] })
  }
  
  const candidates = role === 'A' ? room.iceCandidatesB : room.iceCandidatesA
  
  return NextResponse.json({ candidates })
}
