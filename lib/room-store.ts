import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

export interface RoomData {
  id: string
  createdAt: number
  offer?: RTCSessionDescriptionInit
  answer?: RTCSessionDescriptionInit
  iceCandidatesA: RTCIceCandidateInit[]
  iceCandidatesB: RTCIceCandidateInit[]
}

export const roomStore = {
  async get(roomId: string): Promise<RoomData | null> {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      console.warn('[Redis] Missing credentials, falling back to memory (will fail on Vercel)')
      return (global as any).memoryStore?.[roomId] || null
    }
    return await redis.get<RoomData>(`room:${roomId}`)
  },

  async set(roomId: string, data: RoomData): Promise<void> {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      if (!(global as any).memoryStore) (global as any).memoryStore = {}
      ;(global as any).memoryStore[roomId] = data
      return
    }
    await redis.set(`room:${roomId}`, data, { ex: 3600 }) // Expire in 1 hour
  },
  
  async delete(roomId: string): Promise<void> {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
        delete (global as any).memoryStore?.[roomId]
        return
    }
    await redis.del(`room:${roomId}`)
  }
}

export function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function cleanupExpiredRooms() {
  // Redis handles expiration automatically via 'ex' option
}
