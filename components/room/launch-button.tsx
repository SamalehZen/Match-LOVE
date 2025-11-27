"use client"

import { useMemo } from 'react'
import type { RoomMember } from '@/types/room.types'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'

export function LaunchButton({ members, onLaunch }: { members: RoomMember[]; onLaunch: () => Promise<void> }) {
  const bothReady = useMemo(() => {
    if (members.length < 2) return false
    const readyCount = members.filter((m) => m.status === 'ready').length
    return readyCount >= 2
  }, [members])

  const handleLaunch = async () => {
    try {
      await onLaunch()
      toast.success('Sélection lancée !')
    } catch {
      toast.error("Impossible de lancer la sélection")
    }
  }

  return (
    <Button onClick={handleLaunch} disabled={!bothReady} className={bothReady ? 'animate-pulse-glow' : ''}>
      Lancer la sélection
    </Button>
  )
}
