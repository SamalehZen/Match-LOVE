'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { authService } from '@/lib/services/auth.service'
import type { AuthUser } from '@/types/auth.types'
import { ROUTES } from '@/lib/constants'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signUp: (email: string, password: string, name: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<AuthUser>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: (session.user.user_metadata as { name?: string }).name,
          avatar_url: (session.user.user_metadata as { avatar_url?: string }).avatar_url,
        })
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: (session.user.user_metadata as { name?: string }).name,
          avatar_url: (session.user.user_metadata as { avatar_url?: string }).avatar_url,
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signUp = async (email: string, password: string, name: string) => {
    await authService.signUp(email, password, name)
    router.push(ROUTES.LOGIN)
  }

  const signIn = async (email: string, password: string) => {
    await authService.signIn(email, password)
    router.push(ROUTES.DASHBOARD)
  }

  const signInWithGoogle = async () => {
    await authService.signInWithGoogle()
  }

  const signOut = async () => {
    await authService.signOut()
    router.push(ROUTES.HOME)
  }

  const updateProfile = async (data: Partial<AuthUser>) => {
    if (!user) throw new Error('Not authenticated')
    const updated = await authService.updateProfile(user.id, data)
    setUser({ ...user, ...(updated as Partial<AuthUser>) })
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithGoogle, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
