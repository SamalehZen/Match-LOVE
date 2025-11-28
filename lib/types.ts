export interface Place {
  id: string
  name: string
  rating: number
  priceLevel?: number
  vicinity: string
  photoUrl?: string
  types: string[]
  location: {
    lat: number
    lng: number
  }
}

export interface Room {
  id: string
  createdAt: number
  offer?: RTCSessionDescriptionInit
  answer?: RTCSessionDescriptionInit
  iceCandidatesA: RTCIceCandidateInit[]
  iceCandidatesB: RTCIceCandidateInit[]
  places?: Place[]
}

export interface SwipeMessage {
  type: 'SWIPE' | 'SYNC' | 'PLACES' | 'DONE'
  index?: number
  value?: 'LIKE' | 'NOPE'
  likes?: number[]
  places?: Place[]
}

export interface RoomStore {
  [roomId: string]: Room
}
