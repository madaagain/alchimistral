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
    const current = wsRef.current
    // Guard against double-connection (handles React 18 StrictMode double-invoke).
    // Check both OPEN and CONNECTING so we don't create a second socket while the
    // first handshake is still in progress.
    if (
      current &&
      (current.readyState === WebSocket.OPEN ||
        current.readyState === WebSocket.CONNECTING)
    ) {
      return
    }

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      // Ignore events from an abandoned socket that was superseded.
      if (wsRef.current !== ws) return
      setConnected(true)
    }

    ws.onmessage = (event) => {
      if (wsRef.current !== ws) return
      try {
        const data: WsEvent = JSON.parse(event.data)
        setMessages((prev) => [...prev, data])
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = () => {
      // Only act if this socket is still the current one.
      if (wsRef.current !== ws) return
      wsRef.current = null
      setConnected(false)
      reconnectTimer.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [url])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      // Null the ref BEFORE closing so the onclose handler knows this socket
      // has been abandoned and must not trigger a reconnect.
      const ws = wsRef.current
      wsRef.current = null
      ws?.close()
    }
  }, [connect])

  return { connected, messages }
}
