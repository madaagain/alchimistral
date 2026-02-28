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
  Minus,
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
  MESSAGES,
  DAG_TASKS,
  ARCH_STACK,
  AGENT_TREE,
} from '../styles/data'
import {
  fetchGlobalMemory,
  writeGlobalMemory,
  fetchAgentMemories,
  fetchContracts,
  fetchContractContent,
  type ContractInfo,
} from '../api/memory'
import type { WsEvent } from '../hooks/useWebSocket'

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

interface RoomProps {
  projectId: string
  onLab: () => void
  wsMessages: WsEvent[]
}

export default function Room({ projectId, onLab, wsMessages }: RoomProps) {
  const [input, setInput] = useState('')
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [wsMessages])

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

  const handleSaveMemory = async () => {
    setSavingMemory(true)
    await writeGlobalMemory(projectId, memoryDraft)
    setGlobalMemory(memoryDraft)
    setEditingMemory(false)
    setSavingMemory(false)
  }

  const handleExpandContract = async (info: ContractInfo) => {
    const key = info.file
    if (expandedContract === key) {
      setExpandedContract(null)
      return
    }
    setExpandedContract(key)
    if (!contractContents[key]) {
      const content = await fetchContractContent(projectId, key)
      setContractContents((prev) => ({ ...prev, [key]: content }))
    }
  }

  const renderMessage = (m: typeof MESSAGES[number], i: number) => {
    if (m.role === 'rep' && 'orig' in m && 'refined' in m) {
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

    if (m.role === 'val' && 'agent' in m && 'level' in m && 'status' in m) {
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
                GATE L{m.level} · {(m.agent as string).toUpperCase()}
              </div>
              <div style={{ fontSize: 10, color: T.t2, marginTop: 2 }}>
                {'detail' in m ? (m as { detail: string }).detail : ''}
              </div>
            </div>
            <Tag color={c}>{(m.status as string).toUpperCase()}</Tag>
          </div>
        </div>
      )
    }

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
          {m.role === 'dev'
            ? <User size={12} style={{ color: T.t3 }} />
            : m.role === 'sys'
              ? <Server size={11} style={{ color: T.t3 }} />
              : <Hexagon size={12} style={{ color: T.t2 }} />
          }
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
            {'text' in m ? m.text : ''}
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

  const rightTabs = [
    { id: 'arch', Icon: Layers },
    { id: 'mem', Icon: Database },
    { id: 'ctr', Icon: FileCode2 },
    { id: 'dag', Icon: Network },
  ]

  return (
    <div className="flex-1 flex overflow-hidden" style={{ fontFamily: T.sans }}>
      {/* Chat */}
      <div className="flex-1 flex flex-col" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="flex-1 overflow-y-auto" style={{ padding: '20px 24px' }}>
          {MESSAGES.map(renderMessage)}
          {wsMessages.map((msg, i) => (
            <div key={`ws-${i}`} className="flex gap-2 items-start" style={{ marginBottom: 18 }}>
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{ width: 24, height: 24, borderRadius: '50%', background: T.bg2, border: `1px solid ${T.bdr}` }}
              >
                <Hexagon size={12} style={{ color: T.t2 }} />
              </div>
              <div style={{ maxWidth: '78%' }}>
                <div
                  style={{
                    padding: '9px 12px', background: T.bg1, border: `1px solid ${T.bdr}`,
                    borderRadius: '2px 8px 8px 8px', fontSize: 12, color: T.t, lineHeight: 1.6, fontFamily: T.sans,
                  }}
                >
                  {msg.text}
                </div>
                <div className="font-mono" style={{ fontSize: 8.5, color: T.t3, marginTop: 3 }}>
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                </div>
              </div>
            </div>
          ))}
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
              placeholder="Describe what you want to build..."
              rows={2}
              style={{
                flex: 1, background: 'transparent', border: 'none', color: T.t,
                fontFamily: T.sans, fontSize: 12.5, resize: 'none', outline: 'none', lineHeight: 1.55,
              }}
            />
            <button
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 30, height: 30, borderRadius: 6,
                background: input.trim() ? T.t : T.bg3, border: 'none',
                cursor: input.trim() ? 'pointer' : 'default',
              }}
            >
              <ArrowUp size={14} style={{ color: T.bg }} />
            </button>
          </div>
          <div className="flex justify-between font-mono" style={{ marginTop: 5, fontSize: 8.5, color: T.t3 }}>
            <span>Reprompt engine active</span>
            <span className="flex items-center gap-1" style={{ color: T.pur }}>
              <Sparkles size={9} style={{ color: T.pur }} /> Mistral Small
            </span>
          </div>
        </div>
      </div>

      {/* Right panel */}
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

          {/* ARCH — static mock */}
          {rightTab === 'arch' && (
            <>
              <SectionHeader>Stack</SectionHeader>
              {ARCH_STACK.map(({ key, value }) => (
                <div key={key} className="flex gap-2 font-mono" style={{ marginBottom: 5, fontSize: 9.5 }}>
                  <span className="flex-shrink-0" style={{ color: T.t3, width: 35 }}>{key}</span>
                  <span style={{ color: T.t2 }}>{value}</span>
                </div>
              ))}
              <SectionHeader>Agent Tree</SectionHeader>
              <div className="flex flex-col gap-0.5">
                {AGENT_TREE.map((r, i) => (
                  <div key={i} className="flex items-center gap-1.5 font-mono" style={{ paddingLeft: r.depth * 14, fontSize: 9.5 }}>
                    <StatusIcon status={r.status} size={10} />
                    <span style={{ color: STATUS_COLORS[r.status] || T.t3 }}>{r.label}</span>
                    {r.extra && <span style={{ color: T.t3, fontSize: 8 }}>{r.extra}</span>}
                  </div>
                ))}
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
                <div className="font-mono" style={{ fontSize: 9, color: T.t3 }}>
                  No agent memories yet.
                </div>
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
                  <div className="font-mono" style={{ fontSize: 9, color: T.t3 }}>
                    No contracts yet.
                  </div>
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
                        <span className="font-mono" style={{ fontSize: 8, color: T.t3 }}>
                          {c.size}B
                        </span>
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

          {/* DAG — static mock */}
          {rightTab === 'dag' && (
            <>
              <SectionHeader>DAG</SectionHeader>
              {DAG_TASKS.map((t) => {
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
