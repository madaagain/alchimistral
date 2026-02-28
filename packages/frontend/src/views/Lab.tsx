import { useState, useRef, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  Hexagon,
  Bot,
  Layers,
  GitBranch,
  Terminal,
  Shield,
  ShieldCheck,
  Scan,
  GitMerge,
  Plus,
  Minus as MinusIcon,
  Maximize2,
  X,
  FolderOpen,
  CheckCircle2,
  Loader2,
  Eye,
  Ban,
  Circle,
} from 'lucide-react'
import { T, STATUS_COLORS } from '../styles/tokens'
import Tag from '../components/Tag'
import Dot from '../components/Dot'
import { NODES as INITIAL_NODES, EDGES, WORKTREES, type AgentNode } from '../styles/data'

const NODE_WIDTH = 240

function StatusIcon({ status, size = 10 }: { status: string; size?: number }) {
  const color = STATUS_COLORS[status] || T.t3
  switch (status) {
    case 'done': return <CheckCircle2 size={size} style={{ color }} />
    case 'active': return <Loader2 size={size} style={{ color }} />
    case 'review': return <Eye size={size} style={{ color }} />
    case 'blocked': return <Ban size={size} style={{ color }} />
    default: return <Circle size={size} style={{ color }} />
  }
}

function SkillBadge({ name }: { name: string }) {
  return (
    <span
      className="font-mono"
      style={{
        fontSize: 7,
        fontWeight: 500,
        color: T.cyn,
        background: T.cyn + '12',
        border: `1px solid ${T.cyn}22`,
        padding: '1px 4px',
        borderRadius: 2,
      }}
    >
      {name}
    </span>
  )
}

function ValidationBadge({ v }: { v: AgentNode['validation'] }) {
  if (!v) return null
  const c = v.status === 'pass' ? T.grn : v.status === 'running' ? T.amb : T.t3
  return (
    <div className="flex items-center gap-0.5 font-mono" style={{ fontSize: 7, color: c }}>
      {v.status === 'pass' ? (
        <CheckCircle2 size={9} style={{ color: c }} />
      ) : (
        <Loader2 size={9} style={{ color: c }} />
      )}
      L{v.level} <span style={{ color: T.t3 }}>{v.status.toUpperCase()}</span>
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-mono uppercase"
      style={{
        fontSize: 8,
        fontWeight: 600,
        letterSpacing: 2,
        color: T.t3,
        marginBottom: 8,
        marginTop: 16,
      }}
    >
      {children}
    </div>
  )
}

