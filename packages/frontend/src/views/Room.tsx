import { useState, useRef, useEffect, useCallback } from 'react'
import {
  ArrowUp,
  Sparkles,
  Hexagon,
  User,
  Server,
  ShieldCheck,
  Shield,
  Layers,
  Database,
  FileCode2,
  Network,
  Workflow,
  CheckCircle2,
  Loader2,
  Eye,
  Ban,
  Circle,
  RefreshCw,
  Save,
} from 'lucide-react'
import { T, STATUS_COLORS } from '../styles/tokens'
import Tag from '../components/Tag'
import {
  fetchGlobalMemory,
  writeGlobalMemory,
  fetchAgentMemories,
  fetchContracts,
  fetchContractContent,
  type ContractInfo,
} from '../api/memory'
import { sendMission, type OrchestratorTask } from '../api/orchestrator'

// ── Types ────────────────────────────────────────────────────────────────────

export type DevMsg  = { role: 'dev';  text: string; ts: string }
export type SysMsg  = { role: 'sys';  text: string; ts: string }
export type OrchMsg = { role: 'orch'; text: string; ts: string }
export type RepMsg  = { role: 'rep';  orig: string; refined: string; ts: string }
export type ValMsg  = { role: 'val';  agent: string; level: number; status: string; detail: string; ts: string }
export type ChatMsg = DevMsg | SysMsg | OrchMsg | RepMsg | ValMsg

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtTs(): string {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatusIcon({ status, size = 10 }: { status: string; size?: number }) {
  const color = STATUS_COLORS[status] || T.t3
  switch (status) {
    case 'done':    return <CheckCircle2 size={size} style={{ color }} />
    case 'active':  return <Loader2     size={size} style={{ color }} />
    case 'review':  return <Eye         size={size} style={{ color }} />
    case 'blocked': return <Ban         size={size} style={{ color }} />
    default:        return <Circle      size={size} style={{ color }} />
  }
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-mono uppercase"
      style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, color: T.t3, marginBottom: 8, marginTop: 16 }}
    >
      {children}
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface RoomProps {
  projectId: string
  onLab: () => void
  chatMessages: ChatMsg[]
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMsg[]>>
  dagTasks: OrchestratorTask[]
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Room({ projectId, onLab, chatMessages, setChatMessages, dagTasks }: RoomProps) {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [rightTab, setRightTab] = useState('arch')
  const [expandedContract, setExpandedContract] = useState<string | null>(null)
  const [contractContents, setContractContents] = useState<Record<string, string>>({})
  const bottomRef = useRef<HTMLDivElement>(null)

  // Memory tab state
  const [globalMemory, setGlobalMemory] = useState('')
  const [editingMemory, setEditingMemory] = useState(false)
  const [memoryDraft, setMemoryDraft] = useState('')
  const [savingMemory, setSavingMemory] = useState(false)
  const [agentFiles, setAgentFiles] = useState<string[]>([])

  // Contracts tab state
  const [contracts, setContracts] = useState<ContractInfo[]>([])

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // ── Load right panel data ────────────────────────────────────────────────
  const loadMemory = useCallback(async () => {
    const [mem, agents] = await Promise.all([
      fetchGlobalMemory(projectId),
      fetchAgentMemories(projectId),
    ])
    setGlobalMemory(mem)
    setMemoryDraft(mem)
    setAgentFiles(agents)
  }, [projectId])

  const loadContracts = useCallback(async () => {
    setContracts(await fetchContracts(projectId))
  }, [projectId])

  useEffect(() => {
    loadMemory()
    loadContracts()
  }, [loadMemory, loadContracts])

  // Reload memory/contracts when chat messages change (new events came in)
  const lastChatLen = useRef(0)
  useEffect(() => {
    if (chatMessages.length > lastChatLen.current) {
      // Check if any new messages are contract or memory updates
      const newMsgs = chatMessages.slice(lastChatLen.current)
      const hasContract = newMsgs.some((m) => m.role === 'orch' && 'text' in m && m.text.startsWith('Contract written:'))
      const hasMemory = newMsgs.some((m) => m.role === 'orch' && 'text' in m && m.text.startsWith('Global memory updated:'))
      if (hasContract) loadContracts()
      if (hasMemory) loadMemory()
    }
    lastChatLen.current = chatMessages.length
  }, [chatMessages, loadContracts, loadMemory])

  // ── Send mission ─────────────────────────────────────────────────────────
  const handleSend = async () => {
    const msg = input.trim()
    if (!msg || sending) return
    setInput('')
    setSending(true)

    // Add dev message immediately
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

  // ── Memory save ──────────────────────────────────────────────────────────
  const handleSaveMemory = async () => {
    setSavingMemory(true)
    await writeGlobalMemory(projectId, memoryDraft)
    setGlobalMemory(memoryDraft)
    setEditingMemory(false)
    setSavingMemory(false)
  }

  // ── Contract expand ──────────────────────────────────────────────────────
  const handleExpandContract = async (info: ContractInfo) => {
    const key = info.file
    if (expandedContract === key) { setExpandedContract(null); return }
    setExpandedContract(key)
    if (!contractContents[key]) {
      const content = await fetchContractContent(projectId, key)
      setContractContents((prev) => ({ ...prev, [key]: content }))
    }
  }

  // ── Render message ───────────────────────────────────────────────────────
  const renderMessage = (m: ChatMsg, i: number) => {
    if (m.role === 'rep') {
      return (
        <div key={i} style={{ marginBottom: 20 }}>
          <div
            style={{
              padding: '10px 12px',
              background: T.pur + '08',
              border: `1px solid ${T.pur}22`,
              borderRadius: 6,
            }}
          >
            <div
              className="flex items-center gap-1 font-mono uppercase"
              style={{ fontSize: 8, color: T.pur, letterSpacing: 1, marginBottom: 6, fontWeight: 600 }}
            >
              <Sparkles size={10} style={{ color: T.pur }} /> REPROMPT ENGINE
            </div>
            <div style={{ fontSize: 10, color: T.t3, marginBottom: 6, textDecoration: 'line-through' }}>
              {m.orig}
            </div>
            <div style={{ fontSize: 11.5, color: T.t, lineHeight: 1.55 }}>
              {m.refined}
            </div>
          </div>
          <div className="font-mono" style={{ fontSize: 8.5, color: T.t3, marginTop: 3 }}>{m.ts}</div>
        </div>
      )
    }

    if (m.role === 'val') {
      const c = m.status === 'pass' ? T.grn : T.red
      return (
        <div key={i} style={{ marginBottom: 16 }}>
          <div
            className="flex items-center gap-2"
            style={{
              padding: '8px 12px',
              background: c + '08',
              border: `1px solid ${c}22`,
              borderRadius: 6,
            }}
          >
            {m.status === 'pass'
              ? <ShieldCheck size={16} style={{ color: c }} />
              : <Shield size={16} style={{ color: c }} />
            }
            <div className="flex-1">
              <div className="font-mono uppercase" style={{ fontSize: 8, color: c, letterSpacing: 1, fontWeight: 600 }}>
                GATE L{m.level} · {m.agent.toUpperCase()}
              </div>
              <div style={{ fontSize: 10, color: T.t2, marginTop: 2 }}>{m.detail}</div>
            </div>
            <Tag color={c}>{m.status.toUpperCase()}</Tag>
          </div>
        </div>
      )
    }

    // dev, sys, orch
    const avatar =
      m.role === 'dev'
        ? <User size={12} style={{ color: T.t3 }} />
        : m.role === 'sys'
          ? <Server size={11} style={{ color: T.t3 }} />
          : <Hexagon size={12} style={{ color: T.t2 }} />

    return (
      <div
        key={i}
        className="flex gap-2 items-start"
        style={{ marginBottom: 18, flexDirection: m.role === 'dev' ? 'row-reverse' : 'row' }}
      >
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 24, height: 24, borderRadius: '50%',
            background: m.role === 'dev' ? T.bg3 : T.bg2,
            border: `1px solid ${T.bdr}`,
          }}
        >
          {avatar}
        </div>
        <div style={{ maxWidth: '78%' }}>
          <div
            style={{
              padding: '9px 12px',
              background: m.role === 'dev' ? T.bg2 : T.bg1,
              border: `1px solid ${T.bdr}`,
              borderRadius: m.role === 'dev' ? '8px 2px 8px 8px' : '2px 8px 8px 8px',
              fontSize: 12, color: T.t, lineHeight: 1.6, fontFamily: T.sans, whiteSpace: 'pre-wrap',
            }}
          >
            {m.text}
          </div>
          <div
            className="font-mono"
            style={{ fontSize: 8.5, color: T.t3, marginTop: 3, textAlign: m.role === 'dev' ? 'right' : 'left' }}
          >
            {m.ts}
          </div>
        </div>
      </div>
    )
  }

  // ── Right panel tabs ─────────────────────────────────────────────────────
  const rightTabs = [
    { id: 'arch', Icon: Layers },
    { id: 'mem',  Icon: Database },
    { id: 'ctr',  Icon: FileCode2 },
    { id: 'dag',  Icon: Network },
  ]

  // DAG display — only show live tasks from orchestrator
  const displayDag = dagTasks.map((t) => ({
    id: t.id,
    label: t.label,
    agent: t.agent_domain,
    status: 'pending',
    deps: t.dependencies,
  }))

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex overflow-hidden" style={{ fontFamily: T.sans }}>

      {/* ── Chat ── */}
      <div className="flex-1 flex flex-col" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="flex-1 overflow-y-auto" style={{ padding: '20px 24px' }}>
          {chatMessages.map(renderMessage)}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0" style={{ padding: '14px 24px', borderTop: `1px solid ${T.bdr}` }}>
          <div
            className="flex gap-2 items-end"
            style={{ background: T.bg1, border: `1px solid ${T.bdr}`, borderRadius: 8, padding: '10px 12px' }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
              }}
              placeholder="Describe what you want to build..."
              rows={2}
              style={{
                flex: 1, background: 'transparent', border: 'none', color: T.t,
                fontFamily: T.sans, fontSize: 12.5, resize: 'none', outline: 'none', lineHeight: 1.55,
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 30, height: 30, borderRadius: 6,
                background: input.trim() && !sending ? T.t : T.bg3,
                border: 'none',
                cursor: input.trim() && !sending ? 'pointer' : 'default',
              }}
            >
              {sending
                ? <Loader2 size={14} style={{ color: T.t3 }} />
                : <ArrowUp size={14} style={{ color: T.bg }} />
              }
            </button>
          </div>
          <div className="flex justify-between font-mono" style={{ marginTop: 5, fontSize: 8.5, color: T.t3 }}>
            <span>Reprompt engine active · Enter to send · Shift+Enter for newline</span>
            <span className="flex items-center gap-1" style={{ color: T.pur }}>
              <Sparkles size={9} style={{ color: T.pur }} /> Mistral Small
            </span>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-col flex-shrink-0" style={{ width: 300, borderLeft: `1px solid ${T.bdr}` }}>
        {/* Tabs */}
        <div className="flex flex-shrink-0" style={{ borderBottom: `1px solid ${T.bdr}` }}>
          {rightTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRightTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1 font-mono uppercase"
              style={{
                padding: '10px 0', background: 'transparent', border: 'none',
                borderBottom: rightTab === tab.id ? `1.5px solid ${T.t}` : '1.5px solid transparent',
                color: rightTab === tab.id ? T.t : T.t3,
                fontSize: 8.5, fontWeight: rightTab === tab.id ? 600 : 400, cursor: 'pointer',
              }}
            >
              <tab.Icon size={11} /> {tab.id}
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto" style={{ padding: 14 }}>

          {/* ARCH — architecture info */}
          {rightTab === 'arch' && (
            <>
              <SectionHeader>Architecture</SectionHeader>
              <div
                className="font-mono"
                style={{
                  padding: '8px 10px', background: T.bg, border: `1px solid ${T.bdr}`,
                  borderRadius: 4, fontSize: 9, color: T.t3, lineHeight: 1.6,
                }}
              >
                {dagTasks.length > 0 ? (
                  <>
                    <div style={{ color: T.t2, marginBottom: 4 }}>{dagTasks.length} tasks in current DAG</div>
                    {dagTasks.map((t) => (
                      <div key={t.id} className="flex items-center gap-1" style={{ marginBottom: 2 }}>
                        <StatusIcon status="pending" size={9} />
                        <span style={{ color: T.t2 }}>{t.label}</span>
                        <span style={{ color: T.t3 }}>({t.agent_domain})</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <span style={{ fontStyle: 'italic' }}>No active DAG. Send a mission to start.</span>
                )}
              </div>
            </>
          )}

          {/* MEM — real data */}
          {rightTab === 'mem' && (
            <>
              <div className="flex items-center justify-between" style={{ marginTop: 16, marginBottom: 8 }}>
                <div className="font-mono uppercase" style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, color: T.t3 }}>
                  GLOBAL.md
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={loadMemory}
                    className="flex items-center justify-center"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2 }}
                    title="Refresh"
                  >
                    <RefreshCw size={10} style={{ color: T.t3 }} />
                  </button>
                  {!editingMemory ? (
                    <button
                      onClick={() => { setEditingMemory(true); setMemoryDraft(globalMemory) }}
                      className="font-mono"
                      style={{
                        padding: '1px 6px', background: T.bg2, border: `1px solid ${T.bdr}`,
                        borderRadius: 2, fontSize: 8, color: T.t3, cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveMemory}
                      disabled={savingMemory}
                      className="flex items-center gap-1 font-mono"
                      style={{
                        padding: '1px 6px', background: T.grn + '20', border: `1px solid ${T.grn}33`,
                        borderRadius: 2, fontSize: 8, color: T.grn, cursor: 'pointer',
                      }}
                    >
                      <Save size={8} /> {savingMemory ? '...' : 'Save'}
                    </button>
                  )}
                </div>
              </div>

              {editingMemory ? (
                <textarea
                  value={memoryDraft}
                  onChange={(e) => setMemoryDraft(e.target.value)}
                  className="font-mono w-full"
                  style={{
                    background: T.bg, border: `1px solid ${T.bdr}`, borderRadius: 4,
                    padding: '8px 10px', fontSize: 9, color: T.t2, lineHeight: 1.6,
                    minHeight: 180, outline: 'none', resize: 'vertical',
                  }}
                />
              ) : (
                <pre
                  className="font-mono"
                  style={{
                    padding: '8px 10px', background: T.bg, border: `1px solid ${T.bdr}`,
                    borderRadius: 4, fontSize: 9, color: T.t2, lineHeight: 1.6,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
                  }}
                >
                  {globalMemory || <span style={{ color: T.t3, fontStyle: 'italic' }}>empty</span>}
                </pre>
              )}

              <SectionHeader>Agent Memories</SectionHeader>
              {agentFiles.length === 0 ? (
                <div className="font-mono" style={{ fontSize: 9, color: T.t3 }}>No agent memories yet.</div>
              ) : (
                agentFiles.map((f) => (
                  <div
                    key={f}
                    className="font-mono"
                    style={{
                      padding: '6px 8px', marginBottom: 4, background: T.bg,
                      border: `1px solid ${T.bdr}`, borderRadius: 3, fontSize: 9, color: T.t3,
                    }}
                  >
                    .alchemistral/agents/{f}
                  </div>
                ))
              )}
            </>
          )}

          {/* CTR — real data */}
          {rightTab === 'ctr' && (
            <>
              <div className="flex items-center justify-between" style={{ marginTop: 16, marginBottom: 8 }}>
                <div className="font-mono uppercase" style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, color: T.t3 }}>
                  Contracts
                </div>
                <button
                  onClick={loadContracts}
                  className="flex items-center justify-center"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2 }}
                  title="Refresh"
                >
                  <RefreshCw size={10} style={{ color: T.t3 }} />
                </button>
              </div>
              <div className="font-mono" style={{ fontSize: 9, color: T.t3, marginBottom: 12, lineHeight: 1.6 }}>
                Agents write interfaces. Dependents read first.
              </div>

              {contracts.length === 0 ? (
                <div
                  style={{
                    padding: '20px 14px', background: T.bg, border: `1px solid ${T.bdr}`,
                    borderRadius: 4, textAlign: 'center',
                  }}
                >
                  <FileCode2 size={20} style={{ color: T.t3, margin: '0 auto 8px' }} />
                  <div className="font-mono" style={{ fontSize: 9, color: T.t3 }}>No contracts yet.</div>
                  <div className="font-mono" style={{ fontSize: 8, color: T.t3, marginTop: 4, lineHeight: 1.5 }}>
                    Agents write to .alchemistral/contracts/
                  </div>
                </div>
              ) : (
                contracts.map((c) => (
                  <div key={c.file} style={{ marginBottom: 12 }}>
                    <div
                      onClick={() => handleExpandContract(c)}
                      className="cursor-pointer"
                      style={{
                        padding: '8px 10px', background: T.bg1,
                        border: `1px solid ${T.bdr}`, borderRadius: 4,
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span
                          className="flex items-center gap-1 font-mono"
                          style={{ fontSize: 10, color: T.cyn, fontWeight: 500 }}
                        >
                          <FileCode2 size={11} style={{ color: T.cyn }} /> {c.file}
                        </span>
                        <span className="font-mono" style={{ fontSize: 8, color: T.t3 }}>{c.size}B</span>
                      </div>
                    </div>
                    {expandedContract === c.file && (
                      <pre
                        className="font-mono"
                        style={{
                          padding: '8px 10px', background: T.bg,
                          border: `1px solid ${T.bdr}`, borderTop: 'none',
                          borderRadius: '0 0 4px 4px', fontSize: 8.5, color: T.t2,
                          lineHeight: 1.5, overflow: 'auto', margin: 0,
                        }}
                      >
                        {contractContents[c.file] ?? 'Loading...'}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {/* DAG — only live data */}
          {rightTab === 'dag' && (
            <>
              <div className="flex items-center justify-between" style={{ marginTop: 16, marginBottom: 8 }}>
                <div className="font-mono uppercase" style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, color: T.t3 }}>
                  DAG
                </div>
                {dagTasks.length > 0 && (
                  <span className="font-mono" style={{ fontSize: 7.5, color: T.grn }}>
                    {dagTasks.length} tasks
                  </span>
                )}
              </div>

              {displayDag.length === 0 ? (
                <div
                  style={{
                    padding: '20px 14px', background: T.bg, border: `1px solid ${T.bdr}`,
                    borderRadius: 4, textAlign: 'center',
                  }}
                >
                  <Network size={20} style={{ color: T.t3, margin: '0 auto 8px' }} />
                  <div className="font-mono" style={{ fontSize: 9, color: T.t3 }}>No DAG yet.</div>
                  <div className="font-mono" style={{ fontSize: 8, color: T.t3, marginTop: 4, lineHeight: 1.5 }}>
                    Send a mission to generate the task graph.
                  </div>
                </div>
              ) : displayDag.map((t) => {
                const c = STATUS_COLORS[t.status] || T.t3
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-2"
                    style={{
                      padding: '7px 10px', marginBottom: 4, background: T.bg1,
                      border: `1px solid ${T.bdr}`, borderRadius: 4,
                    }}
                  >
                    <StatusIcon status={t.status} size={11} />
                    <div className="flex-1">
                      <div style={{ fontSize: 10, color: T.t }}>{t.label}</div>
                      <div className="font-mono" style={{ fontSize: 7.5, color: T.t3, marginTop: 1 }}>
                        {t.agent}{t.deps.length > 0 && ` \u2190 ${t.deps.join(', ')}`}
                      </div>
                    </div>
                    <Tag color={c}>{t.status.toUpperCase()}</Tag>
                  </div>
                )
              })}
            </>
          )}

        </div>

        {/* Enter Lab */}
        <div className="flex-shrink-0" style={{ padding: '12px 14px', borderTop: `1px solid ${T.bdr}` }}>
          <button
            onClick={onLab}
            className="flex items-center justify-center gap-1.5 w-full"
            style={{
              padding: 10, background: T.t, color: T.bg, border: 'none',
              borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.sans,
            }}
          >
            <Workflow size={14} /> Enter the Lab
          </button>
        </div>
      </div>
    </div>
  )
}
