import { RoomClient } from '@/components/room/room-client'

export default function RoomPage({ params }: { params: { roomId: string } }) {
  return (
    <div className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Room</h1>
      <RoomClient roomId={params.roomId} />
    </div>
  )
}
