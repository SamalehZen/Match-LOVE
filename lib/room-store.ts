import type { Room } from './types'

declare global {
  var rooms: Map<string, Room> | undefined
}

export const roomStore = global.rooms || new Map<string, Room>()

if (process.env.NODE_ENV !== 'production') {
  global.rooms = roomStore
}

export function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function cleanupExpiredRooms() {
  const now = Date.now()
  const ROOM_TTL = 30 * 60 * 1000
  roomStore.forEach((room, id) => {
    if (now - room.createdAt > ROOM_TTL) {
      roomStore.delete(id)
    }
  })
}
