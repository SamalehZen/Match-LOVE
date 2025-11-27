'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Place } from '@/types/place.types'
import { PlaceSearch } from '@/components/places/place-search'
import { PlaceCard } from '@/components/places/place-card'
import { selectionService } from '@/lib/services/selection.service'
import { placesService } from '@/lib/services/places.service'
import { createClient } from '@/lib/supabase/client'
import { MAX_PLACES_PER_ROUND } from '@/lib/constants'
import { matchService } from '@/lib/services/match.service'
import { MatchResult } from '@/components/match/match-result'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { PlaceCardSkeleton } from '@/components/places/place-card-skeleton'

export function PlaceSelection({ roomId, roundNumber }: { roomId: string; roundNumber: number }) {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [results, setResults] = useState<Place[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [burned, setBurned] = useState<string[]>([])
  const [validated, setValidated] = useState(false)
  const [checkingMatch, setCheckingMatch] = useState(false)
  const [matchInfo, setMatchInfo] = useState<{ matched: boolean; name?: string } | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id || null))
    selectionService.getBurnedPlaces(roomId).then(setBurned)

    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const existing = await selectionService.getSelection(roomId, user.id, roundNumber)
      if (existing) {
        setSelected(existing.place_ids)
        setValidated(!!existing.validated)
        if (existing.place_ids?.length) {
          const places = await placesService.getPlaces(existing.place_ids)
          setResults(places)
        }
      }
    })()

    channelRef.current = supabase.channel(`room:${roomId}`)
      .on('broadcast', { event: 'selection' }, async () => {
        // When partner validates, check if both validated now
        await maybeCheckMatch()
      })
      .subscribe()

    return () => {
      if (channelRef.current) channelRef.current.unsubscribe()
    }
  }, [roomId, roundNumber, supabase])

  const toggle = (id: string) => {
    if (validated) return
    setSelected((prev) => {
      const set = new Set(prev)
      if (set.has(id)) {
        set.delete(id)
      } else {
        if (prev.length >= MAX_PLACES_PER_ROUND) return prev
        set.add(id)
      }
      return Array.from(set)
    })
  }

  const onResults = (places: Place[]) => {
    setResults(places)
  }

  const validate = async () => {
    if (!userId) return
    // upsert selection then validate
    const existing = await selectionService.getSelection(roomId, userId, roundNumber)
    try {
      if (!existing) {
        await selectionService.createSelection(roomId, roundNumber, selected)
      } else {
        await selectionService.updateSelection(existing.id, selected)
      }
      await selectionService.validateSelection((await selectionService.getSelection(roomId, userId, roundNumber))!.id)
      setValidated(true)
      toast.success('Sélection validée !')
      if (channelRef.current) channelRef.current.send({ type: 'broadcast', event: 'selection', payload: { roomId, roundNumber } })
      await maybeCheckMatch()
    } catch (e) {
      toast.error('Erreur lors de la validation')
    }
  }

  const maybeCheckMatch = async () => {
    setCheckingMatch(true)
    try {
      const selections = await selectionService.getRoomSelections(roomId, roundNumber)
      if (selections.length === 2) {
        const res = await matchService.checkMatch(roomId, roundNumber)
        setMatchInfo(res.matched ? { matched: true, name: res.place?.name } : { matched: false })
      }
    } finally {
      setCheckingMatch(false)
    }
  }

  const selectedCount = useMemo(() => selected.length, [selected])

  return (
    <div className="space-y-4">
      <PlaceSearch onResults={onResults} onLoadingChange={setSearchLoading} />
      <div className="text-sm text-neutral-600">{selectedCount} / {MAX_PLACES_PER_ROUND} sélectionnés</div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {searchLoading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="animate-fade-in"><PlaceCardSkeleton /></div>)
          : results.map((p) => (
              <PlaceCard key={p.id} place={p} selected={selected.includes(p.id)} burned={burned.includes(p.id)} onToggle={toggle} />
            ))}
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={validate} disabled={validated || selected.length === 0}>
          {validated ? 'En attente du partenaire…' : 'Valider ma sélection'}
        </Button>
        {checkingMatch && <span className="text-sm text-neutral-600">Vérification du match…</span>}
      </div>
      {matchInfo && (
        <div className="space-y-3">
          <MatchResult matched={matchInfo.matched} place={matchInfo.matched ? { id: '', external_id: '', name: matchInfo.name || 'Lieu', created_at: '', updated_at: '' } as any : undefined} />
          {!matchInfo.matched && (
            <Button
              variant="outline"
              onClick={async () => {
                setSelected([])
                setValidated(false)
                setResults([])
                setMatchInfo(null)
                toast.success('Round prêt à être relancé — appuyez sur “Je suis prêt” puis “Lancer la sélection”.')
              }}
            >
              Relancer un round
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
