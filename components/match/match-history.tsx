'use client'

import { useEffect, useState } from 'react'
import { matchService } from '@/lib/services/match.service'
import { createClient } from '@/lib/supabase/client'
import type { Match } from '@/types/match.types'

export function MatchHistory() {
  const supabase = createClient()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const data = await matchService.getUserMatches(user.id)
      setMatches(data as unknown as Match[])
      setLoading(false)
    })()
  }, [supabase])

  if (loading) {
    return (
      <div className="grid gap-3">
        <div className="rounded-lg border p-4 bg-white">
          <div className="animate-pulse h-4 w-1/3 bg-neutral-200 rounded" />
          <div className="mt-2 animate-pulse h-3 w-1/2 bg-neutral-200 rounded" />
        </div>
        <div className="rounded-lg border p-4 bg-white">
          <div className="animate-pulse h-4 w-1/3 bg-neutral-200 rounded" />
          <div className="mt-2 animate-pulse h-3 w-1/2 bg-neutral-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {matches.length === 0 && <div className="text-neutral-600">Aucun match pour le moment.</div>}
      {matches.map((m) => (
        <div key={m.id} className="rounded-lg border p-4 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{m.place?.name || 'Lieu'}</div>
              <div className="text-sm text-neutral-600">Round {m.round_number} • {new Date(m.matched_at).toLocaleDateString('fr-FR')}</div>
            </div>
            <div className="text-sm capitalize">{m.status}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
