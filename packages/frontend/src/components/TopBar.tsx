import { Hexagon, Zap } from 'lucide-react'
import { T } from '../styles/tokens'
import Dot from './Dot'

export type View = 'projects' | 'room' | 'lab'

interface TopBarProps {
  view: View
  onViewChange: (v: View) => void
  connected: boolean
  projectName?: string
}

export default function TopBar({ view, onViewChange, connected, projectName }: TopBarProps) {
  const tabs: { id: View; label: string }[] = [
    { id: 'projects', label: 'Projects' },
    { id: 'room', label: 'Room' },
    { id: 'lab', label: 'Lab' },
  ]

  return (
    <div
      className="flex items-center h-10 px-4 flex-shrink-0"
      style={{
        background: T.bg,
        borderBottom: `1px solid ${T.bdr}`,
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mr-6">
        <Hexagon size={14} strokeWidth={1.5} style={{ color: T.t3 }} />
        <span
          className="font-mono"
          style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: 3,
            color: T.t2,
          }}
        >
          ALCHEMISTRAL
        </span>
      </div>

      {/* Nav tabs */}
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className="px-3 py-1 rounded transition-colors"
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: view === tab.id ? T.t : T.t3,
              background: view === tab.id ? T.bg2 : 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: T.sans,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Project name */}
      {projectName && (
        <div className="flex items-center gap-2 mr-4">
          <Zap size={11} strokeWidth={1.5} style={{ color: T.blu }} />
          <span
            className="font-mono"
            style={{ fontSize: 9, color: T.t2 }}
          >
            {projectName}
          </span>
        </div>
      )}

      {/* Connection status */}
      <div className="flex items-center gap-2">
        <Dot color={connected ? T.grn : T.red} pulse={connected} size={5} />
        <span
          className="font-mono"
          style={{ fontSize: 8, color: T.t3 }}
        >
          {connected ? 'CONNECTED' : 'OFFLINE'}
        </span>
      </div>
    </div>
  )
}
