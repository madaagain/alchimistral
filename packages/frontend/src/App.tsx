import { useState } from 'react'
import {
  Hexagon,
  FolderOpen,
  Terminal,
  Bot,
  Loader2,
  GitBranch,
  Play,
  User,
} from 'lucide-react'
import { T } from './styles/tokens'
import { NODES, WORKTREES } from './styles/data'
import { useWebSocket } from './hooks/useWebSocket'
import Dot from './components/Dot'
import Projects from './views/Projects'
import Room from './views/Room'
import Lab from './views/Lab'
import type { Project } from './styles/data'

type View = 'projects' | 'room' | 'lab'

export default function App() {
  const [view, setView] = useState<View>('projects')
  const [project, setProject] = useState<Project | null>(null)
  const { connected, messages } = useWebSocket('ws://localhost:8000/ws')

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: T.bg, color: T.t, fontFamily: T.sans }}
    >
      {/* Top Bar */}
      <div
        className="flex items-center flex-shrink-0"
        style={{
          height: 42,
          padding: '0 16px',
          borderBottom: `1px solid ${T.bdr}`,
          background: T.bg,
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-1.5 cursor-pointer"
          style={{ marginRight: 16 }}
          onClick={() => { setView('projects'); setProject(null) }}
        >
          <Hexagon size={16} strokeWidth={1.5} style={{ color: T.t }} />
          <span
            className="font-mono"
            style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2.5, color: T.t }}
          >
            ALCHEMISTRAL
          </span>
        </div>

        <div style={{ width: 1, height: 16, background: T.bdr, marginRight: 12 }} />

        {project ? (
          <>
            {(['room', 'lab'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setView(tab)}
                style={{
                  padding: '0 12px',
                  height: 42,
                  background: 'transparent',
                  border: 'none',
                  borderBottom: view === tab ? `1.5px solid ${T.t}` : '1.5px solid transparent',
                  color: view === tab ? T.t : T.t3,
                  fontSize: 11,
                  fontWeight: view === tab ? 600 : 400,
                  cursor: 'pointer',
                  fontFamily: T.sans,
                  textTransform: 'capitalize',
                }}
              >
                {tab === 'room' ? 'Room' : 'Lab'}
              </button>
            ))}

            <div style={{ width: 1, height: 16, background: T.bdr, margin: '0 12px' }} />

            <div className="flex items-center gap-1 font-mono" style={{ fontSize: 10, color: T.t2 }}>
              <FolderOpen size={11} style={{ color: T.t3 }} /> {project.name}
            </div>
            <span
              className="flex items-center gap-1 font-mono"
              style={{
                fontSize: 8,
                color: T.t3,
                marginLeft: 8,
                padding: '1px 5px',
                border: `1px solid ${T.bdr}`,
                borderRadius: 2,
              }}
            >
              <Terminal size={8} style={{ color: T.t3 }} /> Vibe CLI
            </span>
          </>
        ) : (
          <span className="font-mono" style={{ fontSize: 10, color: T.t3 }}>
            SELECT A PROJECT
          </span>
        )}

        <div className="ml-auto flex items-center gap-2.5">
          {project && (
            <>
              {[
                { label: `${NODES.length} agents`, Icon: Bot },
                { label: `${NODES.filter((n) => n.status === 'active').length} active`, c: T.blu, Icon: Loader2 },
                { label: `${WORKTREES.length} worktrees`, c: T.pur, Icon: GitBranch },
              ].map((s) => (
                <span
                  key={s.label}
                  className="flex items-center gap-1 font-mono"
                  style={{ fontSize: 9, color: s.c || T.t3 }}
                >
                  <s.Icon size={10} style={{ color: s.c || T.t3 }} /> {s.label}
                </span>
              ))}
              <div style={{ width: 1, height: 16, background: T.bdr }} />
            </>
          )}

          {/* Connection status */}
          <div className="flex items-center gap-1.5">
            <Dot color={connected ? T.grn : T.red} pulse={connected} size={5} />
            <span className="font-mono" style={{ fontSize: 8, color: T.t3 }}>
              {connected ? 'CONNECTED' : 'OFFLINE'}
            </span>
          </div>

          <div
            className="flex items-center gap-1 font-mono"
            style={{
              padding: '3px 8px',
              borderRadius: 3,
              fontSize: 8,
              fontWeight: 600,
              letterSpacing: 0.8,
              background: T.grn + '15',
              border: `1px solid ${T.grn}33`,
              color: T.grn,
            }}
          >
            <Play size={8} style={{ color: T.grn }} /> DEMO
          </div>

          <div
            className="flex items-center justify-center"
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: T.bg2,
              border: `1px solid ${T.bdr}`,
            }}
          >
            <User size={12} style={{ color: T.t3 }} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {!project || view === 'projects' ? (
          <Projects
            onSelect={(p) => {
              setProject(p)
              setView('room')
            }}
          />
        ) : view === 'room' ? (
          <Room onLab={() => setView('lab')} wsMessages={messages} />
        ) : (
          <Lab onRoom={() => setView('room')} />
        )}
      </div>
    </div>
  )
}
