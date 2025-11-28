'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useWebRTC } from '@/hooks/useWebRTC'
import { usePlaces } from '@/hooks/usePlaces'
import { CardStack } from '@/components/swipe/CardStack'
import { Button } from '@/components/ui/button'
import type { Place, SwipeMessage } from '@/lib/types'

type RoomState = 'waiting' | 'connecting' | 'connected' | 'swiping' | 'done'

export default function RoomPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const roomId = params.roomId as string
  const role = (searchParams.get('role') as 'A' | 'B') || 'B'
  
  const [state, setState] = useState<RoomState>('waiting')
  const [places, setPlaces] = useState<Place[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [myLikes, setMyLikes] = useState<number[]>([])
  const [partnerLikes, setPartnerLikes] = useState<number[]>([])
  const [partnerDone, setPartnerDone] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const { fetchPlaces, getLocation, loading: loadingPlaces } = usePlaces()

  const handleMessage = useCallback((message: SwipeMessage) => {
    if (message.type === 'PLACES' && message.places) {
      setPlaces(message.places)
      setState('swiping')
    } else if (message.type === 'SWIPE' && message.value && message.index !== undefined) {
      if (message.value === 'LIKE') {
        setPartnerLikes(prev => [...prev, message.index!])
      }
    } else if (message.type === 'DONE' && message.likes) {
      setPartnerLikes(message.likes)
      setPartnerDone(true)
    }
  }, [])

  const handleConnected = useCallback(() => {
    setState('connected')
  }, [])

  const handleDisconnected = useCallback(() => {
    setState('waiting')
  }, [])

  const { isConnected, isConnecting, sendMessage, createOffer, acceptOffer } = useWebRTC({
    roomId,
    role,
    onMessage: handleMessage,
    onConnected: handleConnected,
    onDisconnected: handleDisconnected,
  })

  useEffect(() => {
    if (role === 'A') {
      setState('connecting')
      createOffer()
    }
  }, [role, createOffer])

  useEffect(() => {
    if (role === 'B' && state === 'waiting') {
      const tryConnect = async () => {
        setState('connecting')
        const connected = await acceptOffer()
        if (!connected) {
          setTimeout(tryConnect, 2000)
        }
      }
      tryConnect()
    }
  }, [role, state, acceptOffer])

  const startGame = async () => {
    const location = await getLocation()
    const fetchedPlaces = await fetchPlaces(location?.lat, location?.lng)
    setPlaces(fetchedPlaces)
    setState('swiping')
    sendMessage({ type: 'PLACES', places: fetchedPlaces })
  }

  const handleSwipe = (direction: 'LIKE' | 'NOPE') => {
    sendMessage({ type: 'SWIPE', index: currentIndex, value: direction })
    
    if (direction === 'LIKE') {
      setMyLikes(prev => [...prev, currentIndex])
    }
    
    const nextIndex = currentIndex + 1
    setCurrentIndex(nextIndex)
    
    if (nextIndex >= places.length) {
      const finalLikes = direction === 'LIKE' ? [...myLikes, currentIndex] : myLikes
      sendMessage({ type: 'DONE', likes: finalLikes })
      setState('done')
    }
  }

  const copyLink = () => {
    const link = `${window.location.origin}/room/${roomId}?role=B`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const goToMatches = () => {
    const matchedIndices = myLikes.filter(i => partnerLikes.includes(i))
    const matchedPlaces = matchedIndices.map(i => places[i])
    
    sessionStorage.setItem('matchedPlaces', JSON.stringify(matchedPlaces))
    router.push(`/match/${roomId}`)
  }

  useEffect(() => {
    if (state === 'done' && partnerDone) {
      goToMatches()
    }
  }, [state, partnerDone])

  if (state === 'waiting' || state === 'connecting') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-6 bounce-animation">💕</div>
          <h1 className="text-2xl font-bold mb-2">Room: {roomId}</h1>
          
          {role === 'A' ? (
            <>
              <p className="text-gray-600 mb-6">
                {isConnecting ? 'En attente de votre partenaire...' : 'Partagez ce code avec votre partenaire'}
              </p>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
                <p className="text-4xl font-bold tracking-widest gradient-text">{roomId}</p>
              </div>
              
              <Button onClick={copyLink} variant="outline" className="mb-4">
                {copied ? '✓ Copié!' : 'Copier le lien'}
              </Button>
              
              {isConnected && (
                <div className="mt-6">
                  <p className="text-green-600 font-semibold mb-4">✓ Partenaire connecté!</p>
                  <Button onClick={startGame} disabled={loadingPlaces}>
                    {loadingPlaces ? 'Chargement des lieux...' : 'Commencer à swiper'}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-4">Connexion en cours...</p>
              <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </>
          )}
        </div>
      </div>
    )
  }

  if (state === 'connected' && role === 'B') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-6">✨</div>
          <h1 className="text-2xl font-bold mb-2">Connecté!</h1>
          <p className="text-gray-600">En attente que votre partenaire lance la partie...</p>
          <div className="mt-6">
            <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  if (state === 'swiping') {
    return (
      <div className="h-screen flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            {currentIndex + 1} / {places.length}
          </div>
          <div className="text-xl font-bold gradient-text">DateMatch</div>
          <div className="text-sm text-gray-600">
            ❤️ {myLikes.length}
          </div>
        </div>
        
        <CardStack
          places={places}
          currentIndex={currentIndex}
          onSwipe={handleSwipe}
        />
      </div>
    )
  }

  if (state === 'done') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-6 pulse-animation">⏳</div>
          <h1 className="text-2xl font-bold mb-2">Terminé!</h1>
          <p className="text-gray-600">En attente des résultats de votre partenaire...</p>
        </div>
      </div>
    )
  }

  return null
}
