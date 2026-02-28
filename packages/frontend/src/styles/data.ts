/** Static mock data for M1 — matches prototype exactly */

export interface Project {
  id: string
  name: string
  repo: string
  status: string
  agents: number
  active: number
  branches: number
  lastActivity: string
}

export const PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Data Annotation Tool',
    repo: 'github.com/team/data-annotator',
    status: 'active',
    agents: 5,
    active: 3,
    branches: 7,
    lastActivity: '2 min ago',
  },
  {
    id: 'p2',
    name: 'Analytics Dashboard',
    repo: 'github.com/team/analytics-dash',
    status: 'idle',
    agents: 3,
    active: 0,
    branches: 4,
    lastActivity: '1h ago',
  },
  {
    id: 'p3',
    name: 'Mobile API Gateway',
    repo: 'github.com/team/api-gateway',
    status: 'idle',
    agents: 0,
    active: 0,
    branches: 1,
    lastActivity: '3d ago',
  },
]

export interface AgentNode {
  id: string
  type: 'orch' | 'parent' | 'child' | 'sec'
  x: number
  y: number
  label: string
  sub: string
  status: string
  tokens: string
  progress: number | null
  task: string
  children: string[]
  branch: string | null
  skills: string[]
  validation: { level: number; status: string; result: string } | null
  worktree: string | null
}

export const NODES: AgentNode[] = [
  {
    id: 'orch',
    type: 'orch',
    x: 420,
    y: 100,
    label: 'Orchestrator',
    sub: 'mistral-large · coordination',
    status: 'active',
    tokens: '14.2k',
    progress: null,
    task: 'Decomposing mission into DAG. Generating contracts.',
    children: ['fe', 'be', 'sec'],
    branch: null,
    skills: [],
    validation: null,
    worktree: null,
  },
  {
    id: 'fe',
    type: 'parent',
    x: 80,
    y: 340,
    label: 'Frontend Agent',
    sub: 'vibe cli · devstral-2 · worktree',
    status: 'active',
    tokens: '9.1k',
    progress: 61,
    task: 'Building React components. Reading api-schema.json.',
    children: ['fa', 'fd', 'fm'],
    branch: 'agent/frontend-001',
    skills: ['CodeStyle', 'Zustand', 'Tailwind'],
    validation: { level: 1, status: 'pending', result: 'npm build — pass' },
    worktree: '.worktrees/agent-fe-001/',
  },
  {
    id: 'be',
    type: 'parent',
    x: 500,
    y: 340,
    label: 'Backend Agent',
    sub: 'vibe cli · devstral-2 · worktree',
    status: 'review',
    tokens: '11.3k',
    progress: 89,
    task: 'API complete. Wrote contract. Awaiting gate L2.',
    children: ['ba', 'bd'],
    branch: 'agent/backend-002',
    skills: ['CodeStyle', 'FastAPI', 'PostgreSQL'],
    validation: { level: 2, status: 'running', result: 'pytest 14/14 pass' },
    worktree: '.worktrees/agent-be-002/',
  },
  {
    id: 'sec',
    type: 'sec',
    x: 900,
    y: 340,
    label: 'Security Agent',
    sub: 'vibe cli · transversal',
    status: 'idle',
    tokens: '1.8k',
    progress: null,
    task: 'Standby. Invoke via Security Scan.',
    children: [],
    branch: null,
    skills: ['OWASP', 'SecretScan'],
    validation: null,
    worktree: null,
  },
  {
    id: 'fa',
    type: 'child',
    x: 0,
    y: 580,
    label: 'Auth UI',
    sub: 'child of fe · worktree',
    status: 'done',
    tokens: '3.4k',
    progress: 100,
    task: 'OAuth2 login + signup. Gate L2 passed. Merged.',
    children: [],
    branch: 'agent/fe-001/auth-ui',
    skills: ['Zustand'],
    validation: { level: 2, status: 'pass', result: 'npm test 8/8 · build OK' },
    worktree: '.worktrees/fe-auth/',
  },
  {
    id: 'fd',
    type: 'child',
    x: 220,
    y: 580,
    label: 'Dashboard',
    sub: 'child of fe · worktree',
    status: 'active',
    tokens: '5.1k',
    progress: 43,
    task: 'Metric cards + sidebar. WebSocket in progress.',
    children: [],
    branch: 'agent/fe-001/dashboard',
    skills: ['Tailwind'],
    validation: { level: 1, status: 'pending', result: 'build pass' },
    worktree: '.worktrees/fe-dash/',
  },
  {
    id: 'fm',
    type: 'child',
    x: 440,
    y: 580,
    label: 'Responsive',
    sub: 'blocked — depends on dashboard',
    status: 'blocked',
    tokens: '—',
    progress: 0,
    task: 'Blocked. Waiting for dashboard (DAG dep).',
    children: [],
    branch: null,
    skills: ['Tailwind'],
    validation: null,
    worktree: null,
  },
  {
    id: 'ba',
    type: 'child',
    x: 620,
    y: 580,
    label: 'Auth API',
    sub: 'child of be · worktree',
    status: 'done',
    tokens: '5.8k',
    progress: 100,
    task: '/auth/login + /auth/refresh. Gate L3 passed.',
    children: [],
    branch: 'agent/be-002/auth-api',
    skills: ['FastAPI', 'JWT'],
    validation: { level: 3, status: 'pass', result: 'integration merge clean' },
    worktree: '.worktrees/be-auth/',
  },
  {
    id: 'bd',
    type: 'child',
    x: 840,
    y: 580,
    label: 'DB Schema',
    sub: 'child of be · worktree',
    status: 'active',
    tokens: '4.2k',
    progress: 58,
    task: 'users, sessions, refresh_tokens. Alembic 60%.',
    children: [],
    branch: 'agent/be-002/db',
    skills: ['PostgreSQL'],
    validation: { level: 1, status: 'pending', result: 'pytest 6/6 pass' },
    worktree: '.worktrees/be-db/',
  },
]

