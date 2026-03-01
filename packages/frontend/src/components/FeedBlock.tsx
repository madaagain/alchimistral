import { useTheme } from '../hooks/useTheme'
import type { ChatMsg } from '../views/Room'

interface FeedBlockProps {
  msg: ChatMsg
  index: number
}

export default function FeedBlock({ msg }: FeedBlockProps) {
  const { theme } = useTheme()

  const borderColors: Record<string, string> = {
    dev: theme.t,
    sys: theme.t3,
    orch: theme.blu,
    rep: theme.pur,
    val: theme.grn,
    agent: theme.cyn,
    mission: theme.grn,
  }

  const labels: Record<string, string> = {
    dev: 'USER',
    sys: 'SYSTEM',
    orch: 'ORCHESTRATOR',
    rep: 'REPROMPT',
    val: 'VALIDATION',
    agent: 'AGENT',
    mission: 'MISSION',
  }

  const borderColor = borderColors[msg.role] || theme.t3
  const label = labels[msg.role] || msg.role.toUpperCase()

  // Detect sub-types from orchestrator messages
  let effectiveLabel = label
  let effectiveBorder = borderColor
  if (msg.role === 'orch' && 'text' in msg) {
    if (msg.text.startsWith('DAG decomposed:')) {
      effectiveLabel = 'PLAN'
      effectiveBorder = theme.blu
    } else if (msg.text.startsWith('Contract written:')) {
      effectiveLabel = 'CONTRACT'
      effectiveBorder = theme.cyn
    } else if (msg.text.startsWith('Global memory updated:')) {
      effectiveLabel = 'MEMORY'
      effectiveBorder = theme.amb
    } else if (msg.text.startsWith('Error:')) {
      effectiveLabel = 'ERROR'
      effectiveBorder = theme.red
    }
  }

  // Agent sub-label shows agent ID and event type
  if (msg.role === 'agent') {
    effectiveLabel = msg.agentId.toUpperCase()
    if (msg.eventType === 'spawn') effectiveBorder = theme.pur
    else if (msg.eventType === 'done') { effectiveBorder = theme.grn; effectiveLabel += ' \u2713' }
    else if (msg.eventType === 'error') { effectiveBorder = theme.red; effectiveLabel += ' \u2717' }
  }

  // Mission complete styling
  if (msg.role === 'mission') {
    effectiveLabel = msg.success ? 'MISSION COMPLETE' : 'MISSION FINISHED'
    effectiveBorder = msg.success ? theme.grn : theme.amb
  }

  return (
    <div
      style={{
        borderLeft: `2px solid ${effectiveBorder}`,
        padding: '8px 12px',
        marginBottom: 8,
        fontFamily: theme.mono,
        transition: 'opacity 150ms ease',
      }}
    >
      {/* Header line */}
      <div
        style={{
          fontSize: 8,
          fontWeight: 600,
          letterSpacing: 2,
          color: effectiveBorder,
          marginBottom: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{effectiveLabel}</span>
        <span style={{ color: theme.t3, fontWeight: 400, letterSpacing: 0, fontSize: 8 }}>{msg.ts}</span>
      </div>

      {/* Content */}
      {msg.role === 'rep' ? (
        <>
          <div style={{ fontSize: 10, color: theme.t3, textDecoration: 'line-through', marginBottom: 4 }}>
            {msg.orig}
          </div>
          <div style={{ fontSize: 10.5, color: theme.t, lineHeight: 1.6 }}>
            {msg.refined}
          </div>
        </>
      ) : msg.role === 'val' ? (
        <div>
          <span style={{ color: msg.status === 'pass' ? theme.grn : theme.red, fontSize: 10.5 }}>
            {msg.status === 'pass' ? '\u2713' : '\u2717'} {msg.agent.toUpperCase()} &mdash; Gate L{msg.level}: {msg.status.toUpperCase()}
          </span>
          <div style={{ fontSize: 9.5, color: theme.t2, marginTop: 2 }}>{msg.detail}</div>
        </div>
      ) : msg.role === 'mission' ? (
        <div>
          <div style={{ fontSize: 11, color: msg.success ? theme.grn : theme.amb, fontWeight: 600, marginBottom: 4 }}>
            {msg.success ? '\u2713' : '\u26a0'} {msg.completed}/{msg.total} agents completed
          </div>
          <div style={{ fontSize: 10.5, color: theme.t2, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {msg.text}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 10.5, color: msg.role === 'dev' ? theme.t : theme.t2, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {'text' in msg ? msg.text : ''}
        </div>
      )}
    </div>
  )
}

export function ThinkingBlock() {
  const { theme } = useTheme()
  return (
    <div
      style={{
        borderLeft: `2px solid ${theme.blu}`,
        padding: '8px 12px',
        marginBottom: 8,
        fontFamily: theme.mono,
      }}
    >
      <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, color: theme.blu, marginBottom: 4 }}>
        ORCHESTRATOR
      </div>
      <div
        style={{
          fontSize: 10.5,
          color: theme.t2,
          animation: 'thinking-pulse 1.5s ease-in-out infinite',
        }}
      >
        &#9676; Thinking...
      </div>
    </div>
  )
}
