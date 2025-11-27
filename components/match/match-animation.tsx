'use client'

import { useEffect, useRef } from 'react'

export function MatchAnimation({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active || !ref.current) return
    const el = ref.current
    el.classList.add('animate-fade-in')
    const t = setTimeout(() => el.classList.remove('animate-fade-in'), 800)
    return () => clearTimeout(t)
  }, [active])

  if (!active) return null

  return (
    <div ref={ref} className="relative overflow-hidden rounded-lg border p-6 bg-white">
      <div className="text-5xl text-center mb-2">🎉</div>
      <div className="text-center text-xl font-semibold">Match trouvé !</div>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-4 left-1/4 text-3xl animate-bounce">❤️</div>
        <div className="absolute top-1/3 right-1/4 text-3xl animate-bounce">💘</div>
        <div className="absolute bottom-4 left-1/3 text-3xl animate-bounce">💞</div>
      </div>
    </div>
  )
}
