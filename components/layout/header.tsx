'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useNotifications } from '@/lib/hooks/use-notifications'
import { useAuth } from '@/lib/hooks/use-auth'
import { Avatar } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'

export function Header() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const { user, signOut } = useAuth()
  const [openNotif, setOpenNotif] = useState(false)
  const [openUser, setOpenUser] = useState(false)

  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="font-semibold">RaniyaMatch</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <Link href="/history" className="hover:underline">Historique</Link>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <button type="button" onClick={() => setOpenNotif((v) => !v)} className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-red-600 text-white text-[10px] px-1 flex items-center justify-center">{unreadCount}</span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent open={openNotif} onOpenChange={setOpenNotif}>
              <div className="px-3 py-2 text-sm font-medium">Notifications</div>
              {notifications.slice(0, 6).map((n) => (
                <DropdownMenuItem key={n.id} onSelect={() => markAsRead(n.id)}>
                  <div>
                    <div className="font-medium text-sm">{n.title}</div>
                    <div className="text-xs text-neutral-600">{n.message}</div>
                  </div>
                </DropdownMenuItem>
              ))}
              {notifications.length === 0 && (
                <div className="px-4 py-2 text-sm text-neutral-600">Aucune notification</div>
              )}
              {notifications.length > 0 && (
                <div className="px-3 py-2"><Button variant="outline" className="w-full" onClick={() => markAllAsRead()}>Tout marquer comme lu</Button></div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <button type="button" onClick={() => setOpenUser((v) => !v)} className="flex items-center gap-2">
                <Avatar src={user?.avatar_url} name={user?.name || user?.email} />
                <span className="hidden sm:inline">{user?.name || user?.email}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent open={openUser} onOpenChange={setOpenUser}>
              <DropdownMenuItem onSelect={() => (window.location.href = '/profile')}>Profil</DropdownMenuItem>
              <DropdownMenuItem onSelect={async () => { await signOut() }}>Déconnexion</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  )
}
