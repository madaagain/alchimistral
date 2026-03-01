const BASE = 'http://localhost:8000'

export interface FileEntry {
  name: string
  type: 'file' | 'dir'
  path: string
  children?: FileEntry[]
}

export async function fetchFileTree(projectId: string, path: string = ''): Promise<FileEntry[]> {
  const r = await fetch(`${BASE}/api/projects/${projectId}/files?path=${encodeURIComponent(path)}`)
  if (!r.ok) return []
  return r.json()
}
