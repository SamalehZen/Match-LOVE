'use client'

import * as React from 'react'

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  return <div className="relative inline-block text-left">{children}</div>
}

export function DropdownMenuTrigger({ children }: { children: React.ReactNode }) {
  return <button type="button">{children}</button>
}

export function DropdownMenuContent({ open, onOpenChange, children }: { open: boolean; onOpenChange: (v: boolean) => void; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md border bg-white shadow-lg">
      <div className="py-1" onClick={() => onOpenChange(false)}>{children}</div>
    </div>
  )
}

export function DropdownMenuItem({ onSelect, children }: { onSelect?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100"
    >
      {children}
    </button>
  )
}
