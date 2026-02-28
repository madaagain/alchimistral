const BASE = 'http://localhost:8000'

export interface ContractInfo {
  file: string
  size: number
  modified: number
}

export async function fetchGlobalMemory(projectId: string): Promise<string> {
  const r = await fetch(`${BASE}/api/projects/${projectId}/memory/global`)
  if (!r.ok) return ''
  const data = await r.json() as { content: string }
  return data.content
}

export async function writeGlobalMemory(projectId: string, content: string): Promise<void> {
  await fetch(`${BASE}/api/projects/${projectId}/memory/global`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}

export async function fetchAgentMemories(projectId: string): Promise<string[]> {
  const r = await fetch(`${BASE}/api/projects/${projectId}/memory/agents`)
  if (!r.ok) return []
  return r.json()
}

export async function fetchContracts(projectId: string): Promise<ContractInfo[]> {
  const r = await fetch(`${BASE}/api/projects/${projectId}/contracts`)
  if (!r.ok) return []
  return r.json()
}

export async function fetchContractContent(projectId: string, fileName: string): Promise<string> {
  const r = await fetch(`${BASE}/api/projects/${projectId}/contracts/${fileName}`)
  if (!r.ok) return ''
  const data = await r.json() as { content: string }
  return data.content
}
