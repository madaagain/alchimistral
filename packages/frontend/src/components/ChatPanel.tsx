import { useState, useRef, useEffect } from 'react'
import {
  MessageSquare,
  ChevronRight,
  ArrowUp,
  Loader2,
  Sparkles,
  Zap,
  MessageCircle,
} from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import FeedBlock, { ThinkingBlock } from './FeedBlock'
import type { ChatMsg } from '../views/Room'
import { sendMission } from '../api/orchestrator'

interface ChatPanelProps {
  open: boolean
  onToggle: () => void
  projectId: string
  chatMessages: ChatMsg[]
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMsg[]>>
  scanStatus: string | null
  sending: boolean
  setSending: (s: boolean) => void
}

function fmtTs(): string {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function ChatPanel({
  open,
  onToggle,
  projectId,
  chatMessages,
  setChatMessages,
  scanStatus,
  sending,
  setSending,
}: ChatPanelProps) {
  const { theme } = useTheme()
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'chat' | 'mission'>('mission')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, scanStatus])

  const handleSend = async () => {
    const msg = input.trim()
    if (!msg || sending) return
    setInput('')
    setSending(true)

    setChatMessages((prev) => [
      ...prev,
      { role: 'dev', text: msg, ts: fmtTs() },
    ])

    try {
      await sendMission(projectId, msg)
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'sys', text: `Failed to reach backend: ${(err as Error).message}`, ts: fmtTs() },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Toggle button — always visible */}
      {!open && (
        <button
          onClick={onToggle}
          style={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 40,
            height: 40,
            borderRadius: 8,
            background: theme.bg1,
            border: `1px solid ${theme.bdr}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            boxShadow: '0 2px 12px rgba(0,0,0,.3)',
          }}
        >
          <MessageSquare size={18} style={{ color: theme.t2 }} />
        </button>
      )}

      {/* Drawer */}
      <div
        style={{
          width: 380,
          flexShrink: 0,
          transform: open ? 'translateX(0)' : 'translateX(380px)',
          transition: 'transform 200ms ease',
          position: open ? 'relative' : 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          background: theme.bg1 + 'f5',
          borderLeft: `1px solid ${theme.bdr}`,
          zIndex: 45,
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between flex-shrink-0"
          style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}` }}
        >
          <div className="flex items-center gap-2">
            {/* Mode toggle */}
            <button
              onClick={() => setMode('chat')}
              className="flex items-center gap-1 font-mono"
              style={{
                padding: '3px 8px',
                background: mode === 'chat' ? theme.blu + '18' : 'transparent',
                border: `1px solid ${mode === 'chat' ? theme.blu + '44' : theme.bdr}`,
                borderRadius: 4,
                color: mode === 'chat' ? theme.blu : theme.t3,
                fontSize: 9,
                cursor: 'pointer',
                fontWeight: mode === 'chat' ? 600 : 400,
              }}
            >
              <MessageCircle size={10} /> Chat
            </button>
            <button
              onClick={() => setMode('mission')}
              className="flex items-center gap-1 font-mono"
              style={{
                padding: '3px 8px',
                background: mode === 'mission' ? theme.grn + '18' : 'transparent',
                border: `1px solid ${mode === 'mission' ? theme.grn + '44' : theme.bdr}`,
                borderRadius: 4,
                color: mode === 'mission' ? theme.grn : theme.t3,
                fontSize: 9,
                cursor: 'pointer',
                fontWeight: mode === 'mission' ? 600 : 400,
              }}
            >
              <Zap size={10} /> Mission
            </button>
          </div>
          <button
            onClick={onToggle}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 2,
            }}
          >
            <ChevronRight size={16} style={{ color: theme.t3 }} />
          </button>
        </div>

        {/* Message feed */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '12px 14px' }}>
          {chatMessages.length === 0 && !scanStatus && (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 16px',
                fontFamily: theme.mono,
              }}
            >
              <MessageSquare size={20} style={{ color: theme.t3, margin: '0 auto 8px' }} />
              <div style={{ fontSize: 10, color: theme.t3, letterSpacing: 1, marginBottom: 6 }}>
                {mode === 'mission' ? 'MISSION MODE' : 'CHAT MODE'}
              </div>
              <div style={{ fontSize: 9, color: theme.t3, lineHeight: 1.6 }}>
                {mode === 'mission'
                  ? 'Describe what you want to build.\nThe orchestrator will decompose and spawn agents.'
                  : 'Ask questions about the project.\nThe orchestrator will answer using codebase context.'}
              </div>
            </div>
          )}

          {scanStatus && (
            <div
              style={{
                borderLeft: `2px solid ${theme.pur}`,
                padding: '8px 12px',
                marginBottom: 8,
                fontFamily: theme.mono,
              }}
            >
              <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, color: theme.pur, marginBottom: 4 }}>
                SCANNER
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  color: theme.t2,
                  animation: 'thinking-pulse 1.5s ease-in-out infinite',
                }}
              >
                &#9676; {scanStatus}
              </div>
            </div>
          )}

          {chatMessages.map((msg, i) => (
            <FeedBlock key={i} msg={msg} index={i} />
          ))}
          {sending && <ThinkingBlock />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0" style={{ padding: '10px 12px', borderTop: `1px solid ${theme.bdr}` }}>
          <div
            className="flex gap-2 items-end"
            style={{
              background: theme.bg,
              border: `1px solid ${theme.bdr}`,
              borderRadius: 8,
              padding: '8px 10px',
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
              }}
              placeholder={mode === 'mission' ? 'Describe what you want to build...' : 'Ask about this project...'}
              rows={2}
              style={{
                flex: 1, background: 'transparent', border: 'none', color: theme.t,
                fontFamily: theme.sans, fontSize: 12, resize: 'none', outline: 'none', lineHeight: 1.5,
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 28, height: 28, borderRadius: 6,
                background: input.trim() && !sending ? theme.t : theme.bg3,
                border: 'none',
                cursor: input.trim() && !sending ? 'pointer' : 'default',
              }}
            >
              {sending
                ? <Loader2 size={13} style={{ color: theme.t3 }} />
                : <ArrowUp size={13} style={{ color: theme.bg }} />
              }
            </button>
          </div>
          <div className="flex justify-between font-mono" style={{ marginTop: 4, fontSize: 8, color: theme.t3 }}>
            <span className="flex items-center gap-1">
              {mode === 'mission'
                ? <><Zap size={8} style={{ color: theme.grn }} /> Mission mode</>
                : <><MessageCircle size={8} style={{ color: theme.blu }} /> Chat mode</>
              }
              {' '}&middot; Enter to send
            </span>
            <span className="flex items-center gap-1" style={{ color: theme.pur }}>
              <Sparkles size={8} /> Mistral
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
