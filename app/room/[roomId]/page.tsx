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
  const [debugInfo, setDebugInfo] = useState('')
  
  const { fetchPlaces, getLocation, loading: loadingPlaces } = usePlaces()

  const handleMessage = useCallback((message: SwipeMessage) => {
    console.log('[Room] 📩 Received message:', message.type)
    if (message.type === 'PLACES' && message.places) {
      console.log('[Room] Setting places, count:', message.places.length)
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
    console.log('[Room] ✅ Connected!')
    setState('connected')
    setDebugInfo('Connecté!')
  }, [])

  const handleDisconnected = useCallback(() => {
    console.log('[Room] Disconnected')
    setState('waiting')
    setDebugInfo('Déconnecté')
  }, [])

  const { isConnected, isConnecting, channelReady, error, sendMessage, createOffer, acceptOffer } = useWebRTC({
    roomId,
    role,
    onMessage: handleMessage,
    onConnected: handleConnected,
    onDisconnected: handleDisconnected,
  })

  useEffect(() => {
    if (role === 'A' && state === 'waiting') {
      console.log('[Room] Role A - Creating offer')
      setState('connecting')
      createOffer()
    }
  }, [role, state, createOffer])

  useEffect(() => {
    if (role === 'B' && state === 'waiting') {
      const tryConnect = async () => {
        console.log('[Room] Role B - Trying to accept offer')
        setState('connecting')
        const connected = await acceptOffer()
        if (!connected) {
          console.log('[Room] No offer yet, retrying in 2s')
          setDebugInfo('Recherche de la room...')
          setState('waiting')
          setTimeout(tryConnect, 2000)
        }
      }
      tryConnect()
    }
  }, [role, state, acceptOffer])

  useEffect(() => {
    if (channelReady && state === 'connecting') {
      console.log('[Room] Channel ready, setting state to connected')
      setState('connected')
    }
  }, [channelReady, state])

  const startGame = async () => {
    console.log('[Room] Starting game, channelReady:', channelReady)
    
    if (!channelReady) {
      setDebugInfo('Attente de la connexion...')
      return
    }
    
    const location = await getLocation()
    const fetchedPlaces = await fetchPlaces(location?.lat, location?.lng)
    
    console.log('[Room] Places fetched:', fetchedPlaces.length)
    setPlaces(fetchedPlaces)
    
    setTimeout(() => {
      console.log('[Room] Sending PLACES message')
      sendMessage({ type: 'PLACES', places: fetchedPlaces })
      setState('swiping')
    }, 500)
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

  const goToMatches = useCallback(() => {
    const matchedIndices = myLikes.filter(i => partnerLikes.includes(i))
    const matchedPlaces = matchedIndices.map(i => places[i])
    
    sessionStorage.setItem('matchedPlaces', JSON.stringify(matchedPlaces))
    router.push(`/match/${roomId}`)
  }, [myLikes, partnerLikes, places, roomId, router])

  useEffect(() => {
    if (state === 'done' && partnerDone) {
      goToMatches()
    }
  }, [state, partnerDone, goToMatches])

  if (state === 'waiting' || state === 'connecting') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-6 bounce-animation">💕</div>
          <h1 className="text-2xl font-bold mb-2">Room: {roomId}</h1>
          
          {role === 'A' ? (
            <>
              <p className="text-gray-600 mb-6">
                {channelReady ? 'Partenaire connecté!' : 'En attente de votre partenaire...'}
              </p>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
                <p className="text-4xl font-bold tracking-widest gradient-text">{roomId}</p>
              </div>
              
              <Button onClick={copyLink} variant="outline" className="mb-4">
                {copied ? '✓ Copié!' : 'Copier le lien'}
              </Button>
              
              {channelReady && (
                <div className="mt-6">
                  <p className="text-green-600 font-semibold mb-4">✓ Partenaire connecté!</p>
                  <Button onClick={startGame} disabled={loadingPlaces}>
                    {loadingPlaces ? 'Chargement des lieux...' : 'Commencer à swiper'}
                  </Button>
                </div>
              )}

              {!channelReady && (
                <div className="mt-4">
                  <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Partagez le code ci-dessus avec votre partenaire
                  </p>
                </div>
              )}

              {error && (
                <p className="mt-4 text-red-500 text-sm">{error}</p>
              )}
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-4">
                {debugInfo || 'Connexion en cours...'}
              </p>
              <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
              {error && (
                <p className="mt-4 text-red-500 text-sm">{error}</p>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  if (state === 'connected') {
    if (role === 'B') {
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
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-6">✨</div>
          <h1 className="text-2xl font-bold mb-2">Partenaire connecté!</h1>
          <Button onClick={startGame} disabled={loadingPlaces} size="lg">
            {loadingPlaces ? 'Chargement des lieux...' : 'Commencer à swiper'}
          </Button>
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