// Canvas Node
function CanvasNode({
  node,
  selected,
  onClick,
  onDrag,
  zoom,
}: {
  node: AgentNode
  selected: boolean
  onClick: (id: string) => void
  onDrag: (id: string, x: number, y: number) => void
  zoom: number
}) {
  const sc = STATUS_COLORS[node.status] || T.t3
  const dragging = useRef(false)
  const startPos = useRef({ mx: 0, my: 0, nx: 0, ny: 0 })

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      dragging.current = true
      startPos.current = { mx: e.clientX, my: e.clientY, nx: node.x, ny: node.y }

      const handleMove = (ev: MouseEvent) => {
        if (!dragging.current) return
        onDrag(
          node.id,
          startPos.current.nx + (ev.clientX - startPos.current.mx) / zoom,
          startPos.current.ny + (ev.clientY - startPos.current.my) / zoom,
        )
      }

      const handleUp = () => {
        dragging.current = false
        window.removeEventListener('mousemove', handleMove)
        window.removeEventListener('mouseup', handleUp)
        onClick(node.id)
      }

      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleUp)
    },
    [node.id, node.x, node.y, zoom, onDrag, onClick],
  )

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: node.x,
        top: node.y,
        width: NODE_WIDTH,
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      {node.type === 'orch' && (
        <div
          className="flex items-center justify-center gap-1 font-mono"
          style={{
            textAlign: 'center',
            fontSize: 7,
            letterSpacing: 3,
            color: T.t3,
            marginBottom: 4,
          }}
        >
          <Hexagon size={10} style={{ color: T.t3 }} /> ORCHESTRATOR
        </div>
      )}
      <div
        style={{
          background: selected ? T.bg2 : T.bg1,
          border: `1px solid ${selected ? 'rgba(255,255,255,.2)' : T.bdr}`,
          borderRadius: 6,
          overflow: 'hidden',
          boxShadow: selected
            ? '0 0 0 1px rgba(255,255,255,.1),0 8px 24px rgba(0,0,0,.7)'
            : '0 2px 8px rgba(0,0,0,.4)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-1.5"
          style={{ padding: '7px 10px', borderBottom: `1px solid ${T.bdr}` }}
        >
          <Dot color={sc} pulse={node.status === 'active' || node.status === 'blocked'} />
          <span className="flex-1" style={{ fontSize: 11, fontWeight: 600, color: T.t, fontFamily: T.sans }}>
            {node.label}
          </span>
          <Tag color={sc}>{node.status.toUpperCase()}</Tag>
        </div>

        {/* Body */}
        <div style={{ padding: '7px 10px' }}>
          <div className="font-mono" style={{ fontSize: 8, color: T.t3, marginBottom: 5 }}>
            {node.sub}
          </div>

          {node.skills.length > 0 && (
            <div className="flex gap-0.5 flex-wrap" style={{ marginBottom: 5 }}>
              {node.skills.map((s) => <SkillBadge key={s} name={s} />)}
            </div>
          )}

          <div
            style={{
              fontSize: 9,
              color: T.t2,
              lineHeight: 1.5,
              marginBottom: 5,
              minHeight: 20,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {node.task}
          </div>

          {node.progress !== null && node.progress > 0 && (
            <div style={{ height: 1.5, background: T.bg3, borderRadius: 1, overflow: 'hidden', marginBottom: 4 }}>
              <div
                style={{
                  height: '100%',
                  width: `${node.progress}%`,
                  background: sc,
                  transition: 'width .8s ease',
                }}
              />
            </div>
          )}

          <div
            className="flex justify-between items-center font-mono"
            style={{ fontSize: 7.5, color: T.t3 }}
          >
            <span>{node.tokens} tok</span>
            <ValidationBadge v={node.validation} />
            {node.worktree && (
              <span className="flex items-center gap-0.5" style={{ color: T.t4, fontSize: 7 }}>
                <GitBranch size={8} style={{ color: T.t4 }} /> wt
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EdgesLayer({ nodes, edges }: { nodes: AgentNode[]; edges: typeof EDGES }) {
  const nodeMap: Record<string, AgentNode> = {}
  nodes.forEach((n) => (nodeMap[n.id] = n))

  return (
    <svg className="absolute inset-0 overflow-visible pointer-events-none">
      {edges.map((e, i) => {
        const f = nodeMap[e.from]
        const t = nodeMap[e.to]
        if (!f || !t) return null
        const fx = f.x + NODE_WIDTH / 2
        const fy = f.y + 140
        const tx = t.x + NODE_WIDTH / 2
        const ty = t.y
        const cy = (fy + ty) / 2
        return (
          <path
            key={i}
            d={`M${fx},${fy} C${fx},${cy} ${tx},${cy} ${tx},${ty}`}
            fill="none"
            stroke="rgba(255,255,255,.06)"
            strokeWidth={1}
            strokeDasharray="3 5"
          />
        )
      })}
    </svg>
  )
}

interface LabProps {
  projectId: string
  onRoom: () => void
}

export default function Lab({ onRoom }: LabProps) {
  const [nodes, setNodes] = useState(INITIAL_NODES)
  const [selected, setSelected] = useState<string | null>(null)
  const [viewport, setViewport] = useState({ x: -20, y: -20, z: 0.85 })
  const [panning, setPanning] = useState(false)
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 })
  const [inspectorTab, setInspectorTab] = useState('info')
  const canvasRef = useRef<HTMLDivElement>(null)

  // Simulate progress
  useEffect(() => {
    const iv = setInterval(() => {
      setNodes((prev) =>
        prev.map((n) =>
          n.status === 'active' && n.progress !== null
            ? { ...n, progress: Math.min(n.progress + Math.random() * 1.2, 97) }
            : n,
        ),
      )
    }, 1100)
    return () => clearInterval(iv)
  }, [])

  // Wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    setViewport((v) => ({
      ...v,
      z: Math.max(0.2, Math.min(2.5, v.z * (e.deltaY > 0 ? 0.92 : 1.08))),
    }))
  }, [])

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const selectedNode = nodes.find((n) => n.id === selected)

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden"
        style={{
          cursor: panning ? 'grabbing' : 'grab',
          backgroundImage: 'radial-gradient(circle,rgba(255,255,255,.025) 1px,transparent 1px)',
          backgroundSize: '24px 24px',
        }}
        onMouseDown={(e) => {
          if (e.target === canvasRef.current || (e.target as HTMLElement).closest('[data-bg]')) {
            setPanning(true)
            setLastMouse({ x: e.clientX, y: e.clientY })
            setSelected(null)
          }
        }}
        onMouseMove={(e) => {
          if (!panning) return
          setViewport((v) => ({
            ...v,
            x: v.x + (e.clientX - lastMouse.x) / v.z,
            y: v.y + (e.clientY - lastMouse.y) / v.z,
          }))
          setLastMouse({ x: e.clientX, y: e.clientY })
        }}
        onMouseUp={() => setPanning(false)}
        onMouseLeave={() => setPanning(false)}
      >
        <div
          data-bg="1"
          className="absolute inset-0"
          style={{
            transform: `scale(${viewport.z}) translate(${viewport.x}px,${viewport.y}px)`,
            transformOrigin: '0 0',
          }}
        >
          <EdgesLayer nodes={nodes} edges={EDGES} />
          {nodes.map((n) => (
            <CanvasNode
              key={n.id}
              node={n}
              selected={selected === n.id}
              onClick={(id) => setSelected(id)}
              onDrag={(id, x, y) =>
                setNodes((prev) => prev.map((nd) => (nd.id === id ? { ...nd, x, y } : nd)))
              }
              zoom={viewport.z}
            />
          ))}
        </div>

        {/* Minimap */}
        <div
          className="absolute"
          style={{
            bottom: 16,
            right: 16,
            width: 140,
            height: 70,
            background: 'rgba(10,10,10,.95)',
            border: `1px solid ${T.bdr}`,
            borderRadius: 4,
            overflow: 'hidden',
            zIndex: 40,
          }}
        >
          <div
            className="absolute font-mono"
            style={{ top: 3, left: 5, fontSize: 6, letterSpacing: 2, color: T.t3 }}
          >
            MAP
          </div>
          {nodes.map((n) => (
            <div
              key={n.id}
              className="absolute"
              style={{
                left: n.x * 0.08 + 4,
                top: n.y * 0.08 + 12,
                width: NODE_WIDTH * 0.08,
                height: 4,
                background: STATUS_COLORS[n.status] || T.bg3,
                borderRadius: 1,
                opacity: 0.6,
              }}
            />
          ))}
        </div>

        {/* Zoom controls */}
        <div className="absolute flex gap-1" style={{ bottom: 16, left: 16, zIndex: 40 }}>
          {[
            { Icon: MinusIcon, fn: () => setViewport((v) => ({ ...v, z: Math.max(0.2, v.z * 0.8) })) },
            { Icon: Maximize2, fn: () => setViewport({ x: -20, y: -20, z: 0.85 }) },
            { Icon: Plus, fn: () => setViewport((v) => ({ ...v, z: Math.min(2.5, v.z * 1.2) })) },
          ].map((b, i) => (
            <button
              key={i}
              onClick={b.fn}
              className="flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                background: T.bg1,
                border: `1px solid ${T.bdr}`,
                borderRadius: 5,
                cursor: 'pointer',
              }}
            >
              <b.Icon size={13} style={{ color: T.t2 }} />
            </button>
          ))}
          <div
            className="flex items-center font-mono"
            style={{
              padding: '0 8px',
              height: 28,
              background: T.bg1,
              border: `1px solid ${T.bdr}`,
              borderRadius: 5,
              fontSize: 9,
              color: T.t3,
            }}
          >
            {Math.round(viewport.z * 100)}%
          </div>
        </div>
      </div>

      {/* Inspector */}
      <div
        className="flex flex-col flex-shrink-0"
        style={{
          width: 290,
          background: T.bg1,
          borderLeft: `1px solid ${T.bdr}`,
          fontFamily: T.sans,
        }}
      >
        {/* Inspector header */}
        <div
          className="flex items-center justify-between flex-shrink-0"
          style={{ padding: '8px 14px', borderBottom: `1px solid ${T.bdr}` }}
        >
          <button
            onClick={onRoom}
            className="flex items-center gap-1 font-mono"
            style={{
              background: 'transparent',
              border: 'none',
              color: T.t3,
              cursor: 'pointer',
              fontSize: 10,
              padding: 0,
            }}
          >
            <ArrowLeft size={12} style={{ color: T.t3 }} /> Room
          </button>
          <span className="font-mono" style={{ fontSize: 8, color: T.t3, letterSpacing: 1 }}>
            INSPECTOR
          </span>
        </div>

        {selectedNode ? (
          <>
            {/* Inspector tabs */}
            <div className="flex flex-shrink-0" style={{ borderBottom: `1px solid ${T.bdr}` }}>
              {[
                { id: 'info', Icon: Bot },
                { id: 'skills', Icon: Layers },
                { id: 'git', Icon: GitBranch },
                { id: 'stream', Icon: Terminal },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setInspectorTab(tab.id)}
                  className="flex-1 flex items-center justify-center gap-1 font-mono uppercase"
                  style={{
                    padding: '8px 0',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: inspectorTab === tab.id ? `1.5px solid ${T.t}` : '1.5px solid transparent',
                    color: inspectorTab === tab.id ? T.t : T.t3,
                    cursor: 'pointer',
                    fontSize: 8,
                  }}
                >
                  <tab.Icon size={10} /> {tab.id}
                </button>
              ))}
            </div>

            {/* Inspector content */}
            <div className="flex-1 overflow-y-auto" style={{ padding: '12px 14px' }}>
              {inspectorTab === 'info' && (
                <>
                  <div
                    className="flex items-center gap-1 font-mono uppercase"
                    style={{
                      fontSize: 8.5,
                      fontWeight: 600,
                      letterSpacing: 2,
                      color: STATUS_COLORS[selectedNode.status],
                      marginBottom: 10,
                    }}
                  >
                    <StatusIcon status={selectedNode.status} size={11} />
                    {selectedNode.type === 'orch' ? 'ORCHESTRATOR'
                      : selectedNode.type === 'parent' ? 'PARENT AGENT'
                        : selectedNode.type === 'sec' ? 'SECURITY' : 'CHILD'}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.t, marginBottom: 3 }}>
                    {selectedNode.label}
                  </div>
                  <div className="font-mono" style={{ fontSize: 9, color: T.t3, marginBottom: 12 }}>
                    {selectedNode.sub}
                  </div>
                  <div
                    style={{
                      padding: '9px 10px',
                      background: T.bg,
                      border: `1px solid ${T.bdr}`,
                      borderRadius: 4,
                      fontSize: 10.5,
                      color: T.t2,
                      lineHeight: 1.6,
                      marginBottom: 12,
                    }}
                  >
                    {selectedNode.task}
                  </div>

                  {[
                    { k: 'Status', v: selectedNode.status.toUpperCase(), c: STATUS_COLORS[selectedNode.status] },
                    { k: 'Tokens', v: selectedNode.tokens },
                    { k: 'Branch', v: selectedNode.branch || '\u2014' },
                    { k: 'Worktree', v: selectedNode.worktree || '\u2014' },
                    { k: 'Children', v: String(selectedNode.children.length) },
                  ].map(({ k, v, c }) => (
                    <div
                      key={k}
                      className="flex justify-between font-mono"
                      style={{
                        padding: '6px 0',
                        borderBottom: `1px solid ${T.bdr}`,
                        fontSize: 10,
                      }}
                    >
                      <span style={{ color: T.t3 }}>{k}</span>
                      <span
                        style={{
                          color: c || T.t,
                          fontWeight: 500,
                          fontSize: 9,
                          maxWidth: 155,
                          textAlign: 'right',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}

                  {selectedNode.validation && (
                    <>
                      <SectionHeader>Validation Gate</SectionHeader>
                      <div
                        style={{
                          padding: '8px 10px',
                          background: T.bg,
                          border: `1px solid ${selectedNode.validation.status === 'pass' ? T.grn + '33' : T.bdr}`,
                          borderRadius: 4,
                        }}
                      >
                        <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
                          <span className="flex items-center gap-1 font-mono" style={{ fontSize: 9, color: T.t2 }}>
                            <Shield size={10} style={{ color: T.t2 }} /> Level {selectedNode.validation.level}
                          </span>
                          <Tag
                            color={
                              selectedNode.validation.status === 'pass' ? T.grn
                                : selectedNode.validation.status === 'running' ? T.amb : T.t3
                            }
                          >
                            {selectedNode.validation.status.toUpperCase()}
                          </Tag>
                        </div>
                        <div className="font-mono" style={{ fontSize: 8.5, color: T.t3, lineHeight: 1.5 }}>
                          {selectedNode.validation.result}
                        </div>
                      </div>
                    </>
                  )}

                  {selectedNode.progress !== null && (
                    <div style={{ marginTop: 12 }}>
                      <div
                        className="flex justify-between font-mono"
                        style={{ fontSize: 8.5, color: T.t3, marginBottom: 4 }}
                      >
                        <span>PROGRESS</span>
                        <span>{Math.round(selectedNode.progress)}%</span>
                      </div>
                      <div style={{ height: 2, background: T.bg3, borderRadius: 1 }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${selectedNode.progress}%`,
                            background: STATUS_COLORS[selectedNode.status],
                            borderRadius: 1,
                            transition: 'width .8s ease',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {inspectorTab === 'skills' && (
                <>
                  <SectionHeader>Attached</SectionHeader>
                  {selectedNode.skills.length > 0 ? (
                    selectedNode.skills.map((s) => (
                      <div
                        key={s}
                        className="flex justify-between items-center"
                        style={{
                          padding: '8px 10px',
                          marginBottom: 4,
                          background: T.bg,
                          border: `1px solid ${T.cyn}15`,
                          borderRadius: 4,
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <SkillBadge name={s} />
                          <span style={{ fontSize: 9.5, color: T.t2 }}>context</span>
                        </div>
                        <button
                          className="flex"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                        >
                          <X size={12} style={{ color: T.t3 }} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="font-mono" style={{ fontSize: 10, color: T.t3 }}>None</div>
                  )}
                  <SectionHeader>Available</SectionHeader>
                  {['Stripe', 'Figma', 'Docker', 'Security'].map((s) => (
                    <div
                      key={s}
                      className="flex justify-between items-center"
                      style={{
                        padding: '6px 10px',
                        marginBottom: 4,
                        background: T.bg,
                        border: `1px solid ${T.bdr}`,
                        borderRadius: 4,
                      }}
                    >
                      <span className="font-mono" style={{ fontSize: 9.5, color: T.t3 }}>
                        {s}Skill
                      </span>
                      <button
                        className="flex items-center gap-1 font-mono"
                        style={{
                          padding: '2px 8px',
                          background: T.bg2,
                          border: `1px solid ${T.bdr}`,
                          borderRadius: 3,
                          color: T.t2,
                          cursor: 'pointer',
                          fontSize: 8,
                        }}
                      >
                        <Plus size={9} /> Add
                      </button>
                    </div>
                  ))}
                </>
              )}

              {inspectorTab === 'git' && (
                <>
                  <SectionHeader>Worktree</SectionHeader>
                  {selectedNode.worktree ? (
                    <div
                      className="font-mono"
                      style={{
                        padding: 10,
                        background: T.bg,
                        border: `1px solid ${T.bdr}`,
                        borderRadius: 4,
                        fontSize: 9,
                        color: T.t2,
                        lineHeight: 1.8,
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <FolderOpen size={10} style={{ color: T.t3 }} /> path: {selectedNode.worktree}
                      </div>
                      <div className="flex items-center gap-1">
                        <GitBranch size={10} style={{ color: T.blu }} /> branch:{' '}
                        <span style={{ color: T.blu }}>{selectedNode.branch}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 size={10} style={{ color: T.grn }} /> isolated
                      </div>
                    </div>
                  ) : (
                    <div className="font-mono" style={{ fontSize: 10, color: T.t3 }}>No worktree</div>
                  )}
                  <SectionHeader>All Worktrees</SectionHeader>
                  {WORKTREES.map((w, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 font-mono"
                      style={{
                        padding: '5px 8px',
                        marginBottom: 3,
                        background: w.agent === selectedNode.id ? T.bg2 : T.bg,
                        border: `1px solid ${w.agent === selectedNode.id ? 'rgba(255,255,255,.12)' : T.bdr}`,
                        borderRadius: 3,
                        fontSize: 8,
                      }}
                    >
                      <GitBranch
                        size={9}
                        style={{ color: w.status.includes('merged') ? T.grn : T.t3 }}
                      />
                      <div className="flex-1">
                        <div style={{ color: w.status.includes('merged') ? T.grn : T.t2 }}>
                          {w.branch}
                        </div>
                        <div style={{ color: T.t3, marginTop: 1 }}>{w.status}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {inspectorTab === 'stream' && (
                <>
                  <SectionHeader>Live Output</SectionHeader>
                  <div
                    className="font-mono"
                    style={{
                      padding: 10,
                      background: T.bg,
                      border: `1px solid ${T.bdr}`,
                      borderRadius: 4,
                      fontSize: 8.5,
                      color: T.t3,
                      lineHeight: 1.8,
                      minHeight: 200,
                    }}
                  >
                    <div style={{ color: T.grn }}>$ vibe --prompt "..." --auto-approve</div>
                    <div>Reading project structure...</div>
                    <div>Found .alchemistral/contracts/api-schema.json</div>
                    <div style={{ color: T.cyn }}>Creating src/components/AuthForm.tsx</div>
                    <div style={{ color: T.t2 }}>{'const { useState } = React'}</div>
                    <div style={{ color: T.t2 }}>{'const auth = useAuthStore()'}</div>
                    <div>...</div>
                    <div style={{ color: T.grn }}>$ npm run build</div>
                    <div style={{ color: T.grn }}>Build passed</div>
                    <div style={{ color: T.grn }}>$ npm test — 8/8</div>
                    <div className="flex items-center gap-1" style={{ color: T.amb, marginTop: 6 }}>
                      <ShieldCheck size={10} style={{ color: T.amb }} /> Self-test PASS
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Inspector actions */}
            <div
              className="flex flex-col gap-1.5 flex-shrink-0"
              style={{ padding: '10px 14px', borderTop: `1px solid ${T.bdr}` }}
            >
              <button
                className="flex items-center justify-center gap-1.5 w-full"
                style={{
                  padding: 8,
                  background: 'transparent',
                  border: `1px solid ${T.amb}33`,
                  borderRadius: 5,
                  color: T.amb,
                  fontSize: 10,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: T.sans,
                }}
              >
                <Scan size={13} style={{ color: T.amb }} /> Security Scan
              </button>
              {selectedNode.status === 'done' && (
                <button
                  className="flex items-center justify-center gap-1.5 w-full"
                  style={{
                    padding: 8,
                    background: T.grn + '15',
                    border: `1px solid ${T.grn}33`,
                    borderRadius: 5,
                    color: T.grn,
                    fontSize: 10,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: T.sans,
                  }}
                >
                  <GitMerge size={13} style={{ color: T.grn }} /> Approve & Merge
                </button>
              )}
              {selectedNode.type === 'parent' && (
                <button
                  className="flex items-center justify-center gap-1.5 w-full"
                  style={{
                    padding: 8,
                    background: 'transparent',
                    border: `1px solid ${T.bdr}`,
                    borderRadius: 5,
                    color: T.t2,
                    fontSize: 10,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: T.sans,
                  }}
                >
                  <Bot size={13} style={{ color: T.t2 }} /> Spawn Child
                </button>
              )}
            </div>
          </>
        ) : (
          /* No selection */
          <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: 20 }}>
            <Scan size={24} style={{ color: T.t3 }} />
            <div className="font-mono text-center" style={{ fontSize: 11, color: T.t3, marginTop: 8, marginBottom: 20 }}>
              Select a node
            </div>
            <div className="w-full" style={{ border: `1px solid ${T.bdr}`, borderRadius: 5, overflow: 'hidden' }}>
              {[
                { k: 'Agents', v: nodes.length, Icon: Bot },
                { k: 'Active', v: nodes.filter((n) => n.status === 'active').length, c: T.blu, Icon: Loader2 },
                { k: 'Review', v: nodes.filter((n) => n.status === 'review').length, c: T.amb, Icon: Eye },
                { k: 'Done', v: nodes.filter((n) => n.status === 'done').length, c: T.grn, Icon: CheckCircle2 },
                { k: 'Blocked', v: nodes.filter((n) => n.status === 'blocked').length, c: T.red, Icon: Ban },
                { k: 'Worktrees', v: WORKTREES.length, c: T.pur, Icon: GitBranch },
              ].map(({ k, v, c, Icon }, i) => (
                <div
                  key={k}
                  className="flex justify-between items-center font-mono"
                  style={{
                    padding: '8px 12px',
                    borderBottom: i < 5 ? `1px solid ${T.bdr}` : 'none',
                    fontSize: 10,
                  }}
                >
                  <span className="flex items-center gap-1.5" style={{ color: T.t3 }}>
                    <Icon size={11} style={{ color: c || T.t3 }} /> {k}
                  </span>
                  <span style={{ color: c || T.t, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
