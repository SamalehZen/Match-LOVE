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
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const sendMessage = useCallback((message: SwipeMessage) => {
    if (dcRef.current && dcRef.current.readyState === 'open') {
      dcRef.current.send(JSON.stringify(message))
    }
  }, [])

  const setupDataChannel = useCallback((channel: RTCDataChannel) => {
    dcRef.current = channel
    
    channel.onopen = () => {
      setIsConnected(true)
      setIsConnecting(false)
      onConnected()
    }
    
    channel.onclose = () => {
      setIsConnected(false)
      onDisconnected()
    }
    
    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as SwipeMessage
        onMessage(message)
      } catch (e) {
        console.error('Failed to parse message:', e)
      }
    }
  }, [onConnected, onDisconnected, onMessage])

  const sendIceCandidate = useCallback(async (candidate: RTCIceCandidate) => {
    await fetch('/api/room/ice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, candidate: candidate.toJSON(), role }),
    })
  }, [roomId, role])

  const pollIceCandidates = useCallback(async () => {
    try {
      const res = await fetch(`/api/room/ice?roomId=${roomId}&role=${role}`)
      const data = await res.json()
      
      if (data.candidates && pcRef.current) {
        for (const candidate of data.candidates) {
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate))
          } catch (e) {
            console.error('Error adding ICE candidate:', e)
          }
        }
      }
    } catch (e) {
      console.error('Error polling ICE candidates:', e)
    }
  }, [roomId, role])

  const createOffer = useCallback(async () => {
    setIsConnecting(true)
    
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    })
    pcRef.current = pc

    const channel = pc.createDataChannel('datematch', { ordered: true })
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
      const res = await fetch(`/api/room/answer?roomId=${roomId}`)
      const data = await res.json()
      
      if (data.answer && pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer))
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = setInterval(pollIceCandidates, 1000)
        }
      }
    }, 1000)
  }, [roomId, setupDataChannel, sendIceCandidate, pollIceCandidates])

  const acceptOffer = useCallback(async () => {
    setIsConnecting(true)

    const res = await fetch(`/api/room/offer?roomId=${roomId}`)
    const data = await res.json()
    
    if (!data.offer) {
      setIsConnecting(false)
      return false
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    })
    pcRef.current = pc

    pc.ondatachannel = (event) => {
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

    pollingRef.current = setInterval(pollIceCandidates, 1000)
    
    return true
  }, [roomId, setupDataChannel, sendIceCandidate, pollIceCandidates])

  const disconnect = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }
    if (dcRef.current) {
      dcRef.current.close()
    }
    if (pcRef.current) {
      pcRef.current.close()
    }
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
    sendMessage,
    createOffer,
    acceptOffer,
    disconnect,
  }
}
