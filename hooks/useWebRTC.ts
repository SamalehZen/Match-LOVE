'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { SwipeMessage } from '@/lib/types'

interface UseWebRTCOptions {
  roomId: string
  role: 'A' | 'B'
  onMessage: (message: SwipeMessage) => void
  onConnected: () => void
  onDisconnected: () => void
}

export function useWebRTC({ roomId, role, onMessage, onConnected, onDisconnected }: UseWebRTCOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [channelReady, setChannelReady] = useState(false)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const icePollRef = useRef<NodeJS.Timeout | null>(null)
  const processedCandidates = useRef<Set<string>>(new Set())
  const pendingMessages = useRef<SwipeMessage[]>([])

  const onMessageRef = useRef(onMessage)
  const onConnectedRef = useRef(onConnected)
  const onDisconnectedRef = useRef(onDisconnected)

  useEffect(() => {
    onMessageRef.current = onMessage
    onConnectedRef.current = onConnected
    onDisconnectedRef.current = onDisconnected
  }, [onMessage, onConnected, onDisconnected])

  const flushPendingMessages = useCallback(() => {
    if (dcRef.current && dcRef.current.readyState === 'open' && pendingMessages.current.length > 0) {
      console.log(`[WebRTC] Flushing ${pendingMessages.current.length} pending messages`)
      pendingMessages.current.forEach(msg => {
        dcRef.current!.send(JSON.stringify(msg))
        console.log('[WebRTC] Sent pending message:', msg.type)
      })
      pendingMessages.current = []
    }
  }, [])

  const sendMessage = useCallback((message: SwipeMessage) => {
    console.log('[WebRTC] sendMessage called:', message.type, 'channel ready:', dcRef.current?.readyState)
    
    if (dcRef.current && dcRef.current.readyState === 'open') {
      try {
        const data = JSON.stringify(message)
        console.log('[WebRTC] Sending message, size:', data.length)
        dcRef.current.send(data)
        console.log('[WebRTC] Message sent successfully:', message.type)
      } catch (e) {
        console.error('[WebRTC] Error sending message:', e)
        pendingMessages.current.push(message)
      }
    } else {
      console.log('[WebRTC] Channel not ready, queuing message:', message.type)
      pendingMessages.current.push(message)
    }
  }, [])

  const setupDataChannel = useCallback((channel: RTCDataChannel) => {
    console.log('[WebRTC] Setting up data channel, current state:', channel.readyState)
    dcRef.current = channel
    
    channel.onopen = () => {
      console.log('[WebRTC] ✅ Data channel OPEN')
      setChannelReady(true)
      setIsConnected(true)
      setIsConnecting(false)
      onConnectedRef.current()
      setTimeout(flushPendingMessages, 100)
    }
    
    channel.onclose = () => {
      console.log('[WebRTC] Data channel CLOSED')
      setChannelReady(false)
      setIsConnected(false)
      onDisconnectedRef.current()
    }

    channel.onerror = (e) => {
      console.error('[WebRTC] Data channel error:', e)
      setError('Erreur de connexion')
    }
    
    channel.onmessage = (event) => {
      console.log('[WebRTC] 📩 Message received, size:', event.data.length)
      try {
        const message = JSON.parse(event.data) as SwipeMessage
        console.log('[WebRTC] Parsed message type:', message.type)
        onMessageRef.current(message)
      } catch (e) {
        console.error('[WebRTC] Failed to parse message:', e)
      }
    }

    if (channel.readyState === 'open') {
      console.log('[WebRTC] Channel already open')
      setChannelReady(true)
      setIsConnected(true)
      setIsConnecting(false)
      onConnectedRef.current()
    }
  }, [flushPendingMessages])

  const sendIceCandidate = useCallback(async (candidate: RTCIceCandidate) => {
    try {
      await fetch('/api/room/ice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, candidate: candidate.toJSON(), role }),
      })
    } catch (e) {
      console.error('[WebRTC] Error sending ICE:', e)
    }
  }, [roomId, role])

  const pollIceCandidates = useCallback(async () => {
    try {
      const res = await fetch(`/api/room/ice?roomId=${roomId}&role=${role}`)
      const data = await res.json()
      
      if (data.candidates && data.candidates.length > 0 && pcRef.current) {
        for (const candidate of data.candidates) {
          const candidateStr = JSON.stringify(candidate)
          if (!processedCandidates.current.has(candidateStr)) {
            processedCandidates.current.add(candidateStr)
            try {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate))
            } catch (e) {
              // Ignore errors for already added candidates
            }
          }
        }
      }
    } catch (e) {
      // Silent fail for polling
    }
  }, [roomId, role])

  const createOffer = useCallback(async () => {
    console.log('[WebRTC] Creating offer as role A')
    setIsConnecting(true)
    setError(null)
    
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ],
      })
      pcRef.current = pc

      pc.onconnectionstatechange = () => {
        console.log('[WebRTC] Connection state:', pc.connectionState)
      }

      const channel = pc.createDataChannel('datematch', { 
        ordered: true,
      })
      setupDataChannel(channel)

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendIceCandidate(event.candidate)
        }
      }

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      await fetch('/api/room/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, offer }),
      })

      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/room/answer?roomId=${roomId}`)
          const data = await res.json()
          
          if (data.answer && pcRef.current && !pcRef.current.remoteDescription) {
            console.log('[WebRTC] Answer received')
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer))
            
            if (pollingRef.current) {
              clearInterval(pollingRef.current)
              pollingRef.current = null
            }
          }
        } catch (e) {
          console.error('[WebRTC] Error polling for answer:', e)
        }
      }, 1000)

      icePollRef.current = setInterval(pollIceCandidates, 1000)

    } catch (e) {
      console.error('[WebRTC] Error creating offer:', e)
      setError(e instanceof Error ? e.message : 'Failed to create offer')
      setIsConnecting(false)
    }
  }, [roomId, setupDataChannel, sendIceCandidate, pollIceCandidates])

  const acceptOffer = useCallback(async () => {
    console.log('[WebRTC] Accepting offer as role B')
    setIsConnecting(true)
    setError(null)

    try {
      const res = await fetch(`/api/room/offer?roomId=${roomId}`)
      const data = await res.json()
      
      if (!data.offer) {
        setIsConnecting(false)
        return false
      }

      console.log('[WebRTC] Offer received')

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ],
      })
      pcRef.current = pc

      pc.onconnectionstatechange = () => {
        console.log('[WebRTC] Connection state:', pc.connectionState)
      }

      pc.ondatachannel = (event) => {
        console.log('[WebRTC] 📡 Data channel received from peer')
        setupDataChannel(event.channel)
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendIceCandidate(event.candidate)
        }
      }

      await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
      
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      await fetch('/api/room/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, answer }),
      })

      icePollRef.current = setInterval(pollIceCandidates, 1000)
      
      return true
    } catch (e) {
      console.error('[WebRTC] Error accepting offer:', e)
      setError(e instanceof Error ? e.message : 'Failed to accept offer')
      setIsConnecting(false)
      return false
    }
  }, [roomId, setupDataChannel, sendIceCandidate, pollIceCandidates])

  const disconnect = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    if (icePollRef.current) {
      clearInterval(icePollRef.current)
      icePollRef.current = null
    }
    if (dcRef.current) {
      dcRef.current.close()
      dcRef.current = null
    }
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
    processedCandidates.current.clear()
    pendingMessages.current = []
    setChannelReady(false)
    setIsConnected(false)
    setIsConnecting(false)
  }, [])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    isConnecting,
    channelReady,
    error,
    sendMessage,
    createOffer,
    acceptOffer,
    disconnect,
  }
}
