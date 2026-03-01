import { useTheme, STATUS_COLORS } from '../hooks/useTheme'
import Dot from './Dot'
import type { AgentInfo } from '../api/agents'

interface AgentBarProps {
  agents: AgentInfo[]
  selectedAgent?: string | null
  onSelectAgent?: (id: string) => void
}

export default function AgentBar({ agents, selectedAgent, onSelectAgent }: AgentBarProps) {
  const { theme } = useTheme()

  if (agents.length === 0) {
    return (
      <div
        style={{
          height: 36,
          borderTop: `1px solid ${theme.bdr}`,
          background: theme.bg1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: theme.mono,
          fontSize: 9,
          color: theme.t3,
          letterSpacing: 1,
          flexShrink: 0,
        }}
      >
        NO AGENTS
      </div>
    )
  }

  return (
    <div
      style={{
        height: 36,
        borderTop: `1px solid ${theme.bdr}`,
        background: theme.bg1,
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        overflowX: 'auto',
        flexShrink: 0,
      }}
    >
      {agents.map((a) => {
        const sc = STATUS_COLORS[a.status] || theme.t3
        const isSelected = selectedAgent === a.id
        return (
          <button
            key={a.id}
            onClick={() => onSelectAgent?.(a.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 14px',
              height: '100%',
              background: isSelected ? theme.bg2 : 'transparent',
              border: 'none',
              borderRight: `1px solid ${theme.bdr}`,
              cursor: 'pointer',
              fontFamily: theme.mono,
              fontSize: 9,
              color: isSelected ? theme.t : theme.t2,
              whiteSpace: 'nowrap',
              transition: 'background 150ms ease',
            }}
          >
            <Dot color={sc} pulse={a.status === 'active'} size={5} />
            <span style={{ fontWeight: 500 }}>{a.id}</span>
            <span style={{ color: theme.t3, fontSize: 8 }}>
              {a.status === 'done' ? 'done' : a.status === 'active' ? 'coding' : a.status}
            </span>
          </button>
        )
      })}
    </div>
  )
}
