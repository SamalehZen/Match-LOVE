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
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const icePollRef = useRef<NodeJS.Timeout | null>(null)
  const processedCandidates = useRef<Set<string>>(new Set())

  const onMessageRef = useRef(onMessage)
  const onConnectedRef = useRef(onConnected)
  const onDisconnectedRef = useRef(onDisconnected)

  useEffect(() => {
    onMessageRef.current = onMessage
    onConnectedRef.current = onConnected
    onDisconnectedRef.current = onDisconnected
  }, [onMessage, onConnected, onDisconnected])

  const sendMessage = useCallback((message: SwipeMessage) => {
    if (dcRef.current && dcRef.current.readyState === 'open') {
      dcRef.current.send(JSON.stringify(message))
      console.log('[WebRTC] Message sent:', message.type)
    } else {
      console.warn('[WebRTC] Cannot send message, channel not open')
    }
  }, [])

  const setupDataChannel = useCallback((channel: RTCDataChannel) => {
    console.log('[WebRTC] Setting up data channel')
    dcRef.current = channel
    
    channel.onopen = () => {
      console.log('[WebRTC] Data channel OPEN')
      setIsConnected(true)
      setIsConnecting(false)
      onConnectedRef.current()
    }
    
    channel.onclose = () => {
      console.log('[WebRTC] Data channel CLOSED')
      setIsConnected(false)
      onDisconnectedRef.current()
    }

    channel.onerror = (e) => {
      console.error('[WebRTC] Data channel error:', e)
    }
    
    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as SwipeMessage
        console.log('[WebRTC] Message received:', message.type)
        onMessageRef.current(message)
      } catch (e) {
        console.error('[WebRTC] Failed to parse message:', e)
      }
    }
  }, [])

  const sendIceCandidate = useCallback(async (candidate: RTCIceCandidate) => {
    try {
      console.log('[WebRTC] Sending ICE candidate')
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
              console.log('[WebRTC] Added ICE candidate')
            } catch (e) {
              console.error('[WebRTC] Error adding ICE candidate:', e)
            }
          }
        }
      }
    } catch (e) {
      console.error('[WebRTC] Error polling ICE candidates:', e)
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
        if (pc.connectionState === 'connected') {
          setIsConnected(true)
          setIsConnecting(false)
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setError('Connection failed')
        }
      }

      pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC] ICE connection state:', pc.iceConnectionState)
      }

      const channel = pc.createDataChannel('datematch', { ordered: true })
      setupDataChannel(channel)

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendIceCandidate(event.candidate)
        }
      }

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      console.log('[WebRTC] Offer created and set as local description')

      const res = await fetch('/api/room/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, offer }),
      })
      
      if (!res.ok) {
        throw new Error('Failed to store offer')
      }
      console.log('[WebRTC] Offer stored on server')

      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/room/answer?roomId=${roomId}`)
          const data = await res.json()
          
          if (data.answer && pcRef.current && !pcRef.current.remoteDescription) {
            console.log('[WebRTC] Answer received, setting remote description')
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
        console.log('[WebRTC] No offer available yet')
        setIsConnecting(false)
        return false
      }

      console.log('[WebRTC] Offer received from server')

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
        if (pc.connectionState === 'connected') {
          setIsConnected(true)
          setIsConnecting(false)
        }
      }

      pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC] ICE connection state:', pc.iceConnectionState)
      }

      pc.ondatachannel = (event) => {
        console.log('[WebRTC] Data channel received')
        setupDataChannel(event.channel)
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendIceCandidate(event.candidate)
        }
      }

      await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
      console.log('[WebRTC] Remote description set')
      
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      console.log('[WebRTC] Answer created and set as local description')

      const answerRes = await fetch('/api/room/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, answer }),
      })

      if (!answerRes.ok) {
        throw new Error('Failed to store answer')
      }
      console.log('[WebRTC] Answer stored on server')

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
    console.log('[WebRTC] Disconnecting')
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
    error,
    sendMessage,
    createOffer,
    acceptOffer,
    disconnect,
  }
}
