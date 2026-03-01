import { useState, useRef, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  Hexagon,
  Bot,
  Layers,
  GitBranch,
  Terminal,
  ShieldCheck,
  Shield,
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
import { useTheme, STATUS_COLORS } from '../hooks/useTheme'
import Tag from '../components/Tag'
import Dot from '../components/Dot'
import { type AgentNode } from '../styles/data'
import type { WsEvent } from '../hooks/useWebSocket'

const NODE_WIDTH = 240

function StatusIcon({ status, size = 10 }: { status: string; size?: number }) {
  const color = STATUS_COLORS[status] || '#444'
  switch (status) {
    case 'done': return <CheckCircle2 size={size} style={{ color }} />
    case 'active': return <Loader2 size={size} style={{ color }} />
    case 'review': return <Eye size={size} style={{ color }} />
    case 'blocked': return <Ban size={size} style={{ color }} />
    default: return <Circle size={size} style={{ color }} />
  }
}

function SkillBadge({ name }: { name: string }) {
  const { theme } = useTheme()
  return (
    <span
      className="font-mono"
      style={{
        fontSize: 7,
        fontWeight: 500,
        color: theme.cyn,
        background: theme.cyn + '12',
        border: `1px solid ${theme.cyn}22`,
        padding: '1px 4px',
        borderRadius: 2,
      }}
    >
      {name}
    </span>
  )
}

function ValidationBadge({ v }: { v: AgentNode['validation'] }) {
  const { theme } = useTheme()
  if (!v) return null
  const c = v.status === 'pass' ? theme.grn : v.status === 'running' ? theme.amb : theme.t3
  return (
    <div className="flex items-center gap-0.5 font-mono" style={{ fontSize: 7, color: c }}>
      {v.status === 'pass' ? (
        <CheckCircle2 size={9} style={{ color: c }} />
      ) : (
        <Loader2 size={9} style={{ color: c }} />
      )}
      L{v.level} <span style={{ color: theme.t3 }}>{v.status.toUpperCase()}</span>
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  return (
    <div
      className="font-mono uppercase"
      style={{
        fontSize: 8,
        fontWeight: 600,
        letterSpacing: 2,
        color: theme.t3,
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
  const { theme } = useTheme()
  const sc = STATUS_COLORS[node.status] || theme.t3
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
            color: theme.t3,
            marginBottom: 4,
          }}
        >
          <Hexagon size={10} style={{ color: theme.t3 }} /> ORCHESTRATOR
        </div>
      )}
      <div
        style={{
          background: selected ? theme.bg2 : theme.bg1,
          border: `1px solid ${selected ? theme.t3 : theme.bdr}`,
          borderRadius: 6,
          overflow: 'hidden',
          boxShadow: selected
            ? `0 0 0 1px ${theme.bdr},0 8px 24px rgba(0,0,0,.7)`
            : '0 2px 8px rgba(0,0,0,.4)',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-1.5"
          style={{ padding: '7px 10px', borderBottom: `1px solid ${theme.bdr}` }}
        >
          <Dot color={sc} pulse={node.status === 'active' || node.status === 'blocked'} />
          <span className="flex-1" style={{ fontSize: 11, fontWeight: 600, color: theme.t, fontFamily: theme.sans }}>
            {node.label}
          </span>
          <Tag color={sc}>{node.status.toUpperCase()}</Tag>
        </div>

        {/* Body */}
        <div style={{ padding: '7px 10px' }}>
          <div className="font-mono" style={{ fontSize: 8, color: theme.t3, marginBottom: 5 }}>
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
              color: theme.t2,
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
            <div style={{ height: 1.5, background: theme.bg3, borderRadius: 1, overflow: 'hidden', marginBottom: 4 }}>
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
            style={{ fontSize: 7.5, color: theme.t3 }}
          >
            <span>{node.tokens} tok</span>
            <ValidationBadge v={node.validation} />
            {node.worktree && (
              <span className="flex items-center gap-0.5" style={{ color: theme.t4, fontSize: 7 }}>
                <GitBranch size={8} style={{ color: theme.t4 }} /> wt
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EdgesLayer({ nodes, edges }: { nodes: AgentNode[]; edges: { from: string; to: string }[] }) {
  const { theme } = useTheme()
  const nodeMap: Record<string, AgentNode> = {}
  nodes.forEach((n) => (nodeMap[n.id] = n))

  return (
    <svg className="absolute inset-0 overflow-visible pointer-events-none">
      <defs>
        <marker
          id="arrowhead"
          markerWidth="6"
          markerHeight="4"
          refX="5"
          refY="2"
          orient="auto"
        >
          <polygon points="0 0, 6 2, 0 4" fill={theme.t3} opacity={0.3} />
        </marker>
      </defs>
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
            stroke={theme.t3}
            strokeWidth={1}
            strokeOpacity={0.2}
            markerEnd="url(#arrowhead)"
          />
        )
      })}
    </svg>
  )
}

function buildLiveEdges(nodes: AgentNode[]): { from: string; to: string }[] {
  const edges: { from: string; to: string }[] = []
  const orch = nodes.find((n) => n.type === 'orch')
  if (orch) {
    for (const n of nodes) {
      if (n.type === 'parent') edges.push({ from: orch.id, to: n.id })
    }
  }
  return edges
}

function mapStatus(status: string): string {
  switch (status) {
    case 'spawning': return 'active'
    case 'active': return 'active'
    case 'validating': return 'review'
    case 'done': return 'done'
    case 'failed': return 'blocked'
    default: return 'idle'
  }
}

function positionNodes(agents: AgentNode[]): AgentNode[] {
  const orch = agents.find((n) => n.type === 'orch')
  const parents = agents.filter((n) => n.type === 'parent')
  const totalWidth = parents.length * 280
  const startX = 420 - totalWidth / 2 + 140

  if (orch) {
    orch.x = 420
    orch.y = 100
  }
  parents.forEach((p, i) => {
    p.x = startX + i * 280
    p.y = 340
  })
  return agents
}

interface LabProps {
  projectId: string
  onRoom: () => void
  wsMessages?: WsEvent[]
}

export default function Lab({ projectId, onRoom, wsMessages = [] }: LabProps) {
  const { theme } = useTheme()
  const [liveNodes, setLiveNodes] = useState<AgentNode[]>([])
  const [liveStream, setLiveStream] = useState<Record<string, string[]>>({})
  const processedRef = useRef(0)

  // Process WS events to build live agent nodes
  useEffect(() => {
    const newMessages = wsMessages.slice(processedRef.current)
    if (newMessages.length === 0) return
    processedRef.current = wsMessages.length

    for (const msg of newMessages) {
      const agentId = msg.agent_id as string
      const type = msg.type as string

      if (type === 'spawn') {
        setLiveNodes((prev) => {
          if (prev.find((n) => n.id === agentId)) return prev
          let nodes = [...prev]
          if (!nodes.find((n) => n.type === 'orch')) {
            nodes.push({
              id: 'orch',
              type: 'orch',
              x: 420,
              y: 100,
              label: 'Orchestrator',
              sub: 'mistral-large · coordination',
              status: 'active',
              tokens: '—',
              progress: null,
              task: 'Coordinating agents',
              children: [],
              branch: null,
              skills: [],
              validation: null,
              worktree: null,
            })
          }
          const domain = (msg.domain as string) || 'backend'
          nodes.push({
            id: agentId,
            type: 'parent',
            x: 0,
            y: 0,
            label: (msg.label as string) || agentId,
            sub: `vibe cli · ${domain} · worktree`,
            status: 'active',
            tokens: '0',
            progress: 5,
            task: (msg.label as string) || 'Working...',
            children: [],
            branch: `agent/${agentId}`,
            skills: [],
            validation: null,
            worktree: `.worktrees/${agentId}/`,
          })
          const orchNode = nodes.find((n) => n.type === 'orch')
          if (orchNode && !orchNode.children.includes(agentId)) {
            orchNode.children = [...orchNode.children, agentId]
          }
          return positionNodes(nodes)
        })
      }

      if (type === 'status' && agentId !== 'orchestrator') {
        setLiveNodes((prev) =>
          prev.map((n) =>
            n.id === agentId
              ? {
                  ...n,
                  status: mapStatus((msg.status as string) || 'active'),
                  branch: (msg.branch as string) || n.branch,
                  worktree: (msg.worktree as string) || n.worktree,
                }
              : n,
          ),
        )
      }

      if ((type === 'output' || type === 'think' || type === 'code' || type === 'bash') && agentId !== 'orchestrator') {
        const text = (msg.text as string) || ''
        setLiveStream((prev) => ({
          ...prev,
          [agentId]: [...(prev[agentId] || []), text].slice(-50),
        }))
        setLiveNodes((prev) =>
          prev.map((n) =>
            n.id === agentId && n.progress !== null
              ? { ...n, progress: Math.min((n.progress || 0) + 2, 95), tokens: String(parseInt(n.tokens || '0') + text.length) }
              : n,
          ),
        )
      }

      if (type === 'done' && agentId !== 'orchestrator') {
        setLiveNodes((prev) =>
          prev.map((n) =>
            n.id === agentId
              ? { ...n, status: 'done', progress: 100, validation: { level: 1, status: 'pass', result: 'Self-test passed' } }
              : n,
          ),
        )
      }

      if (type === 'error' && agentId !== 'orchestrator') {
        setLiveNodes((prev) =>
          prev.map((n) =>
            n.id === agentId
              ? { ...n, status: 'blocked', task: (msg.text as string) || 'Error' }
              : n,
          ),
        )
      }
    }
  }, [wsMessages])

  // Reset when project changes
  useEffect(() => {
    setLiveNodes([])
    setLiveStream({})
    processedRef.current = 0
  }, [projectId])

  const nodes = liveNodes
  const edges = buildLiveEdges(liveNodes)
  const [selected, setSelected] = useState<string | null>(null)
  const [viewport, setViewport] = useState({ x: -20, y: -20, z: 0.85 })
  const [panning, setPanning] = useState(false)
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 })
  const [inspectorTab, setInspectorTab] = useState('info')
  const canvasRef = useRef<HTMLDivElement>(null)

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
          backgroundImage: `radial-gradient(circle,${theme.bdr} 1px,transparent 1px)`,
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
          <EdgesLayer nodes={nodes} edges={edges} />
          {nodes.map((n) => (
            <CanvasNode
              key={n.id}
              node={n}
              selected={selected === n.id}
              onClick={(id) => setSelected(id)}
              onDrag={(id, x, y) =>
                setLiveNodes((prev) => prev.map((nd) => (nd.id === id ? { ...nd, x, y } : nd)))
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
            background: theme.bg1,
            border: `1px solid ${theme.bdr}`,
            borderRadius: 4,
            overflow: 'hidden',
            zIndex: 40,
          }}
        >
          <div
            className="absolute font-mono"
            style={{ top: 3, left: 5, fontSize: 6, letterSpacing: 2, color: theme.t3 }}
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
                background: STATUS_COLORS[n.status] || theme.bg3,
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
                background: theme.bg1,
                border: `1px solid ${theme.bdr}`,
                borderRadius: 5,
                cursor: 'pointer',
              }}
            >
              <b.Icon size={13} style={{ color: theme.t2 }} />
            </button>
          ))}
          <div
            className="flex items-center font-mono"
            style={{
              padding: '0 8px',
              height: 28,
              background: theme.bg1,
              border: `1px solid ${theme.bdr}`,
              borderRadius: 5,
              fontSize: 9,
              color: theme.t3,
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
          background: theme.bg1,
          borderLeft: `1px solid ${theme.bdr}`,
          fontFamily: theme.sans,
        }}
      >
        {/* Inspector header */}
        <div
          className="flex items-center justify-between flex-shrink-0"
          style={{ padding: '8px 14px', borderBottom: `1px solid ${theme.bdr}` }}
        >
          <button
            onClick={onRoom}
            className="flex items-center gap-1 font-mono"
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.t3,
              cursor: 'pointer',
              fontSize: 10,
              padding: 0,
            }}
          >
            <ArrowLeft size={12} style={{ color: theme.t3 }} /> Room
          </button>
          <span className="font-mono" style={{ fontSize: 8, color: theme.t3, letterSpacing: 1 }}>
            INSPECTOR
          </span>
        </div>

        {selectedNode ? (
          <>
            {/* Inspector tabs */}
            <div className="flex flex-shrink-0" style={{ borderBottom: `1px solid ${theme.bdr}` }}>
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
                    borderBottom: inspectorTab === tab.id ? `1.5px solid ${theme.t}` : '1.5px solid transparent',
                    color: inspectorTab === tab.id ? theme.t : theme.t3,
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
                  <div style={{ fontSize: 15, fontWeight: 600, color: theme.t, marginBottom: 3 }}>
                    {selectedNode.label}
                  </div>
                  <div className="font-mono" style={{ fontSize: 9, color: theme.t3, marginBottom: 12 }}>
                    {selectedNode.sub}
                  </div>
                  <div
                    style={{
                      padding: '9px 10px',
                      background: theme.bg,
                      border: `1px solid ${theme.bdr}`,
                      borderRadius: 4,
                      fontSize: 10.5,
                      color: theme.t2,
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
                        borderBottom: `1px solid ${theme.bdr}`,
                        fontSize: 10,
                      }}
                    >
                      <span style={{ color: theme.t3 }}>{k}</span>
                      <span
                        style={{
                          color: c || theme.t,
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
                          background: theme.bg,
                          border: `1px solid ${selectedNode.validation.status === 'pass' ? theme.grn + '33' : theme.bdr}`,
                          borderRadius: 4,
                        }}
                      >
                        <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
                          <span className="flex items-center gap-1 font-mono" style={{ fontSize: 9, color: theme.t2 }}>
                            <Shield size={10} style={{ color: theme.t2 }} /> Level {selectedNode.validation.level}
                          </span>
                          <Tag
                            color={
                              selectedNode.validation.status === 'pass' ? theme.grn
                                : selectedNode.validation.status === 'running' ? theme.amb : theme.t3
                            }
                          >
                            {selectedNode.validation.status.toUpperCase()}
                          </Tag>
                        </div>
                        <div className="font-mono" style={{ fontSize: 8.5, color: theme.t3, lineHeight: 1.5 }}>
                          {selectedNode.validation.result}
                        </div>
                      </div>
                    </>
                  )}

                  {selectedNode.progress !== null && (
                    <div style={{ marginTop: 12 }}>
                      <div
                        className="flex justify-between font-mono"
                        style={{ fontSize: 8.5, color: theme.t3, marginBottom: 4 }}
                      >
                        <span>PROGRESS</span>
                        <span>{Math.round(selectedNode.progress)}%</span>
                      </div>
                      <div style={{ height: 2, background: theme.bg3, borderRadius: 1 }}>
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
                          background: theme.bg,
                          border: `1px solid ${theme.cyn}15`,
                          borderRadius: 4,
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <SkillBadge name={s} />
                          <span style={{ fontSize: 9.5, color: theme.t2 }}>context</span>
                        </div>
                        <button
                          className="flex"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                        >
                          <X size={12} style={{ color: theme.t3 }} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="font-mono" style={{ fontSize: 10, color: theme.t3 }}>None</div>
                  )}
                  <SectionHeader>Available</SectionHeader>
                  {['Stripe', 'Figma', 'Docker', 'Security'].map((s) => (
                    <div
                      key={s}
                      className="flex justify-between items-center"
                      style={{
                        padding: '6px 10px',
                        marginBottom: 4,
                        background: theme.bg,
                        border: `1px solid ${theme.bdr}`,
                        borderRadius: 4,
                      }}
                    >
                      <span className="font-mono" style={{ fontSize: 9.5, color: theme.t3 }}>
                        {s}Skill
                      </span>
                      <button
                        className="flex items-center gap-1 font-mono"
                        style={{
                          padding: '2px 8px',
                          background: theme.bg2,
                          border: `1px solid ${theme.bdr}`,
                          borderRadius: 3,
                          color: theme.t2,
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
                        background: theme.bg,
                        border: `1px solid ${theme.bdr}`,
                        borderRadius: 4,
                        fontSize: 9,
                        color: theme.t2,
                        lineHeight: 1.8,
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <FolderOpen size={10} style={{ color: theme.t3 }} /> path: {selectedNode.worktree}
                      </div>
                      <div className="flex items-center gap-1">
                        <GitBranch size={10} style={{ color: theme.blu }} /> branch:{' '}
                        <span style={{ color: theme.blu }}>{selectedNode.branch}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 size={10} style={{ color: theme.grn }} /> isolated
                      </div>
                    </div>
                  ) : (
                    <div className="font-mono" style={{ fontSize: 10, color: theme.t3 }}>No worktree</div>
                  )}
                  <SectionHeader>All Worktrees</SectionHeader>
                  {nodes.filter((n) => n.worktree).map((n) => (
                    <div
                      key={n.id}
                      className="flex items-center gap-1.5 font-mono"
                      style={{
                        padding: '5px 8px',
                        marginBottom: 3,
                        background: n.id === selectedNode.id ? theme.bg2 : theme.bg,
                        border: `1px solid ${n.id === selectedNode.id ? theme.t3 : theme.bdr}`,
                        borderRadius: 3,
                        fontSize: 8,
                      }}
                    >
                      <GitBranch
                        size={9}
                        style={{ color: n.status === 'done' ? theme.grn : theme.t3 }}
                      />
                      <div className="flex-1">
                        <div style={{ color: n.status === 'done' ? theme.grn : theme.t2 }}>
                          {n.branch || `agent/${n.id}`}
                        </div>
                        <div style={{ color: theme.t3, marginTop: 1 }}>{n.status}</div>
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
                      background: theme.bg,
                      border: `1px solid ${theme.bdr}`,
                      borderRadius: 4,
                      fontSize: 8.5,
                      color: theme.t3,
                      lineHeight: 1.8,
                      minHeight: 200,
                      maxHeight: 400,
                      overflowY: 'auto',
                    }}
                  >
                    {liveStream[selectedNode.id]?.length ? (
                      liveStream[selectedNode.id].map((line, i) => (
                        <div
                          key={i}
                          style={{
                            color: line.startsWith('$') ? theme.grn
                              : line.includes('pass') || line.includes('PASS') ? theme.grn
                              : line.includes('error') || line.includes('ERROR') ? theme.red
                              : line.includes('Creating') || line.includes('Writing') ? theme.cyn
                              : theme.t3,
                          }}
                        >
                          {line}
                        </div>
                      ))
                    ) : (
                      <>
                        <div style={{ color: theme.grn }}>$ vibe --prompt "..." --auto-approve</div>
                        <div>Reading project structure...</div>
                        <div>Found .alchemistral/contracts/api-schema.json</div>
                        <div style={{ color: theme.cyn }}>Creating src/components/AuthForm.tsx</div>
                        <div style={{ color: theme.t2 }}>{'const { useState } = React'}</div>
                        <div style={{ color: theme.t2 }}>{'const auth = useAuthStore()'}</div>
                        <div>...</div>
                        <div style={{ color: theme.grn }}>$ npm run build</div>
                        <div style={{ color: theme.grn }}>Build passed</div>
                        <div style={{ color: theme.grn }}>$ npm test — 8/8</div>
                        <div className="flex items-center gap-1" style={{ color: theme.amb, marginTop: 6 }}>
                          <ShieldCheck size={10} style={{ color: theme.amb }} /> Self-test PASS
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Inspector actions */}
            <div
              className="flex flex-col gap-1.5 flex-shrink-0"
              style={{ padding: '10px 14px', borderTop: `1px solid ${theme.bdr}` }}
            >
              <button
                className="flex items-center justify-center gap-1.5 w-full"
                style={{
                  padding: 8,
                  background: 'transparent',
                  border: `1px solid ${theme.amb}33`,
                  borderRadius: 5,
                  color: theme.amb,
                  fontSize: 10,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: theme.sans,
                }}
              >
                <Scan size={13} style={{ color: theme.amb }} /> Security Scan
              </button>
              {selectedNode.status === 'done' && (
                <button
                  className="flex items-center justify-center gap-1.5 w-full"
                  style={{
                    padding: 8,
                    background: theme.grn + '15',
                    border: `1px solid ${theme.grn}33`,
                    borderRadius: 5,
                    color: theme.grn,
                    fontSize: 10,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: theme.sans,
                  }}
                >
                  <GitMerge size={13} style={{ color: theme.grn }} /> Approve & Merge
                </button>
              )}
              {selectedNode.type === 'parent' && (
                <button
                  className="flex items-center justify-center gap-1.5 w-full"
                  style={{
                    padding: 8,
                    background: 'transparent',
                    border: `1px solid ${theme.bdr}`,
                    borderRadius: 5,
                    color: theme.t2,
                    fontSize: 10,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: theme.sans,
                  }}
                >
                  <Bot size={13} style={{ color: theme.t2 }} /> Spawn Child
                </button>
              )}
            </div>
          </>
        ) : (
          /* No selection */
          <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: 20 }}>
            <Scan size={24} style={{ color: theme.t3 }} />
            <div className="font-mono text-center" style={{ fontSize: 11, color: theme.t3, marginTop: 8, marginBottom: 20 }}>
              Select a node
            </div>
            <div className="w-full" style={{ border: `1px solid ${theme.bdr}`, borderRadius: 5, overflow: 'hidden' }}>
              {[
                { k: 'Agents', v: nodes.length, Icon: Bot },
                { k: 'Active', v: nodes.filter((n) => n.status === 'active').length, c: theme.blu, Icon: Loader2 },
                { k: 'Review', v: nodes.filter((n) => n.status === 'review').length, c: theme.amb, Icon: Eye },
                { k: 'Done', v: nodes.filter((n) => n.status === 'done').length, c: theme.grn, Icon: CheckCircle2 },
                { k: 'Blocked', v: nodes.filter((n) => n.status === 'blocked').length, c: theme.red, Icon: Ban },
                { k: 'Worktrees', v: nodes.filter((n) => n.worktree).length, c: theme.pur, Icon: GitBranch },
              ].map(({ k, v, c, Icon }, i) => (
                <div
                  key={k}
                  className="flex justify-between items-center font-mono"
                  style={{
                    padding: '8px 12px',
                    borderBottom: i < 5 ? `1px solid ${theme.bdr}` : 'none',
                    fontSize: 10,
                  }}
                >
                  <span className="flex items-center gap-1.5" style={{ color: theme.t3 }}>
                    <Icon size={11} style={{ color: c || theme.t3 }} /> {k}
                  </span>
                  <span style={{ color: c || theme.t, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