export const EDGES = [
  { from: 'orch', to: 'fe' },
  { from: 'orch', to: 'be' },
  { from: 'orch', to: 'sec' },
  { from: 'fe', to: 'fa' },
  { from: 'fe', to: 'fd' },
  { from: 'fe', to: 'fm' },
  { from: 'be', to: 'ba' },
  { from: 'be', to: 'bd' },
]

export const DAG_TASKS = [
  { id: 't1', label: 'Backend API schema', agent: 'be', status: 'done', deps: [] },
  { id: 't2', label: 'Auth API endpoints', agent: 'ba', status: 'done', deps: ['t1'] },
  { id: 't3', label: 'DB migrations', agent: 'bd', status: 'active', deps: ['t1'] },
  { id: 't4', label: 'Write contract', agent: 'be', status: 'done', deps: ['t2'] },
  { id: 't5', label: 'Frontend auth UI', agent: 'fa', status: 'done', deps: ['t4'] },
  { id: 't6', label: 'Dashboard', agent: 'fd', status: 'active', deps: ['t4'] },
  { id: 't7', label: 'Responsive', agent: 'fm', status: 'blocked', deps: ['t6'] },
  { id: 't8', label: 'Security audit', agent: 'sec', status: 'idle', deps: ['t2', 't5'] },
]

export const CONTRACTS = [
  {
    file: 'api-schema.json',
    author: 'be',
    readers: ['fe', 'fa', 'fd'],
    ago: '2m',
    code: '{\n  "POST /auth/login": {\n    "body": {"email":"str","password":"str"},\n    "response": {"access_token":"str"}\n  }\n}',
  },
  {
    file: 'types.d.ts',
    author: 'orch',
    readers: ['fe', 'be'],
    ago: '8m',
    code: 'interface User {\n  id: string;\n  email: string;\n  name: string;\n}\ninterface Session {\n  token: string;\n  user_id: string;\n}',
  },
]

