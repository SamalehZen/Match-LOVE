'use client'

import { useState } from 'react'
import { Dialog, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'

export function RoomInvitationDialog({ roomId }: { roomId: string }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const sendInvite = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/rooms/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, email }),
      })
      if (!res.ok) throw new Error('Invite failed')
      toast.success('Invitation envoyée')
      setOpen(false)
      setEmail('')
    } catch {
      toast.error("Impossible d'envoyer l'invitation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button variant="outline" onClick={() => setOpen(true)}>Inviter</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>Inviter un partenaire</DialogHeader>
        <div className="space-y-2">
          <div className="text-sm text-neutral-600">Entrez l'email de votre partenaire (lié à son compte)</div>
          <Input placeholder="email@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <DialogFooter>
          <Button onClick={sendInvite} disabled={!email || loading}>{loading ? 'Envoi…' : 'Envoyer'}</Button>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
