const BASE = 'http://localhost:8000'

export interface ApiKeys {
  mistral_api_key: string
}

export async function getKeys(): Promise<ApiKeys> {
  const r = await fetch(`${BASE}/api/settings/keys`)
  if (!r.ok) throw new Error('Failed to fetch keys')
  return r.json()
}

export async function updateKeys(keys: { mistral_api_key?: string }): Promise<void> {
  const r = await fetch(`${BASE}/api/settings/keys`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(keys),
  })
  if (!r.ok) throw new Error('Failed to update keys')
}
