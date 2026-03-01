const BASE = 'http://localhost:8000'

export interface OrchestratorTask {
  id: string
  label: string
  agent_domain: 'frontend' | 'backend' | 'security'
  agent_type: 'parent' | 'child'
  parent_id: string | null
  dependencies: string[]
  prompt: string
}

export async function sendMission(projectId: string, message: string): Promise<void> {
  const r = await fetch(`${BASE}/api/projects/${projectId}/mission`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
  if (!r.ok) throw new Error(`Mission failed: ${r.statusText}`)
}
