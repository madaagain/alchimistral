const BASE = 'http://localhost:8000'

export interface AgentInfo {
  id: string
  project_id: string
  domain: string
  label: string
  status: 'pending' | 'spawning' | 'active' | 'validating' | 'done' | 'failed'
  worktree_path: string
  branch: string
  started_at: string | null
  completed_at: string | null
  validation_level: number
  output_line_count: number
  error: string | null
}

export async function listAgents(projectId?: string): Promise<AgentInfo[]> {
  const params = projectId ? `?project_id=${encodeURIComponent(projectId)}` : ''
  const r = await fetch(`${BASE}/api/agents${params}`)
  if (!r.ok) return []
  return r.json()
}

export async function getAgent(agentId: string): Promise<AgentInfo> {
  const r = await fetch(`${BASE}/api/agents/${agentId}`)
  if (!r.ok) throw new Error(`Agent not found: ${agentId}`)
  return r.json()
}

export async function killAgent(agentId: string): Promise<void> {
  const r = await fetch(`${BASE}/api/agents/${agentId}/kill`, { method: 'POST' })
  if (!r.ok) throw new Error(`Failed to kill agent: ${agentId}`)
}
