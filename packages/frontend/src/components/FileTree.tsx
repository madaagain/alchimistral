import { useState, useEffect, useCallback } from 'react'
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { fetchFileTree, type FileEntry } from '../api/files'

interface FileTreeProps {
  projectId: string
}

function FileNode({ entry, projectId, depth }: { entry: FileEntry; projectId: string; depth: number }) {
  const { theme } = useTheme()
  const [expanded, setExpanded] = useState(false)
  const [children, setChildren] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(false)

  const handleToggle = useCallback(async () => {
    if (entry.type !== 'dir') return
    if (expanded) {
      setExpanded(false)
      return
    }
    setLoading(true)
    const items = await fetchFileTree(projectId, entry.path)
    setChildren(items)
    setExpanded(true)
    setLoading(false)
  }, [entry, projectId, expanded])

  const isDir = entry.type === 'dir'

  return (
    <div>
      <div
        onClick={handleToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 6px',
          paddingLeft: 6 + depth * 14,
          cursor: isDir ? 'pointer' : 'default',
          fontFamily: theme.mono,
          fontSize: 9,
          color: isDir ? theme.t2 : theme.t3,
          borderRadius: 3,
          transition: 'background 100ms ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = theme.bg2)}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        {isDir ? (
          expanded ? (
            <ChevronDown size={10} style={{ color: theme.t3, flexShrink: 0 }} />
          ) : (
            <ChevronRight size={10} style={{ color: theme.t3, flexShrink: 0 }} />
          )
        ) : (
          <span style={{ width: 10, flexShrink: 0 }} />
        )}
        {isDir ? (
          <Folder size={11} style={{ color: theme.amb, flexShrink: 0 }} />
        ) : (
          <File size={11} style={{ color: theme.t3, flexShrink: 0 }} />
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.name}
        </span>
        {loading && (
          <span style={{ color: theme.t3, fontSize: 7 }}>...</span>
        )}
      </div>
      {expanded && children.map((child) => (
        <FileNode key={child.path} entry={child} projectId={projectId} depth={depth + 1} />
      ))}
    </div>
  )
}

export default function FileTree({ projectId }: FileTreeProps) {
  const { theme } = useTheme()
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchFileTree(projectId).then((items) => {
      setEntries(items)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [projectId])

  return (
    <div style={{ padding: '8px 0' }}>
      <div
        className="font-mono"
        style={{
          fontSize: 8,
          fontWeight: 600,
          letterSpacing: 2,
          color: theme.t3,
          padding: '4px 10px 8px',
        }}
      >
        FILES
      </div>
      {loading ? (
        <div className="font-mono" style={{ fontSize: 9, color: theme.t3, padding: '4px 10px' }}>
          Loading...
        </div>
      ) : entries.length === 0 ? (
        <div className="font-mono" style={{ fontSize: 9, color: theme.t3, padding: '4px 10px' }}>
          No files
        </div>
      ) : (
        entries.map((entry) => (
          <FileNode key={entry.path} entry={entry} projectId={projectId} depth={0} />
        ))
      )}
    </div>
  )
}
