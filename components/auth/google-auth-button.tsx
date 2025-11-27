'use client'

import { authService } from '@/lib/services/auth.service'

export function GoogleAuthButton() {
  const onClick = async () => {
    await authService.signInWithGoogle()
  }
  return (
    <button onClick={onClick} className="w-full rounded-md border px-4 py-2 hover:bg-black/5">
      Continuer avec Google
    </button>
  )
}
