'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

type Invitation = {
  id: string
  room_id: string
  inviter_id: string
  status: string
  created_at: string
  room?: { id: string; code: string; name?: string | null }
  inviter?: { name?: string | null; avatar_url?: string | null }
}

export function RoomInvitationsDialog() {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [invitations, setInvitations] = useState<Invitation[]>([])

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('room_invitations')
      .select('*, room:rooms(id, code, name), inviter:profiles(name, avatar_url)')
      .eq('invited_user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    setInvitations((data as any) || [])
  }

  useEffect(() => {
    load()
    // Realtime: listen to new invitations
    const channel = supabase
      .channel('room-invitations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_invitations' }, (payload) => {
        setInvitations((prev) => [payload.new as Invitation, ...prev])
      })
      .subscribe()
    return () => { channel.unsubscribe() }
  }, [supabase])

  const respond = async (inv: Invitation, accept: boolean) => {
    setLoading(true)
    try {
      const { data: updated, error } = await supabase
        .from('room_invitations')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', inv.id)
        .select()
        .single()
      if (error) throw error
      if (accept) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')
        await supabase.from('room_members').upsert({ room_id: inv.room_id, user_id: user.id }, { onConflict: 'room_id,user_id' })
        toast.success('Invitation acceptée !')
        router.push(`/room/${inv.room_id}`)
      } else {
        toast.success('Invitation refusée')
      }
      setInvitations((prev) => prev.filter((i) => i.id !== inv.id))
    } catch {
      toast.error("Action impossible")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Invitations {invitations.length > 0 ? `(${invitations.length})` : ''}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>Invitations reçues</DialogHeader>
        <div className="space-y-2 max-h-80 overflow-auto">
          {invitations.length === 0 && <div className="text-sm text-neutral-600">Aucune invitation en attente.</div>}
          {invitations.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="font-medium text-sm">Room {inv.room?.code}</div>
                <div className="text-xs text-neutral-600">Invité par {inv.inviter?.name || inv.inviter_id.slice(0,6)}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => respond(inv, true)} disabled={loading}>Accepter</Button>
                <Button variant="outline" onClick={() => respond(inv, false)} disabled={loading}>Refuser</Button>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Fermer</Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
