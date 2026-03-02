import {
  GitMerge,
  CheckCircle2,
  AlertTriangle,
  Package,
  Terminal,
  Bot,
  XCircle,
  GitBranch,
} from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import type { ChatMsg } from '../views/Room'

interface FeedBlockProps {
  msg: ChatMsg
  index: number
}

function CodeBlock({ code, theme }: { code: string; theme: ReturnType<typeof useTheme>['theme'] }) {
  return (
    <pre
      style={{
        background: '#0d0d0d',
        border: `1px solid ${theme.bdr}`,
        borderRadius: 4,
        padding: '8px 10px',
        fontSize: 9.5,
        lineHeight: 1.6,
        color: '#c8c8c8',
        overflowX: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: 200,
        marginTop: 4,
      }}
    >
      {code}
    </pre>
  )
}

function renderMarkdownish(text: string, theme: ReturnType<typeof useTheme>['theme']) {
  // Split on code blocks (```...```)
  const parts = text.split(/(```[\s\S]*?```)/g)
  return parts.map((part, i) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const code = part.replace(/^```\w*\n?/, '').replace(/\n?```$/, '')
      return <CodeBlock key={i} code={code} theme={theme} />
    }
    // Inline code
    const inlined = part.split(/(`[^`]+`)/g)
    return (
      <span key={i}>
        {inlined.map((seg, j) => {
          if (seg.startsWith('`') && seg.endsWith('`')) {
            return (
              <code
                key={j}
                style={{
                  background: theme.bg3,
                  padding: '1px 4px',
                  borderRadius: 2,
                  fontSize: '0.92em',
                  color: theme.cyn,
                }}
              >
                {seg.slice(1, -1)}
              </code>
            )
          }
          return seg
        })}
      </span>
    )
  })
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
    merge: theme.grn,
    deps: theme.blu,
    run: theme.grn,
  }

  const labels: Record<string, string> = {
    dev: 'USER',
    sys: 'SYSTEM',
    orch: 'ORCHESTRATOR',
    rep: 'REPROMPT',
    val: 'VALIDATION',
    agent: 'AGENT',
    mission: 'MISSION',
    merge: 'MERGE',
    deps: 'DEPENDENCIES',
    run: 'VERIFICATION',
  }

  const borderColor = borderColors[msg.role] || theme.t3
  const label = labels[msg.role] || msg.role.toUpperCase()

  let effectiveLabel = label
  let effectiveBorder = borderColor
  let icon: React.ReactNode = null

  // Orchestrator sub-types
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

  // Agent sub-label
  if (msg.role === 'agent') {
    effectiveLabel = msg.agentId.toUpperCase()
    if (msg.eventType === 'spawn') {
      effectiveBorder = theme.pur
      icon = <Bot size={10} style={{ color: theme.pur }} />
    } else if (msg.eventType === 'done') {
      effectiveBorder = theme.grn
      icon = <CheckCircle2 size={10} style={{ color: theme.grn }} />
    } else if (msg.eventType === 'error') {
      effectiveBorder = theme.red
      icon = <XCircle size={10} style={{ color: theme.red }} />
    }
  }

  // Mission
  if (msg.role === 'mission') {
    effectiveLabel = msg.success ? 'MISSION COMPLETE' : 'MISSION FINISHED'
    effectiveBorder = msg.success ? theme.grn : theme.amb
    icon = msg.success
      ? <CheckCircle2 size={10} style={{ color: theme.grn }} />
      : <AlertTriangle size={10} style={{ color: theme.amb }} />
  }

  // Merge
  if (msg.role === 'merge') {
    icon = <GitMerge size={10} style={{ color: theme.grn }} />
    if (msg.conflicts.length > 0) {
      effectiveBorder = theme.amb
    }
  }

  // Deps
  if (msg.role === 'deps') {
    icon = <Package size={10} style={{ color: theme.blu }} />
  }

  // Run
  if (msg.role === 'run') {
    effectiveBorder = msg.exitCode === 0 ? theme.grn : theme.red
    icon = <Terminal size={10} style={{ color: effectiveBorder }} />
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
      {/* Header */}
      <div
        style={{
          fontSize: 8, fontWeight: 600, letterSpacing: 2,
          color: effectiveBorder, marginBottom: 4,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span className="flex items-center gap-1">
          {icon}
          {effectiveLabel}
        </span>
        <span style={{ color: theme.t3, fontWeight: 400, letterSpacing: 0, fontSize: 8 }}>{msg.ts}</span>
      </div>

      {/* Content by role */}
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
          <span className="flex items-center gap-1" style={{ color: msg.status === 'pass' ? theme.grn : theme.red, fontSize: 10.5 }}>
            {msg.status === 'pass' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
            {msg.agent.toUpperCase()} — Gate L{msg.level}: {msg.status.toUpperCase()}
          </span>
          <div style={{ fontSize: 9.5, color: theme.t2, marginTop: 2 }}>{msg.detail}</div>
        </div>
      ) : msg.role === 'mission' ? (
        <div>
          <div className="flex items-center gap-1" style={{ fontSize: 11, color: msg.success ? theme.grn : theme.amb, fontWeight: 600, marginBottom: 4 }}>
            {msg.success ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
            {msg.completed}/{msg.total} agents completed
          </div>
          <div style={{ fontSize: 10.5, color: theme.t2, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {msg.text}
          </div>
        </div>
      ) : msg.role === 'merge' ? (
        <div>
          <div style={{ fontSize: 10.5, color: theme.t2, lineHeight: 1.6, marginBottom: 6 }}>
            {msg.text}
          </div>
          {msg.merged.length > 0 && (
            <div style={{ marginBottom: 4 }}>
              {msg.merged.map((b) => (
                <div key={b} className="flex items-center gap-1" style={{ fontSize: 9, color: theme.grn, padding: '2px 0' }}>
                  <GitBranch size={9} /> {b}
                </div>
              ))}
            </div>
          )}
          {msg.conflicts.length > 0 && (
            <div style={{ borderLeft: `2px solid ${theme.amb}`, padding: '4px 8px', marginTop: 4 }}>
              <div className="flex items-center gap-1" style={{ fontSize: 8, fontWeight: 600, letterSpacing: 1, color: theme.amb, marginBottom: 2 }}>
                <AlertTriangle size={9} /> CONFLICTS
              </div>
              {msg.conflicts.map((b) => (
                <div key={b} style={{ fontSize: 9, color: theme.amb, padding: '1px 0' }}>{b}</div>
              ))}
            </div>
          )}
        </div>
      ) : msg.role === 'deps' ? (
        <div style={{ fontSize: 10.5, color: theme.t2, lineHeight: 1.6 }}>
          {msg.text}
        </div>
      ) : msg.role === 'run' ? (
        <div>
          <div className="flex items-center gap-1" style={{ fontSize: 10, color: theme.t2, marginBottom: 4 }}>
            <Terminal size={10} style={{ color: theme.t3 }} />
            <code style={{ background: theme.bg3, padding: '1px 6px', borderRadius: 2, fontSize: 9.5, color: theme.cyn }}>
              {msg.command}
            </code>
            <span style={{ marginLeft: 'auto', fontSize: 8, color: msg.exitCode === 0 ? theme.grn : theme.red, fontWeight: 600 }}>
              {msg.exitCode === 0 ? 'PASS' : msg.exitCode === -1 ? 'TIMEOUT' : `EXIT ${msg.exitCode}`}
            </span>
          </div>
          {msg.output.trim() && (
            <CodeBlock code={msg.output.trim()} theme={theme} />
          )}
        </div>
      ) : (
        <div style={{ fontSize: 10.5, color: msg.role === 'dev' ? theme.t : theme.t2, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {'text' in msg ? renderMarkdownish(msg.text, theme) : ''}
        </div>
      )}
    </div>
  )
}

export function ThinkingBlock({ label }: { label?: string }) {
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
        className="flex items-center gap-1.5"
        style={{
          fontSize: 10.5,
          color: theme.t2,
          animation: 'thinking-pulse 1.5s ease-in-out infinite',
        }}
      >
        <span style={{
          display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
          background: theme.blu, animation: 'thinking-pulse 1.5s ease-in-out infinite',
        }} />
        {label || 'Thinking...'}
      </div>
    </div>
  )
}
