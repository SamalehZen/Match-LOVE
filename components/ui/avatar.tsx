'use client'

import * as React from 'react'

export function Avatar({ src, name, className = '' }: { src?: string | null; name?: string | null; className?: string }) {
  const initials = React.useMemo(() => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    const first = parts[0]?.[0] || ''
    const last = parts[1]?.[0] || ''
    return (first + last).toUpperCase() || 'U'
  }, [name])
  return (
    <div className={`h-8 w-8 rounded-full bg-neutral-200 overflow-hidden flex items-center justify-center text-sm font-medium ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name || 'Avatar'} className="h-full w-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}
