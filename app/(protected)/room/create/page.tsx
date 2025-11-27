'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'

export default function RoomCreatePage() {
  const router = useRouter()

  const createRoom = async () => {
    try {
      const response = await fetch('/api/rooms/create', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur inconnue')
      }

      toast.success('Room créée avec succès')
      if (data.room) router.push(`/room/${data.room.id}`)
    } catch (e) {
      console.error("Error creating room:", e)
      toast.error("Erreur lors de la création de la room: " + (e instanceof Error ? e.message : String(e)))
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Créer une room</h1>
      <Button onClick={createRoom}>Créer</Button>
    </div>
  )
}
