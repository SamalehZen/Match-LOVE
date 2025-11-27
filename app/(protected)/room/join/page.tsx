'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'

export default function RoomJoinPage() {
  const [code, setCode] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const join = async () => {
    try {
      const { data } = await supabase.from('rooms').select('*').eq('code', code).maybeSingle()
      if (!data) throw new Error('Code invalide')
      toast.success('Vous avez rejoint la room')
      router.push(`/room/${data.id}`)
    } catch (e) {
      toast.error('Code invalide ou erreur')
    }
  }

  return (
    <div className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Rejoindre une room</h1>
      <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code de room" />
      <Button onClick={join}>Rejoindre</Button>
    </div>
  )
}
