'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'

function playCelebrate() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'triangle'
    o.frequency.setValueAtTime(440, ctx.currentTime)
    g.gain.setValueAtTime(0.001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    o.connect(g)
    g.connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + 0.6)
    // second tone
    const o2 = ctx.createOscillator()
    const g2 = ctx.createGain()
    o2.type = 'sine'
    o2.frequency.setValueAtTime(660, ctx.currentTime + 0.05)
    g2.gain.setValueAtTime(0.001, ctx.currentTime)
    g2.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.1)
    g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    o2.connect(g2)
    g2.connect(ctx.destination)
    o2.start(ctx.currentTime + 0.05)
    o2.stop(ctx.currentTime + 0.65)
  } catch {}
}

export type MatchEffectsOptions = {
  confetti: boolean
  sound: boolean
}

export function MatchEffects({ active, options }: { active: boolean; options: MatchEffectsOptions }) {
  useEffect(() => {
    if (!active) return
    if (options.confetti) {
      const duration = 1200
      const end = Date.now() + duration
      const frame = () => {
        confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 } })
        confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 } })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
    }
    if (options.sound) {
      playCelebrate()
    }
  }, [active, options.confetti, options.sound])
  return null
}
