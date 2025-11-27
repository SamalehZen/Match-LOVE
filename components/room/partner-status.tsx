import type { RoomMember } from '@/types/room.types'

export function PartnerStatus({ members, currentUserId }: { members: RoomMember[]; currentUserId: string }) {
  const partner = members.find((m) => m.user_id !== currentUserId)
  if (!partner) return null

  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-full bg-neutral-200" />
      <div className="text-sm">
        <div className="font-medium">Partenaire</div>
        <div className="text-neutral-600">Statut: {partner.status}</div>
      </div>
    </div>
  )
}
