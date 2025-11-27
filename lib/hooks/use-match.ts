'use client'

import { useState } from 'react'
import { matchService } from '@/lib/services/match.service'
import type { MatchResult } from '@/types/match.types'

export function useMatch(roomId: string) {
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<MatchResult | null>(null)

  const checkForMatch = async (roundNumber: number) => {
    setChecking(true)
    try {
      const matchResult = await matchService.checkMatch(roomId, roundNumber)
      setResult(matchResult)
      return matchResult
    } finally {
      setChecking(false)
    }
  }

  return { checking, result, checkForMatch }
}
