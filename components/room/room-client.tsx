'use client'

import { useEffect, useState } from 'react'
import { useRoom } from '@/lib/hooks/use-room'
import { createClient } from '@/lib/supabase/client'
import type { RoomMember } from '@/types/room.types'
import { LaunchButton } from '@/components/room/launch-button'
import { PartnerStatus } from '@/components/room/partner-status'
import { PlaceSelection } from '@/components/places/place-selection'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { RoomInvitationDialog } from '@/components/room/room-invitation-dialog'

export function RoomClient({ roomId }: { roomId: string }) {
  const supabase = createClient()
  const [user, setUser] = useState<{ id: string; name?: string; avatar_url?: string } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser({ id: user.id, name: (user.user_metadata as { name?: string }).name, avatar_url: (user.user_metadata as { avatar_url?: string }).avatar_url })
    })
  }, [supabase])

  const { room, members, loading, updateStatus, launch } = useRoom(roomId, user)

  if (loading) return <div className="p-6">Chargement…</div>
  if (!room) return <div className="p-6">Room introuvable</div>

  const me: RoomMember | undefined = members.find((m) => m.user_id === user?.id)
  const isReady = me?.status === 'ready'

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-neutral-600">Code</div>
            <div className="font-semibold text-lg">{room.code}</div>
          </div>
          <div>
            <div className="text-sm text-neutral-600">Statut</div>
            <div className="font-semibold capitalize">{room.status}</div>
          </div>
          <div>
            <div className="text-sm text-neutral-600">Round</div>
            <div className="font-semibold">{room.current_round}</div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4 bg-white">
        <h2 className="font-semibold mb-3">Membres</h2>
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between text-sm">
              <span>{m.profile?.name || m.user_id.slice(0, 6)}</span>
              <span className="text-neutral-600">{m.status}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-4">
        <Button onClick={() => updateStatus(isReady ? 'idle' : 'ready')} variant={isReady ? 'secondary' : 'default'}>
          {isReady ? 'Se désactiver' : 'Je suis prêt'}
        </Button>
        {user?.id && <PartnerStatus members={members} currentUserId={user.id} />}
      </div>

      <div>
        <LaunchButton members={members} onLaunch={launch} />
      </div>

      {room.status === 'selecting' && (
        <div className="rounded-lg border p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Sélection de lieux</h2>
            <RoomInvitationDialog roomId={room.id} />
          </div>
          <PlaceSelection roomId={room.id} roundNumber={room.current_round} />
        </div>
      )}
    </div>
  )
}
