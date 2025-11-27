'use client'

import { useRouter } from 'next/navigation'
import { generateRoomCode } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'

export default function RoomCreatePage() {
  const router = useRouter()
  const supabase = createClient()

  const createRoom = async () => {
    try {
      const code = generateRoomCode()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      const { data, error } = await supabase
        .from('rooms')
        .insert({ code, creator_id: user.id })
        .select()
        .single()
      if (error) throw error
      toast.success('Room créée avec succès')
      if (data) router.push(`/room/${data.id}`)
    } catch (e) {
      toast.error("Erreur lors de la création de la room")
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Créer une room</h1>
      <Button onClick={createRoom}>Créer</Button>
    </div>
  )
}
