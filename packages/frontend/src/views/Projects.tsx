import { useState, useEffect } from 'react'
import {
  Plus,
  GitBranch,
  FolderOpen,
  Zap,
  Bot,
  Clock,
  Terminal,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { listProjects, createProject, deleteProject, type ApiProject } from '../api/projects'

type SourceMode = 'clone' | 'local' | 'init'

interface ProjectsProps {
  onSelect: (project: ApiProject) => void
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function Projects({ onSelect }: ProjectsProps) {
  const { theme } = useTheme()
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [mode, setMode] = useState<SourceMode>('clone')
  const [name, setName] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [localPath, setLocalPath] = useState('')

  const load = async () => {
    try {
      setError(null)
      const data = await listProjects()
      setProjects(data)
    } catch {
      setError('Could not reach backend. Is it running on :8000?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)
    setCreateError(null)
    try {
      const p = await createProject({
        name: name.trim(),
        source: mode,
        repo_url: mode === 'clone' ? repoUrl.trim() : undefined,
        local_path: mode !== 'clone' ? localPath.trim() : undefined,
        cli_adapter: 'vibe',
      })
      setProjects((prev) => [p, ...prev])
      setShowCreate(false)
      setName('')
      setRepoUrl('')
      setLocalPath('')
      onSelect(p)
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      await deleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch {
      // silent
    }
  }

  const sourceTabs: { mode: SourceMode; label: string; Icon: typeof GitBranch }[] = [
    { mode: 'clone', label: 'Clone repo', Icon: GitBranch },
    { mode: 'local', label: 'Local dir', Icon: FolderOpen },
    { mode: 'init', label: 'Init new', Icon: Plus },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ fontFamily: theme.sans }}>
      <div
        className="flex-1 overflow-y-auto"
        style={{ maxWidth: 700, margin: '0 auto', width: '100%', padding: '40px 24px' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center" style={{ marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: theme.t }}>Projects</div>
            <div style={{ fontSize: 12, color: theme.t3, marginTop: 4 }}>
              Each project links to a repo. Agents work inside.
            </div>
          </div>
          <button
            onClick={() => { setShowCreate(!showCreate); setCreateError(null) }}
            className="flex items-center gap-1.5"
            style={{
              padding: '8px 16px',
              background: theme.t,
              color: theme.bg,
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: theme.sans,
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
              background: theme.bg1,
              border: `1px solid ${theme.bdr}`,
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.t, marginBottom: 16 }}>
              Create Project
            </div>

            <div className="flex gap-2" style={{ marginBottom: 14 }}>
              {sourceTabs.map((o) => (
                <button
                  key={o.mode}
                  onClick={() => setMode(o.mode)}
                  className="flex-1 flex items-center justify-center gap-1.5"
                  style={{
                    padding: 10,
                    background: mode === o.mode ? theme.bg3 : theme.bg2,
                    border: `1px solid ${mode === o.mode ? theme.bdr : theme.bdr}`,
                    borderRadius: 6,
                    color: mode === o.mode ? theme.t : theme.t3,
                    fontSize: 11,
                    cursor: 'pointer',
                    fontFamily: theme.sans,
                  }}
                >
                  <o.Icon size={13} /> {o.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2.5">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
                style={{
                  padding: '9px 12px',
                  background: theme.bg,
                  border: `1px solid ${theme.bdr}`,
                  borderRadius: 5,
                  color: theme.t,
                  fontFamily: theme.sans,
                  fontSize: 12,
                  outline: 'none',
                }}
              />

              {mode === 'clone' ? (
                <input
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/user/repo.git"
                  style={{
                    padding: '9px 12px',
                    background: theme.bg,
                    border: `1px solid ${theme.bdr}`,
                    borderRadius: 5,
                    color: theme.t,
                    fontFamily: theme.mono,
                    fontSize: 11,
                    outline: 'none',
                  }}
                />
              ) : (
                <input
                  value={localPath}
                  onChange={(e) => setLocalPath(e.target.value)}
                  placeholder={mode === 'local' ? '/absolute/path/to/project' : '/absolute/path/to/new-project'}
                  style={{
                    padding: '9px 12px',
                    background: theme.bg,
                    border: `1px solid ${theme.bdr}`,
                    borderRadius: 5,
                    color: theme.t,
                    fontFamily: theme.mono,
                    fontSize: 11,
                    outline: 'none',
                  }}
                />
              )}

              <div className="flex gap-2 items-center">
                <span className="flex items-center gap-1 font-mono" style={{ fontSize: 10, color: theme.t3 }}>
                  <Terminal size={11} /> CLI:
                </span>
                {['Vibe CLI', 'Claude Code', 'Codex'].map((a, i) => (
                  <span
                    key={a}
                    className="font-mono"
                    style={{
                      padding: '3px 8px',
                      borderRadius: 3,
                      background: i === 0 ? theme.blu + '20' : theme.bg2,
                      border: `1px solid ${i === 0 ? theme.blu + '44' : theme.bdr}`,
                      color: i === 0 ? theme.blu : theme.t3,
                      fontSize: 9,
                      opacity: i === 0 ? 1 : 0.4,
                    }}
                  >
                    {a}{i > 0 && ' (soon)'}
                  </span>
                ))}
              </div>

              {createError && (
                <div
                  className="flex items-center gap-2 font-mono"
                  style={{
                    padding: '8px 10px',
                    background: theme.red + '10',
                    border: `1px solid ${theme.red}33`,
                    borderRadius: 4,
                    fontSize: 10,
                    color: theme.red,
                  }}
                >
                  <AlertCircle size={12} /> {createError}
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={creating || !name.trim()}
                className="flex items-center justify-center gap-1.5"
                style={{
                  padding: 10,
                  background: creating || !name.trim() ? theme.bg3 : theme.t,
                  color: creating || !name.trim() ? theme.t3 : theme.bg,
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: creating || !name.trim() ? 'default' : 'pointer',
                  fontFamily: theme.sans,
                }}
              >
                {creating ? (
                  <><Loader2 size={14} /> Creating...</>
                ) : mode === 'clone' ? (
                  <><GitBranch size={14} /> Clone & Create</>
                ) : mode === 'local' ? (
                  <><FolderOpen size={14} /> Link & Create</>
                ) : (
                  <><Plus size={14} /> Init & Create</>
                )}
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 font-mono" style={{ fontSize: 11, color: theme.t3 }}>
            <Loader2 size={14} /> Loading projects...
          </div>
        )}

        {error && (
          <div
            className="flex items-center gap-2 font-mono"
            style={{
              padding: '10px 14px',
              background: theme.amb + '10',
              border: `1px solid ${theme.amb}33`,
              borderRadius: 6,
              fontSize: 11,
              color: theme.amb,
              marginBottom: 16,
            }}
          >
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div
            style={{
              padding: '32px 24px',
              background: theme.bg1,
              border: `1px solid ${theme.bdr}`,
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            <FolderOpen size={28} style={{ color: theme.t3, margin: '0 auto 12px' }} />
            <div style={{ fontSize: 13, color: theme.t2, marginBottom: 4 }}>No projects yet</div>
            <div style={{ fontSize: 11, color: theme.t3 }}>
              Click "New Project" to clone a repo or link a local directory.
            </div>
          </div>
        )}

        {projects.map((p) => (
          <div
            key={p.id}
            onClick={() => onSelect(p)}
            className="flex items-center gap-3.5 cursor-pointer group"
            style={{
              padding: '16px 18px',
              background: theme.bg1,
              border: `1px solid ${theme.bdr}`,
              borderRadius: 8,
              marginBottom: 10,
              position: 'relative',
              transition: 'border-color 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.t3)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = theme.bdr)}
          >
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: p.status === 'active' ? theme.blu + '15' : theme.bg2,
                border: `1px solid ${p.status === 'active' ? theme.blu + '33' : theme.bdr}`,
              }}
            >
              {p.status === 'active' ? (
                <Zap size={16} style={{ color: theme.blu }} />
              ) : (
                <FolderOpen size={16} style={{ color: theme.t3 }} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 14, fontWeight: 600, color: theme.t, marginBottom: 2 }}>
                {p.name}
              </div>
              <div
                className="font-mono truncate"
                style={{ fontSize: 10, color: theme.t3 }}
              >
                {p.repo_url ?? p.local_path}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <div className="flex gap-2 font-mono" style={{ fontSize: 9 }}>
                <span className="flex items-center gap-1" style={{ color: theme.t3 }}>
                  <Bot size={10} /> 0
                </span>
                <span
                  className="font-mono"
                  style={{
                    padding: '1px 5px',
                    borderRadius: 2,
                    background: theme.bg2,
                    border: `1px solid ${theme.bdr}`,
                    color: theme.t3,
                    fontSize: 8,
                  }}
                >
                  {p.source}
                </span>
              </div>
              <span className="flex items-center gap-1 font-mono" style={{ fontSize: 8.5, color: theme.t3 }}>
                <Clock size={9} /> {timeAgo(p.created_at)}
              </span>
            </div>

            <button
              onClick={(e) => handleDelete(e, p.id)}
              className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                position: 'absolute',
                right: 12,
                top: 12,
                width: 24,
                height: 24,
                background: 'transparent',
                border: `1px solid ${theme.red}33`,
                borderRadius: 4,
                cursor: 'pointer',
              }}
              title="Delete project"
            >
              <Trash2 size={11} style={{ color: theme.red }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
