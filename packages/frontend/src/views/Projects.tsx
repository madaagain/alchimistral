import { useState } from 'react'
import {
  Plus,
  GitBranch,
  FolderOpen,
  Zap,
  Bot,
  Clock,
  Terminal,
} from 'lucide-react'
import { T } from '../styles/tokens'
import { PROJECTS, type Project } from '../styles/data'

interface ProjectsProps {
  onSelect: (project: Project) => void
}

export default function Projects({ onSelect }: ProjectsProps) {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ fontFamily: T.sans }}>
      <div
        className="flex-1 overflow-y-auto"
        style={{ maxWidth: 700, margin: '0 auto', width: '100%', padding: '40px 24px' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center" style={{ marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: T.t }}>Projects</div>
            <div style={{ fontSize: 12, color: T.t3, marginTop: 4 }}>
              Each project links to a repo. Agents work inside.
            </div>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5"
            style={{
              padding: '8px 16px',
              background: T.t,
              color: T.bg,
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: T.sans,
            }}
          >
            <Plus size={14} /> New Project
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div
            style={{
              padding: 20,
              background: T.bg1,
              border: `1px solid ${T.bdr}`,
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: T.t, marginBottom: 16 }}>
              Create Project
            </div>
            <div className="flex gap-2" style={{ marginBottom: 14 }}>
              {[
                { label: 'Clone repo', Icon: GitBranch, active: true },
                { label: 'Local dir', Icon: FolderOpen, active: false },
                { label: 'Init new', Icon: Plus, active: false },
              ].map((o) => (
                <button
                  key={o.label}
                  className="flex-1 flex items-center justify-center gap-1.5"
                  style={{
                    padding: 10,
                    background: o.active ? T.bg3 : T.bg2,
                    border: `1px solid ${o.active ? 'rgba(255,255,255,.15)' : T.bdr}`,
                    borderRadius: 6,
                    color: o.active ? T.t : T.t3,
                    fontSize: 11,
                    cursor: 'pointer',
                    fontFamily: T.sans,
                  }}
                >
                  <o.Icon size={13} /> {o.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2.5">
              <input
                placeholder="Project name"
                style={{
                  padding: '9px 12px',
                  background: T.bg,
                  border: `1px solid ${T.bdr}`,
                  borderRadius: 5,
                  color: T.t,
                  fontFamily: T.sans,
                  fontSize: 12,
                  outline: 'none',
                }}
              />
              <input
                placeholder="https://github.com/user/repo.git"
                style={{
                  padding: '9px 12px',
                  background: T.bg,
                  border: `1px solid ${T.bdr}`,
                  borderRadius: 5,
                  color: T.t,
                  fontFamily: T.mono,
                  fontSize: 11,
                  outline: 'none',
                }}
              />
              <div className="flex gap-2 items-center">
                <span
                  className="flex items-center gap-1 font-mono"
                  style={{ fontSize: 10, color: T.t3 }}
                >
                  <Terminal size={11} /> CLI:
                </span>
                {['Vibe CLI', 'Claude Code', 'Codex'].map((a, i) => (
                  <span
                    key={a}
                    className="font-mono"
                    style={{
                      padding: '3px 8px',
                      borderRadius: 3,
                      background: i === 0 ? T.blu + '20' : T.bg2,
                      border: `1px solid ${i === 0 ? T.blu + '44' : T.bdr}`,
                      color: i === 0 ? T.blu : T.t3,
                      fontSize: 9,
                      opacity: i === 0 ? 1 : 0.4,
                    }}
                  >
                    {a}{i > 0 && ' (soon)'}
                  </span>
                ))}
              </div>
              <button
                className="flex items-center justify-center gap-1.5"
                style={{
                  padding: 10,
                  background: T.t,
                  color: T.bg,
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: T.sans,
                }}
              >
                <GitBranch size={14} /> Clone & Create
              </button>
            </div>
          </div>
        )}

        {/* Project list */}
        {PROJECTS.map((p) => (
          <div
            key={p.id}
            onClick={() => onSelect(p)}
            className="flex items-center gap-3.5 cursor-pointer"
            style={{
              padding: '16px 18px',
              background: T.bg1,
              border: `1px solid ${T.bdr}`,
              borderRadius: 8,
              marginBottom: 10,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = 'rgba(255,255,255,.2)')
            }
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.bdr)}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: p.status === 'active' ? T.blu + '15' : T.bg2,
                border: `1px solid ${p.status === 'active' ? T.blu + '33' : T.bdr}`,
              }}
            >
              {p.status === 'active' ? (
                <Zap size={16} style={{ color: T.blu }} />
              ) : (
                <FolderOpen size={16} style={{ color: T.t3 }} />
              )}
            </div>
            <div className="flex-1">
              <div style={{ fontSize: 14, fontWeight: 600, color: T.t, marginBottom: 2 }}>
                {p.name}
              </div>
              <div className="font-mono" style={{ fontSize: 10, color: T.t3 }}>
                {p.repo}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex gap-2 font-mono" style={{ fontSize: 9 }}>
                <span
                  className="flex items-center gap-1"
                  style={{ color: p.active > 0 ? T.blu : T.t3 }}
                >
                  <Bot size={10} /> {p.agents}
                </span>
                <span className="flex items-center gap-1" style={{ color: T.t3 }}>
                  <GitBranch size={10} /> {p.branches}
                </span>
              </div>
              <span
                className="flex items-center gap-1 font-mono"
                style={{ fontSize: 8.5, color: T.t3 }}
              >
                <Clock size={9} /> {p.lastActivity}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
