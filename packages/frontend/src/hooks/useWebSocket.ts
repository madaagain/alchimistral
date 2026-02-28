import { useEffect, useRef, useState, useCallback } from 'react'

export interface WsEvent {
  agent_id: string
  type: string
  text?: string
  timestamp?: string
  [key: string]: unknown
}

export function useWebSocket(url: string) {
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<WsEvent[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>()

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(url)

    ws.onopen = () => {
      setConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const data: WsEvent = JSON.parse(event.data)
        setMessages((prev) => [...prev, data])
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = () => {
      setConnected(false)
      wsRef.current = null
      reconnectTimer.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }

    wsRef.current = ws
  }, [url])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  return { connected, messages }
}
