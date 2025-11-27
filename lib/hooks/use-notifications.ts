'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useNotifications() {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; read: boolean }>>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      const list = (data || []) as Array<{ id: string; title: string; message: string; read: boolean }>
      setNotifications(list)
      setUnreadCount(list.filter((n) => !n.read).length)

      channel = supabase
        .channel('notifications')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
          const n = payload.new as { id: string; title: string; message: string; read: boolean }
          setNotifications((prev) => [n, ...prev])
          setUnreadCount((c) => c + 1)
        })
        .subscribe()
    }

    load()
    return () => {
      if (channel) channel.unsubscribe()
    }
  }, [supabase])

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true, read_at: new Date().toISOString() }).eq('id', id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  const markAllAsRead = async () => {
    await supabase.from('notifications').update({ read: true, read_at: new Date().toISOString() }).eq('read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  return { notifications, unreadCount, markAsRead, markAllAsRead }
}
