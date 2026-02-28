const BASE = 'http://localhost:8000'

export interface ApiProject {
  id: string
  name: string
  source: 'clone' | 'local' | 'init'
  repo_url?: string | null
  local_path: string
  cli_adapter: string
  created_at: string
  status: 'active' | 'idle'
}

export interface CreateProjectPayload {
  name: string
  source: 'clone' | 'local' | 'init'
  repo_url?: string
  local_path?: string
  cli_adapter?: string
}

export async function listProjects(): Promise<ApiProject[]> {
  const r = await fetch(`${BASE}/api/projects`)
  if (!r.ok) throw new Error('Failed to fetch projects')
  return r.json()
}

export async function createProject(payload: CreateProjectPayload): Promise<ApiProject> {
  const r = await fetch(`${BASE}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({})) as { detail?: string }
    throw new Error(err.detail ?? 'Failed to create project')
  }
  return r.json()
}

export async function deleteProject(id: string): Promise<void> {
  const r = await fetch(`${BASE}/api/projects/${id}`, { method: 'DELETE' })
  if (!r.ok) throw new Error('Failed to delete project')
}