export const WORKTREES = [
  { branch: 'main', status: 'clean', agent: null },
  { branch: 'integration', status: '2 pending', agent: 'orch' },
  { branch: 'agent/frontend-001', status: '+14 files', agent: 'fe' },
  { branch: 'agent/backend-002', status: '+8 files', agent: 'be' },
  { branch: 'agent/fe-001/auth-ui', status: 'merged', agent: 'fa' },
  { branch: 'agent/fe-001/dashboard', status: '+6 files', agent: 'fd' },
  { branch: 'agent/be-002/auth-api', status: 'merged', agent: 'ba' },
  { branch: 'agent/be-002/db', status: '+3 files', agent: 'bd' },
]

export const MESSAGES = [
  { role: 'sys' as const, text: 'Alchemistral v0.1 — Session started.', ts: '09:12:00' },
  {
    role: 'rep' as const,
    orig: 'make auth work with google',
    refined: 'Implement OAuth2 with Google. JWT + refresh rotation. Frontend login/signup. Backend /auth/login, /auth/refresh with PostgreSQL.',
    ts: '09:12:15',
  },
  {
    role: 'orch' as const,
    text: 'Repository analyzed:\n— React 18 + Vite + TS\n— FastAPI + PostgreSQL\n— Monorepo\n\nDAG:\n  t1: Backend schema → no deps\n  t2: Auth API → t1\n  t4: Contract → t2\n  t5: FE auth → t4\n  t6: Dashboard → t4\n\nSpawning worktrees...',
    ts: '09:12:18',
  },
  {
    role: 'orch' as const,
    text: 'Worktrees:\n  .worktrees/agent-fe-001/ → agent/frontend-001\n  .worktrees/agent-be-002/ → agent/backend-002\n\nContract: .alchemistral/contracts/types.d.ts\n\nVibe CLI launching...',
    ts: '09:12:22',
  },
  {
    role: 'dev' as const,
    text: 'Use Zustand for state. Tailwind for styling.',
    ts: '09:13:20',
  },
  {
    role: 'orch' as const,
    text: 'Global memory updated:\n— Zustand (no Redux)\n— Tailwind CSS\n— All FE agents inherit.\n\nSkills: CodeStyle + Zustand + Tailwind → fe agents',
    ts: '09:13:22',
  },
  {
    role: 'val' as const,
    agent: 'ba',
    level: 2,
    status: 'pass',
    detail: 'pytest 14/14 · build OK · no secrets',
    ts: '09:18:44',
  },
  {
    role: 'val' as const,
    agent: 'fa',
    level: 2,
    status: 'pass',
    detail: 'npm test 8/8 · build OK',
    ts: '09:19:02',
  },
  {
    role: 'orch' as const,
    text: 'ba + fa passed Gate L2.\nMerging to parent branches.\nContract updated.\nfd can proceed.',
    ts: '09:19:10',
  },
]

export const MEMORY_ITEMS = [
  'React 18 + TS (strict)',
  'Zustand — no Redux',
  'Tailwind CSS',
  'OAuth2 + JWT + refresh',
  'FastAPI + PostgreSQL',
  'PEP8 + pytest',
  'Alembic migrations',
  'Contracts in .alchemistral/contracts/',
]

export const ARCH_STACK = [
  { key: 'FE', value: 'React 18+TS+Zustand+Tailwind' },
  { key: 'BE', value: 'FastAPI+PostgreSQL+Alembic' },
  { key: 'Auth', value: 'OAuth2+JWT refresh' },
  { key: 'CLI', value: 'Vibe CLI (Devstral 2)' },
]

export const AGENT_TREE = [
  { label: 'Orchestrator', status: 'active', depth: 0, extra: 'Mistral Large' },
  { label: 'Frontend', status: 'active', depth: 1, extra: '61%' },
  { label: 'fe/auth-ui', status: 'done', depth: 2, extra: 'merged' },
  { label: 'fe/dashboard', status: 'active', depth: 2, extra: '43%' },
  { label: 'fe/responsive', status: 'blocked', depth: 2 },
  { label: 'Backend', status: 'review', depth: 1, extra: '89%' },
  { label: 'be/auth-api', status: 'done', depth: 2, extra: 'merged' },
  { label: 'be/db-schema', status: 'active', depth: 2, extra: '58%' },
  { label: 'Security', status: 'idle', depth: 1, extra: 'standby' },
]
