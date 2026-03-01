import { useState, useRef, useEffect, useCallback } from 'react'
import {
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
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
} from 'lucide-react'
import { useTheme, STATUS_COLORS } from '../hooks/useTheme'
import Tag from '../components/Tag'
import Dot from '../components/Dot'
import FileTree from '../components/FileTree'
import ChatPanel from '../components/ChatPanel'
import { type AgentNode } from '../styles/data'
import type { WsEvent } from '../hooks/useWebSocket'
import type { ChatMsg } from './Room'

// ── Constants ────────────────────────────────────────────────────────────────

const NODE_WIDTH = 240

// ── Helpers ──────────────────────────────────────────────────────────────────

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
        fontSize: 7, fontWeight: 500, color: theme.cyn,
        background: theme.cyn + '12', border: `1px solid ${theme.cyn}22`,
        padding: '1px 4px', borderRadius: 2,
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
      {v.status === 'pass' ? <CheckCircle2 size={9} style={{ color: c }} /> : <Loader2 size={9} style={{ color: c }} />}
      L{v.level} <span style={{ color: theme.t3 }}>{v.status.toUpperCase()}</span>
    </div>
  )
}

// ── Canvas Node ──────────────────────────────────────────────────────────────

function CanvasNode({
  node, selected, onClick, onDrag, zoom,
}: {
  node: AgentNode; selected: boolean
  onClick: (id: string) => void; onDrag: (id: string, x: number, y: number) => void
  zoom: number
}) {
  const { theme } = useTheme()
  const sc = STATUS_COLORS[node.status] || theme.t3
  const dragging = useRef(false)
  const startPos = useRef({ mx: 0, my: 0, nx: 0, ny: 0 })
  const isOrch = node.type === 'orch'

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      dragging.current = true
      startPos.current = { mx: e.clientX, my: e.clientY, nx: node.x, ny: node.y }
      const handleMove = (ev: MouseEvent) => {
        if (!dragging.current) return
        onDrag(node.id, startPos.current.nx + (ev.clientX - startPos.current.mx) / zoom, startPos.current.ny + (ev.clientY - startPos.current.my) / zoom)
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
      style={{ position: 'absolute', left: node.x, top: node.y, width: NODE_WIDTH, cursor: 'grab', userSelect: 'none' }}
    >
      {isOrch && (
        <div className="flex items-center justify-center gap-1 font-mono" style={{ textAlign: 'center', fontSize: 7, letterSpacing: 3, color: theme.t3, marginBottom: 4 }}>
          <Hexagon size={10} style={{ color: theme.t3 }} /> ORCHESTRATOR
        </div>
      )}
      <div
        style={{
          background: selected ? theme.bg2 : theme.bg1,
          border: `1px solid ${selected ? theme.t3 : theme.bdr}`,
          borderRadius: 6, overflow: 'hidden',
          boxShadow: selected ? `0 0 0 1px ${theme.bdr},0 8px 24px rgba(0,0,0,.7)` : '0 2px 8px rgba(0,0,0,.4)',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
        }}
      >
        <div className="flex items-center gap-1.5" style={{ padding: '7px 10px', borderBottom: `1px solid ${theme.bdr}` }}>
          <Dot color={sc} pulse={node.status === 'active' || node.status === 'blocked'} />
          <span className="flex-1" style={{ fontSize: 11, fontWeight: 600, color: theme.t, fontFamily: theme.sans }}>{node.label}</span>
          <Tag color={sc}>{node.status.toUpperCase()}</Tag>
        </div>
        <div style={{ padding: '7px 10px' }}>
          <div className="font-mono" style={{ fontSize: 8, color: theme.t3, marginBottom: 5 }}>{node.sub}</div>
          {node.skills.length > 0 && (
            <div className="flex gap-0.5 flex-wrap" style={{ marginBottom: 5 }}>
              {node.skills.map((s) => <SkillBadge key={s} name={s} />)}
            </div>
          )}
          <div style={{ fontSize: 9, color: theme.t2, lineHeight: 1.5, marginBottom: 5, minHeight: 20, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {node.task}
          </div>
          {node.progress !== null && node.progress > 0 && (
            <div style={{ height: 1.5, background: theme.bg3, borderRadius: 1, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{ height: '100%', width: `${node.progress}%`, background: sc, transition: 'width .8s ease' }} />
            </div>
          )}
          <div className="flex justify-between items-center font-mono" style={{ fontSize: 7.5, color: theme.t3 }}>
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

// ── Edges ────────────────────────────────────────────────────────────────────

function EdgesLayer({ nodes, edges }: { nodes: AgentNode[]; edges: { from: string; to: string }[] }) {
  const { theme } = useTheme()
  const nodeMap: Record<string, AgentNode> = {}
  nodes.forEach((n) => (nodeMap[n.id] = n))
  return (
    <svg className="absolute inset-0 overflow-visible pointer-events-none">
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill={theme.t3} opacity={0.3} />
        </marker>
      </defs>
      {edges.map((e, i) => {
        const f = nodeMap[e.from]; const t = nodeMap[e.to]
        if (!f || !t) return null
        const fx = f.x + NODE_WIDTH / 2; const fy = f.y + 140
        const tx = t.x + NODE_WIDTH / 2; const ty = t.y
        const cy = (fy + ty) / 2
        return <path key={i} d={`M${fx},${fy} C${fx},${cy} ${tx},${cy} ${tx},${ty}`} fill="none" stroke={theme.t3} strokeWidth={1} strokeOpacity={0.2} markerEnd="url(#arrowhead)" />
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
  if (orch) { orch.x = 420; orch.y = 100 }
  parents.forEach((p, i) => { p.x = startX + i * 280; p.y = 340 })
  return agents
}

// ── Inspector Overlay ────────────────────────────────────────────────────────

function InspectorOverlay({
  node, liveStream, allNodes, onClose,
}: {
  node: AgentNode; liveStream: Record<string, string[]>; allNodes: AgentNode[]
  onClose: () => void
}) {
  const { theme } = useTheme()
  const sc = STATUS_COLORS[node.status]
  return (
    <div
      style={{
        width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: theme.bg1 + 'f5', borderLeft: `1px solid ${theme.bdr}`,
        zIndex: 46, backdropFilter: 'blur(8px)', position: 'relative',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0" style={{ padding: '8px 14px', borderBottom: `1px solid ${theme.bdr}` }}>
        <button onClick={onClose} className="flex items-center gap-1 font-mono" style={{ background: 'transparent', border: 'none', color: theme.t3, cursor: 'pointer', fontSize: 10, padding: 0 }}>
          <ArrowLeft size={12} style={{ color: theme.t3 }} /> Back to Chat
        </button>
        <span className="font-mono" style={{ fontSize: 8, color: theme.t3, letterSpacing: 1 }}>INSPECTOR</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '12px 14px' }}>
        {/* Identity */}
        <div className="flex items-center gap-1 font-mono uppercase" style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: 2, color: sc, marginBottom: 10 }}>
          <StatusIcon status={node.status} size={11} />
          {node.type === 'orch' ? 'ORCHESTRATOR' : node.type === 'parent' ? 'PARENT AGENT' : node.type === 'sec' ? 'SECURITY' : 'CHILD'}
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: theme.t, marginBottom: 3 }}>{node.label}</div>
        <div className="font-mono" style={{ fontSize: 9, color: theme.t3, marginBottom: 12 }}>{node.sub}</div>

        {/* Task */}
        <div style={{ padding: '9px 10px', background: theme.bg, border: `1px solid ${theme.bdr}`, borderRadius: 4, fontSize: 10.5, color: theme.t2, lineHeight: 1.6, marginBottom: 12 }}>
          {node.task}
        </div>

        {/* Props table */}
        {[
          { k: 'Status', v: node.status.toUpperCase(), c: sc },
          { k: 'Tokens', v: node.tokens },
          { k: 'Branch', v: node.branch || '\u2014' },
          { k: 'Worktree', v: node.worktree || '\u2014' },
        ].map(({ k, v, c }) => (
          <div key={k} className="flex justify-between font-mono" style={{ padding: '6px 0', borderBottom: `1px solid ${theme.bdr}`, fontSize: 10 }}>
            <span style={{ color: theme.t3 }}>{k}</span>
            <span style={{ color: c || theme.t, fontWeight: 500, fontSize: 9, maxWidth: 180, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
          </div>
        ))}

        {/* Progress */}
        {node.progress !== null && (
          <div style={{ marginTop: 12 }}>
            <div className="flex justify-between font-mono" style={{ fontSize: 8.5, color: theme.t3, marginBottom: 4 }}>
              <span>PROGRESS</span><span>{Math.round(node.progress)}%</span>
            </div>
            <div style={{ height: 2, background: theme.bg3, borderRadius: 1 }}>
              <div style={{ height: '100%', width: `${node.progress}%`, background: sc, borderRadius: 1, transition: 'width .8s ease' }} />
            </div>
          </div>
        )}

        {/* Validation */}
        {node.validation && (
          <>
            <div className="font-mono uppercase" style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, color: theme.t3, marginBottom: 8, marginTop: 16 }}>Validation Gate</div>
            <div style={{ padding: '8px 10px', background: theme.bg, border: `1px solid ${node.validation.status === 'pass' ? theme.grn + '33' : theme.bdr}`, borderRadius: 4 }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
                <span className="flex items-center gap-1 font-mono" style={{ fontSize: 9, color: theme.t2 }}><Shield size={10} /> Level {node.validation.level}</span>
                <Tag color={node.validation.status === 'pass' ? theme.grn : node.validation.status === 'running' ? theme.amb : theme.t3}>{node.validation.status.toUpperCase()}</Tag>
              </div>
              <div className="font-mono" style={{ fontSize: 8.5, color: theme.t3, lineHeight: 1.5 }}>{node.validation.result}</div>
            </div>
          </>
        )}

        {/* Skills */}
        {node.skills.length > 0 && (
          <>
            <div className="font-mono uppercase" style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, color: theme.t3, marginBottom: 8, marginTop: 16 }}>Skills</div>
            <div className="flex gap-1 flex-wrap">{node.skills.map((s) => <SkillBadge key={s} name={s} />)}</div>
          </>
        )}

        {/* Live stream */}
        <div className="font-mono uppercase" style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, color: theme.t3, marginBottom: 8, marginTop: 16 }}>Live Output</div>
        <div className="font-mono" style={{ padding: 10, background: theme.bg, border: `1px solid ${theme.bdr}`, borderRadius: 4, fontSize: 8.5, color: theme.t3, lineHeight: 1.8, minHeight: 100, maxHeight: 300, overflowY: 'auto' }}>
          {liveStream[node.id]?.length ? (
            liveStream[node.id].map((line, i) => (
              <div key={i} style={{
                color: line.startsWith('$') ? theme.grn
                  : line.includes('pass') || line.includes('PASS') ? theme.grn
                  : line.includes('error') || line.includes('ERROR') ? theme.red
                  : line.includes('Creating') || line.includes('Writing') ? theme.cyn
                  : theme.t3,
              }}>{line}</div>
            ))
          ) : (
            <div style={{ color: theme.t3, fontStyle: 'italic' }}>No output yet</div>
          )}
        </div>

        {/* All worktrees */}
        <div className="font-mono uppercase" style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, color: theme.t3, marginBottom: 8, marginTop: 16 }}>All Worktrees</div>
        {allNodes.filter((n) => n.worktree).map((n) => (
          <div key={n.id} className="flex items-center gap-1.5 font-mono" style={{ padding: '5px 8px', marginBottom: 3, background: n.id === node.id ? theme.bg2 : theme.bg, border: `1px solid ${n.id === node.id ? theme.t3 : theme.bdr}`, borderRadius: 3, fontSize: 8 }}>
            <GitBranch size={9} style={{ color: n.status === 'done' ? theme.grn : theme.t3 }} />
            <div className="flex-1">
              <div style={{ color: n.status === 'done' ? theme.grn : theme.t2 }}>{n.branch || `agent/${n.id}`}</div>
              <div style={{ color: theme.t3, marginTop: 1 }}>{n.status}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5 flex-shrink-0" style={{ padding: '10px 14px', borderTop: `1px solid ${theme.bdr}` }}>
        <button className="flex items-center justify-center gap-1.5 w-full" style={{ padding: 8, background: 'transparent', border: `1px solid ${theme.amb}33`, borderRadius: 5, color: theme.amb, fontSize: 10, fontWeight: 500, cursor: 'pointer', fontFamily: theme.sans }}>
          <Scan size={13} style={{ color: theme.amb }} /> Security Scan
        </button>
        {node.status === 'done' && (
          <button className="flex items-center justify-center gap-1.5 w-full" style={{ padding: 8, background: theme.grn + '15', border: `1px solid ${theme.grn}33`, borderRadius: 5, color: theme.grn, fontSize: 10, fontWeight: 500, cursor: 'pointer', fontFamily: theme.sans }}>
            <GitMerge size={13} style={{ color: theme.grn }} /> Approve & Merge
          </button>
        )}
        {node.type === 'parent' && (
          <button className="flex items-center justify-center gap-1.5 w-full" style={{ padding: 8, background: 'transparent', border: `1px solid ${theme.bdr}`, borderRadius: 5, color: theme.t2, fontSize: 10, fontWeight: 500, cursor: 'pointer', fontFamily: theme.sans }}>
            <Bot size={13} style={{ color: theme.t2 }} /> Spawn Child
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main Lab Component ───────────────────────────────────────────────────────

interface LabProps {
  projectId: string
  wsMessages: WsEvent[]
  chatMessages: ChatMsg[]
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMsg[]>>
  scanStatus: string | null
  refreshTick: number
}

export default function Lab({ projectId, wsMessages, chatMessages, setChatMessages, scanStatus, refreshTick }: LabProps) {
  const { theme } = useTheme()

  // ── Canvas state ──
  const [liveNodes, setLiveNodes] = useState<AgentNode[]>([])
  const [liveStream, setLiveStream] = useState<Record<string, string[]>>({})
  const processedRef = useRef(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [viewport, setViewport] = useState({ x: -20, y: -20, z: 0.85 })
  const [panning, setPanning] = useState(false)
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  // ── Panel state ──
  const [chatOpen, setChatOpen] = useState(true)
  const [fileTreeOpen, setFileTreeOpen] = useState(true)
  const [sending, setSending] = useState(false)

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setChatOpen((v) => !v) }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') { e.preventDefault(); setFileTreeOpen((v) => !v) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── Process WS events to build live agent nodes ──
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
              id: 'orch', type: 'orch', x: 420, y: 100,
              label: 'Orchestrator', sub: 'mistral-large \u00b7 coordination', status: 'active',
              tokens: '\u2014', progress: null, task: 'Coordinating agents',
              children: [], branch: null, skills: [], validation: null, worktree: null,
            })
          }
          const domain = (msg.domain as string) || 'backend'
          nodes.push({
            id: agentId, type: 'parent', x: 0, y: 0,
            label: (msg.label as string) || agentId,
            sub: `vibe cli \u00b7 ${domain} \u00b7 worktree`, status: 'active',
            tokens: '0', progress: 5,
            task: (msg.label as string) || 'Working...',
            children: [], branch: `agent/${agentId}`, skills: [],
            validation: null, worktree: `.worktrees/${agentId}/`,
          })
          const orchNode = nodes.find((n) => n.type === 'orch')
          if (orchNode && !orchNode.children.includes(agentId)) orchNode.children = [...orchNode.children, agentId]
          return positionNodes(nodes)
        })
      }

      if (type === 'status' && agentId !== 'orchestrator') {
        setLiveNodes((prev) => prev.map((n) => n.id === agentId ? { ...n, status: mapStatus((msg.status as string) || 'active'), branch: (msg.branch as string) || n.branch, worktree: (msg.worktree as string) || n.worktree } : n))
      }

      if ((type === 'output' || type === 'think' || type === 'code' || type === 'bash') && agentId !== 'orchestrator') {
        const text = (msg.text as string) || ''
        setLiveStream((prev) => ({ ...prev, [agentId]: [...(prev[agentId] || []), text].slice(-50) }))
        setLiveNodes((prev) => prev.map((n) => n.id === agentId && n.progress !== null ? { ...n, progress: Math.min((n.progress || 0) + 2, 95), tokens: String(parseInt(n.tokens || '0') + text.length) } : n))
      }

      if (type === 'done' && agentId !== 'orchestrator') {
        setLiveNodes((prev) => prev.map((n) => n.id === agentId ? { ...n, status: 'done', progress: 100, validation: { level: 1, status: 'pass', result: 'Self-test passed' } } : n))
      }

      if (type === 'error' && agentId !== 'orchestrator') {
        setLiveNodes((prev) => prev.map((n) => n.id === agentId ? { ...n, status: 'blocked', task: (msg.text as string) || 'Error' } : n))
      }
    }
  }, [wsMessages])

  // Reset when project changes
  useEffect(() => {
    setLiveNodes([])
    setLiveStream({})
    processedRef.current = 0
  }, [projectId])

  // Wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    setViewport((v) => ({ ...v, z: Math.max(0.2, Math.min(2.5, v.z * (e.deltaY > 0 ? 0.92 : 1.08))) }))
  }, [])

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const nodes = liveNodes
  const edges = buildLiveEdges(liveNodes)
  const selectedNode = nodes.find((n) => n.id === selected)
  const hasNodes = nodes.length > 0

  return (
    <div className="flex-1 flex overflow-hidden" style={{ position: 'relative' }}>

      {/* ── Left: File Tree ── */}
      <div
        style={{
          width: fileTreeOpen ? 240 : 0,
          flexShrink: 0,
          overflow: 'hidden',
          borderRight: fileTreeOpen ? `1px solid ${theme.bdr}` : 'none',
          background: theme.bg1,
          transition: 'width 200ms ease',
        }}
      >
        {fileTreeOpen && (
          <div style={{ width: 240 }}>
            <div className="flex items-center justify-between" style={{ padding: '6px 8px', borderBottom: `1px solid ${theme.bdr}` }}>
              <span className="font-mono" style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, color: theme.t3, paddingLeft: 2 }}>FILES</span>
              <button onClick={() => setFileTreeOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2 }}>
                <PanelLeftClose size={12} style={{ color: theme.t3 }} />
              </button>
            </div>
            <FileTree projectId={projectId} refreshTick={refreshTick} />
          </div>
        )}
      </div>

      {/* File tree toggle when closed */}
      {!fileTreeOpen && (
        <button
          onClick={() => setFileTreeOpen(true)}
          style={{
            position: 'absolute', left: 12, top: 12, width: 32, height: 32, borderRadius: 6,
            background: theme.bg1, border: `1px solid ${theme.bdr}`, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
          }}
        >
          <PanelLeftOpen size={14} style={{ color: theme.t2 }} />
        </button>
      )}

      {/* ── Center: Infinite Canvas ── */}
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
            if (selected) setSelected(null)
          }
        }}
        onMouseMove={(e) => {
          if (!panning) return
          setViewport((v) => ({ ...v, x: v.x + (e.clientX - lastMouse.x) / v.z, y: v.y + (e.clientY - lastMouse.y) / v.z }))
          setLastMouse({ x: e.clientX, y: e.clientY })
        }}
        onMouseUp={() => setPanning(false)}
        onMouseLeave={() => setPanning(false)}
      >
        <div data-bg="1" className="absolute inset-0" style={{ transform: `scale(${viewport.z}) translate(${viewport.x}px,${viewport.y}px)`, transformOrigin: '0 0' }}>
          <EdgesLayer nodes={nodes} edges={edges} />
          {nodes.map((n) => (
            <CanvasNode
              key={n.id} node={n} selected={selected === n.id}
              onClick={(id) => setSelected(id)}
              onDrag={(id, x, y) => setLiveNodes((prev) => prev.map((nd) => (nd.id === id ? { ...nd, x, y } : nd)))}
              zoom={viewport.z}
            />
          ))}
        </div>

        {/* Empty state — onboarding */}
        {!hasNodes && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ pointerEvents: 'none' }}>
            {/* Pulsing orchestrator placeholder */}
            <div
              style={{
                width: 120, height: 50, borderRadius: 8,
                border: `1.5px solid ${theme.t3}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                animation: 'thinking-pulse 2s ease-in-out infinite',
                background: theme.bg1,
              }}
            >
              <Hexagon size={14} style={{ color: theme.t3 }} />
              <span className="font-mono" style={{ fontSize: 9, color: theme.t3, letterSpacing: 2 }}>ORCHESTRATOR</span>
            </div>
            <div className="font-mono" style={{ fontSize: 10, color: theme.t3, marginTop: 16, textAlign: 'center', lineHeight: 1.8 }}>
              Open chat (<span style={{ color: theme.t2, fontWeight: 600 }}>{'\u2318'}K</span>) to start a conversation or send a mission
            </div>
          </div>
        )}

        {/* Zoom controls */}
        <div className="absolute flex gap-1" style={{ bottom: 16, left: fileTreeOpen ? 16 : 52, zIndex: 40, transition: 'left 200ms ease' }}>
          {[
            { Icon: MinusIcon, fn: () => setViewport((v) => ({ ...v, z: Math.max(0.2, v.z * 0.8) })) },
            { Icon: Maximize2, fn: () => setViewport({ x: -20, y: -20, z: 0.85 }) },
            { Icon: Plus, fn: () => setViewport((v) => ({ ...v, z: Math.min(2.5, v.z * 1.2) })) },
          ].map((b, i) => (
            <button key={i} onClick={b.fn} className="flex items-center justify-center" style={{ width: 28, height: 28, background: theme.bg1, border: `1px solid ${theme.bdr}`, borderRadius: 5, cursor: 'pointer' }}>
              <b.Icon size={13} style={{ color: theme.t2 }} />
            </button>
          ))}
          <div className="flex items-center font-mono" style={{ padding: '0 8px', height: 28, background: theme.bg1, border: `1px solid ${theme.bdr}`, borderRadius: 5, fontSize: 9, color: theme.t3 }}>
            {Math.round(viewport.z * 100)}%
          </div>
        </div>

        {/* Minimap */}
        <div className="absolute" style={{ bottom: 16, right: chatOpen ? 396 : 16, width: 140, height: 70, background: theme.bg1, border: `1px solid ${theme.bdr}`, borderRadius: 4, overflow: 'hidden', zIndex: 40, transition: 'right 200ms ease' }}>
          <div className="absolute font-mono" style={{ top: 3, left: 5, fontSize: 6, letterSpacing: 2, color: theme.t3 }}>MAP</div>
          {nodes.map((n) => (
            <div key={n.id} className="absolute" style={{ left: n.x * 0.08 + 4, top: n.y * 0.08 + 12, width: NODE_WIDTH * 0.08, height: 4, background: STATUS_COLORS[n.status] || theme.bg3, borderRadius: 1, opacity: 0.6 }} />
          ))}
        </div>
      </div>

      {/* ── Right: Chat Panel or Inspector ── */}
      {selectedNode ? (
        <InspectorOverlay
          node={selectedNode}
          liveStream={liveStream}
          allNodes={nodes}
          onClose={() => setSelected(null)}
        />
      ) : (
        <ChatPanel
          open={chatOpen}
          onToggle={() => setChatOpen((v) => !v)}
          projectId={projectId}
          chatMessages={chatMessages}
          setChatMessages={setChatMessages}
          scanStatus={scanStatus}
          sending={sending}
          setSending={setSending}
        />
      )}
    </div>
  )
}
