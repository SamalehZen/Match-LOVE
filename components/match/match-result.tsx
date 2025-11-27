'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Place } from '@/types/place.types'
import { Button } from '@/components/ui/button'
import { MatchAnimation } from '@/components/match/match-animation'
import { MatchEffects, type MatchEffectsOptions } from '@/components/match/match-effects'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogFooter, DialogHeader } from '@/components/ui/dialog'

function useLocalToggle(key: string, initial: boolean) {
  const [value, setValue] = useState(initial)
  useEffect(() => {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
    if (raw !== null) setValue(raw === '1')
  }, [key])
  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value ? '1' : '0')
  }, [key, value])
  return [value, setValue] as const
}

export function MatchResult({ matched, place }: { matched: boolean; place?: Place }) {
  const [confetti, setConfetti] = useLocalToggle('rm:fx:confetti', true)
  const [sound, setSound] = useLocalToggle('rm:fx:sound', true)
  const options: MatchEffectsOptions = { confetti, sound }
  const [openShare, setOpenShare] = useState(false)

  const share = async () => {
    try {
      const shareData = {
        title: 'RaniyaMatch — Match trouvé !',
        text: `On a matché sur ${place?.name}${place?.address ? ' — ' + place.address : ''}`,
        url: typeof window !== 'undefined' ? window.location.origin : undefined,
      }
      if (navigator.share) await navigator.share(shareData)
      else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
        alert('Lien copié !')
      }
    } catch {}
  }

  if (matched && place) {
    return (
      <div className="space-y-4 animate-swipe-in">
        <MatchEffects active={true} options={options} />
        <MatchAnimation active={true} />

        <div className="rounded-lg border p-4 bg-white animate-pop">
          <div className="text-lg font-semibold">{place.name}</div>
          {place.address && <div className="text-sm text-neutral-600">{place.address}</div>}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/history"><Button>Voir l'historique</Button></Link>
          <Button variant="outline" onClick={() => setOpenShare(true)}>Partager</Button>
          <Link href="/dashboard"><Button variant="outline">Retour dashboard</Button></Link>
        </div>

        <div className="rounded-lg border p-3 bg-white">
          <div className="font-medium mb-2">Effets</div>
          <div className="flex items-center gap-6 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch checked={confetti} onCheckedChange={setConfetti} /> Confettis
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch checked={sound} onCheckedChange={setSound} /> Son
            </label>
          </div>
        </div>

        <Dialog open={openShare} onOpenChange={setOpenShare}>
          <DialogHeader>Partager le match</DialogHeader>
          <div className="text-sm space-y-2">
            <div className="font-medium">{place.name}</div>
            {place.address && <div className="text-neutral-600">{place.address}</div>}
            <div className="text-neutral-600 truncate">{typeof window !== 'undefined' ? window.location.origin : ''}</div>
          </div>
          <DialogFooter>
            <Button onClick={share}>Partager</Button>
            <Button variant="outline" onClick={() => setOpenShare(false)}>Fermer</Button>
          </DialogFooter>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="rounded-lg border p-4 bg-white">
      <div className="font-semibold mb-1">Aucun match cette fois</div>
      <div className="text-sm text-neutral-700">Réessayez un nouveau round avec d'autres lieux.</div>
    </div>
  )
}
