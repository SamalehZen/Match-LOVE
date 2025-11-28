'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const router = useRouter()
  const [joinCode, setJoinCode] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [showJoinInput, setShowJoinInput] = useState(false)

  const createRoom = async () => {
    setIsCreating(true)
    try {
      const res = await fetch('/api/room/create', { method: 'POST' })
      const data = await res.json()
      if (data.roomId) {
        router.push(`/room/${data.roomId}?role=A`)
      }
    } catch (e) {
      console.error('Failed to create room:', e)
    } finally {
      setIsCreating(false)
    }
  }

  const joinRoom = () => {
    if (joinCode.trim()) {
      setIsJoining(true)
      router.push(`/room/${joinCode.trim().toUpperCase()}?role=B`)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <div className="text-7xl mb-4">💕</div>
        <h1 className="text-5xl font-bold gradient-text mb-3">DateMatch</h1>
        <p className="text-gray-600 text-lg">
          Trouvez le lieu parfait ensemble
        </p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <Button
          onClick={createRoom}
          disabled={isCreating}
          className="w-full"
          size="lg"
        >
          {isCreating ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Création...
            </span>
          ) : (
            'Créer une Room'
          )}
        </Button>

        {!showJoinInput ? (
          <Button
            onClick={() => setShowJoinInput(true)}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Rejoindre une Room
          </Button>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Code de la room"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border-2 border-pink-300 rounded-2xl focus:border-pink-500 focus:outline-none uppercase"
              maxLength={6}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                onClick={() => setShowJoinInput(false)}
                variant="ghost"
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={joinRoom}
                disabled={!joinCode.trim() || isJoining}
                className="flex-1"
              >
                {isJoining ? 'Connexion...' : 'Rejoindre'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-12 text-gray-500 text-sm text-center">
        Swipez ensemble • Trouvez votre match • Profitez du moment
      </p>
    </div>
  )
}
