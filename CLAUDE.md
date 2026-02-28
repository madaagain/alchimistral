# Alchemistral — CLAUDE.md
# Context file for Claude Code. Read this entirely before every session.
# Last updated: hackathon day — Feb 28, 2026

---

## What is Alchemistral

Alchemistral is a professional multi-agent orchestration platform for software engineers.
Not a vibe coding tool for non-coders. Not a Claude Code competitor.
An orchestrator that runs multiple coding agent CLI instances in parallel —
each owning a domain, each with isolated memory, skills, and its own Git worktree.

**One-liner:** "You run one Claude Code. Alchemistral runs a team."

**Pattern:** Entity Component System (ECS) applied to AI agents.
- Entity = Agent (orchestrator, parent, child)
- Component = Skill (stripe docs, figma, code style, library context)
- System = Memory + Router + TodoList + ValidationGate

**Stack:**
- Frontend: React + Vite + Tailwind (existing UI in packages/frontend)
- Backend: FastAPI + Python 3.11 + asyncio
- Real-time: WebSocket — one stream per agent, tagged by agent_id
- LLM Orchestrator: Mistral Large via Mistral API
- LLM Agents: Vibe CLI (Devstral 2, 123B) — spawned as subprocesses
- Reprompt engine: Mistral Small via API — reformulates dev input
- Memory: .alchemistral/ directory in user's project (markdown files)
- Git: gitpython — git worktree per agent, isolated filesystem
- CLI Adapter: Pluggable interface (V1 = VibeCLIAdapter)

---

## Critical Architecture Decisions

### 1. Orchestrator = Mistral Large API / Agents = Vibe CLI (Devstral 2)
The orchestrator is a reasoning engine — it decomposes, routes, coordinates.
It calls Mistral Large via the API. It NEVER writes code.

Agents are execution engines — they read, write, test code.
They are Vibe CLI instances spawned as subprocesses in `--prompt --auto-approve` mode.
Devstral 2 (123B) has native filesystem tools (bash, read_file, write_file, grep, search_replace).
We don't need to reimplement any of that — Vibe CLI handles it.

Why not Mistral Large for agents? Because Mistral Large via API has no filesystem tools.
We'd have to build the entire tool layer ourselves. Vibe CLI has it built-in.

### 2. Git Worktrees — Not Branches
Each agent gets a git worktree, NOT just a branch.
A worktree = a separate directory on disk, checked out to its own branch.
All worktrees share the same .git history (no cloning overhead).
This means multiple agents can read/write files in parallel with ZERO filesystem conflicts.

```
project-repo/
├── .worktrees/
│   ├── agent-frontend-001/    ← worktree → branch agent/frontend-001
│   ├── agent-backend-002/     ← worktree → branch agent/backend-002
│   └── agent-infra-003/       ← worktree → branch agent/infra-003
├── .alchemistral/               ← shared memory (on main)
└── src/                       ← main branch code (untouched by agents)
```

Worktree creation:
```bash
git worktree add .worktrees/agent-frontend-001 -b agent/frontend-001
```

### 3. Validation Gate — Agents Must Build Before Merge
This is what prevents "5 agents building 5 broken things".
Three levels of validation:

**Level 1 — Agent self-test:** Each Vibe CLI prompt includes the instruction
"Run tests and verify the build passes before reporting DONE."
Vibe has bash tool — it can run `npm test`, `pytest`, etc.

**Level 2 — Orchestrator validation:** When agent reports DONE,
the backend runs `make validate` (or equivalent) in the agent's worktree.
If it fails → agent gets the error and retries.

**Level 3 — Integration test:** Before merging into `integration` branch,
the orchestrator does a test merge, runs full build.
If it passes → real merge. If not → identifies conflict and re-dispatches.

### 4. Shared Context Protocol — How Agents Stay Coherent
Agents don't talk to each other directly. The orchestrator ensures coherence:

**Architecture Document:** `.alchemistral/architecture.json` defines interfaces,
API contracts, data models. Every agent reads this. Only orchestrator writes it.

**Dependency Graph (DAG):** The orchestrator maintains task dependencies.
Independent tasks run in parallel. Dependent tasks wait.
Example: backend-API must finish before frontend can consume it.

**Contract Files:** Agents write their interfaces to `.alchemistral/contracts/`
(OpenAPI specs, TypeScript types). Dependent agents read these before starting.

### 5. CLI Plugin System — Pluggable Agent Runtime
The backend doesn't call Vibe CLI directly. It calls a CLIAdapter interface.
V1 = VibeCLIAdapter. But the architecture supports any CLI coding agent.

```python
class CLIAdapter(ABC):
    """Interface for pluggable CLI coding agents"""
    name: str
    
    @abstractmethod
    async def spawn(self, worktree_path: str, prompt: str, config: AgentConfig) -> AgentProcess: ...
    
    @abstractmethod
    async def stream_output(self) -> AsyncIterator[AgentEvent]: ...
    
    @abstractmethod
    async def is_complete(self) -> bool: ...
    
    @abstractmethod
    async def kill(self): ...

# Registry
CLI_REGISTRY = {
    "vibe": VibeCLIAdapter,       # V1 — hackathon
    # "claude-code": ClaudeCodeAdapter,  # future
    # "codex": CodexAdapter,             # future
}
```

VibeCLIAdapter spawns:
```python
async def spawn(self, worktree_path, prompt, config):
    self.proc = await asyncio.create_subprocess_exec(
        "vibe", "--prompt", prompt,
        "--auto-approve",
        "--max-turns", str(config.max_turns or 50),
        "--max-price", str(config.max_price or 5.0),
        cwd=worktree_path,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
```

### 6. Project Manager — Named Projects Linked to Repos
Users create named projects in Alchemistral, each linked to a local directory or remote repo.

```json
// ~/.alchemistral/projects/data-annotator.json
{
  "name": "Data Annotation Tool",
  "source": "clone",
  "repo_url": "https://github.com/user/data-annotator",
  "local_path": "/Users/dev/projects/data-annotator",
  "cli_adapter": "vibe",
  "agents": [],
  "created_at": "2026-02-28T10:00:00Z"
}
```

API:
- POST /api/projects — create (clone, local, or init)
- GET /api/projects — list all
- GET /api/projects/{id} — get with agent status
- DELETE /api/projects/{id} — cleanup worktrees + branches

---

## Architecture — File Structure

```
alchemistral/
├── CLAUDE.md                      ← this file
├── packages/
│   ├── frontend/
│   │   └── src/
│   │       ├── App.jsx            ← Router: Room / Lab / Projects
│   │       ├── projects/
│   │       │   ├── ProjectList.jsx  ← Project selector + create
│   │       │   └── ProjectCreate.jsx← Clone/local/init form
│   │       ├── room/
│   │       │   ├── Chat.jsx       ← Orchestrator chat + reprompt display
│   │       │   ├── UML.jsx        ← Interactive architecture diagram
│   │       │   ├── TodoGlobal.jsx ← Global todolist (orchestrator writes)
│   │       │   └── Memory.jsx     ← Global memory viewer
│   │       ├── lab/
│   │       │   ├── Canvas.jsx     ← Infinite canvas — draggable agent nodes
│   │       │   ├── AgentNode.jsx  ← Node: status, skills, progress, todo, stream
│   │       │   ├── Inspector.jsx  ← Per-agent: chat, skills, memory, todo
│   │       │   └── WorkingTree.jsx← Git working tree — branches, merge status
│   │       └── hooks/
│   │           ├── useWebSocket.js
│   │           ├── useAgents.js
│   │           └── useProject.js
│   └── backend/
│       ├── main.py                ← FastAPI + WebSocket hub
│       ├── orchestrator/
│       │   ├── core.py            ← Mistral Large — decomposes, routes, compiles
│       │   ├── reprompt.py        ← Mistral Small — reformulates dev input
│       │   ├── memory.py          ← Reads/writes .alchemistral/ files
│       │   ├── router.py          ← Routes tasks to correct agents
│       │   ├── dag.py             ← Dependency graph — task ordering
│       │   ├── validator.py       ← Validation Gate — 3 levels
│       │   └── todo.py            ← Global todolist management
│       ├── agents/
│       │   ├── base.py            ← BaseAgent class — ECS pattern
│       │   ├── manager.py         ← Agent lifecycle: spawn → assign → execute → validate → merge
│       │   ├── frontend.py        ← Frontend parent agent config
│       │   ├── backend.py         ← Backend parent agent config
│       │   ├── infra.py           ← Infra/DevOps agent config
│       │   └── security.py        ← Security transversal agent config
│       ├── cli/
│       │   ├── adapter.py         ← CLIAdapter ABC
│       │   ├── vibe.py            ← VibeCLIAdapter — subprocess spawn
│       │   └── registry.py        ← CLI_REGISTRY
│       ├── skills/
│       │   ├── base.py            ← BaseSkill class
│       │   ├── code_style.py      ← CodeStyleSkill
│       │   ├── library.py         ← LibrarySkill
│       │   ├── stripe.py          ← StripeSkill
│       │   └── figma.py           ← FigmaSkill
│       ├── git/
│       │   ├── worktree.py        ← Worktree manager — create, list, cleanup
│       │   ├── merger.py          ← Merge strategy — agent → integration → main
│       │   └── integration.py     ← gitpython — branches, working tree detection
│       ├── projects/
│       │   ├── manager.py         ← ProjectManager — CRUD projects
│       │   └── models.py          ← Project, AgentConfig pydantic models
│       └── uml/
│           └── schema.py          ← JSON schema for architecture diagram
```

---

## Memory System

When a user opens a project, Alchemistral creates:

```
user-project/
├── .alchemistral/
│   ├── GLOBAL.md          ← Stack, conventions, architectural decisions
│   ├── architecture.json  ← Architecture state — editable by human + orchestrator
│   ├── contracts/         ← Shared interfaces between agents
│   │   ├── api-schema.json    ← OpenAPI spec (backend writes, frontend reads)
│   │   └── types.d.ts         ← Shared TypeScript types
│   ├── agents/
│   │   ├── frontend.md    ← Frontend domain memory
│   │   ├── backend.md     ← Backend domain memory
│   │   ├── infra.md       ← Infra domain memory
│   │   └── security.md    ← Security findings
│   ├── todos.json         ← Global + per-agent todolists
│   └── decisions.log      ← Append-only log of architectural decisions
```

**Memory injection rules:**
- Every agent reads GLOBAL.md + architecture.json at the start of every prompt
- Every agent reads its own domain memory file
- Every agent reads relevant contract files (e.g., frontend reads api-schema.json)
- Child agents also read their parent's memory
- Only orchestrator writes to GLOBAL.md and architecture.json
- Parent agents write to their domain memory
- Child agents write nothing — parent merges their output

---

## TodoList System

**Global todo** — written by orchestrator, visible in Room sidebar.
Orchestrator decomposes the dev's request into tasks and writes them here.
Dev checks items manually when satisfied with the output.

**Agent todo** — each agent has its own todo list, visible on its canvas node.
Agent writes its own subtasks. Checks them as it completes them.
When all agent todos are checked → triggers Validation Gate.

**Schema:**
```json
{
  "global": [
    { "id": "g1", "text": "Implement OAuth2 auth flow", "done": false,
      "assigned_to": ["fe-parent", "be-parent"],
      "depends_on": [] }
  ],
  "agents": {
    "fe-auth": [
      { "id": "a1", "text": "Build login form component", "done": true },
      { "id": "a2", "text": "Implement OAuth2 redirect flow", "done": false }
    ]
  }
}
```

---

## ECS Pattern — Skills

A skill is a context block injected into an agent's system prompt.
Skills are attached per-agent. They do not affect other agents.

```python
class BaseSkill:
    name: str
    context: str          # injected into system prompt
    tools: list           # optional — extra tools this skill provides

# Examples
CodeStyleSkill(max_function_lines=20)
LibrarySkill(name="shadcn", docs_url="...")
StripeSkill()             # injects Stripe auth UI patterns
FigmaSkill(file_url="...")
```

Skills are visible as badges on agent nodes in the Lab canvas.
Dev can attach/detach skills from the Inspector panel.

---

## Orchestrator — The Compiler

The orchestrator is not a chatbot. It is a compiler.
It takes human input (imprecise, incomplete) and outputs
precise task assignments for each agent.

**Reprompt flow:**
```
Dev types → Mistral Small reformulates → shows diff to dev
→ dev approves → Mistral Large orchestrates
→ DAG created → agents scheduled → worktrees created → Vibe CLI spawned
```

**Orchestrator system prompt template:**
```
You are Alchemistral's Orchestrator.
You are a staff engineer who thinks in systems, not a chatbot.

Your responsibilities:
1. Read GLOBAL.md and architecture.json before responding
2. Decompose the developer's request into atomic agent tasks
3. Build a dependency graph (DAG) — which tasks can run in parallel, which must wait
4. Update the global todolist with new tasks
5. Assign tasks to the correct domain agents with precise prompts
6. Write contract files (.alchemistral/contracts/) for cross-agent interfaces
7. Update GLOBAL.md when architectural decisions are made
8. Never write code yourself — coordinate only
9. After each agent completes, run Validation Gate before allowing merge

Current global memory:
{GLOBAL.md}

Current architecture:
{architecture.json}

Current contracts:
{contracts/}

Current todos:
{todos.json}

Available agents:
{agent_list}

Available CLI adapter:
{cli_adapter_name}
```

---

## Agent System Prompts

Each agent prompt is built dynamically and passed to Vibe CLI via --prompt.
The prompt includes: role definition, domain boundary, memory, contracts, skills, task.

**Frontend Agent:**
```
You are Alchemistral's Frontend Agent working in this directory.
You own all frontend code. Never touch backend or infra files.

Read these files first:
- .alchemistral/GLOBAL.md (conventions)
- .alchemistral/agents/frontend.md (your domain state)
- .alchemistral/contracts/api-schema.json (backend API you consume)

Your active skills: {skills}
Your current todos: {agent_todos}

YOUR TASK:
{task}

RULES:
1. After every significant change, run the build: npm run build
2. After completing your task, run tests: npm test
3. Only report DONE if build AND tests pass
4. Update .alchemistral/agents/frontend.md with what you did
```

**Backend Agent:**
```
You are Alchemistral's Backend Agent working in this directory.
You own all backend code. Never touch frontend or infra files.

Read these files first:
- .alchemistral/GLOBAL.md (conventions)
- .alchemistral/agents/backend.md (your domain state)

Your active skills: {skills}
Your current todos: {agent_todos}

YOUR TASK:
{task}

RULES:
1. After every significant change, run tests: pytest
2. Write your API schema to .alchemistral/contracts/api-schema.json
3. Only report DONE if tests pass
4. Update .alchemistral/agents/backend.md with what you did
```

**Infra Agent:**
```
You are Alchemistral's Infra Agent. You own Docker, CI/CD, deployment.
Never touch application code.
Your task: {task}
```

**Security Agent (transversal):**
```
You are Alchemistral's Security Agent.
You can be invoked on any node at any time.
Run OWASP Top 10 analysis on the provided code.
Check for: injection, exposed secrets, broken auth, insecure deps.
Return: severity, location, remediation.
Code to analyze: {code}
```

---

## Git Strategy — Worktree-Based

```
main                              ← stable, never touched by agents directly
├── integration                   ← orchestrator merges here, tests, then promotes to main
├── .worktrees/
│   ├── agent-frontend-001/       ← worktree → branch agent/frontend-001
│   │   └── (full project copy)
│   ├── agent-backend-002/        ← worktree → branch agent/backend-002
│   │   └── (full project copy)
│   └── agent-infra-003/          ← worktree → branch agent/infra-003
│       └── (full project copy)
```

**Merge flow:**
1. Agent completes task in worktree
2. Validation Gate passes (self-test → orchestrator test → integration test)
3. Orchestrator merges agent branch into `integration`
4. If all agents for a milestone are done → integration tested → promote to main

**Rules:**
- One worktree per agent, auto-created on agent spawn
- Worktrees created under `.worktrees/` (gitignored from main)
- Agents commit freely in their worktree
- Only orchestrator merges — agents never merge
- Manual dev patches on main are detected via git status

---

## WebSocket Event Schema

Every agent streams events tagged with agent_id.
Frontend routes each event to the correct canvas node.

```json
{ "agent_id": "fe-001", "type": "think", "text": "..." }
{ "agent_id": "fe-001", "type": "code",  "text": "// code block" }
{ "agent_id": "fe-001", "type": "bash",  "text": "npm run build" }
{ "agent_id": "fe-001", "type": "todo_check", "todo_id": "a1" }
{ "agent_id": "fe-001", "type": "build_status", "status": "pass" }
{ "agent_id": "fe-001", "type": "done", "branch": "agent/frontend-001" }
{ "agent_id": "be-002", "type": "contract_update", "file": "api-schema.json" }
{ "agent_id": "orchestrator", "type": "assign", "to": "fe-001", "task": "..." }
{ "agent_id": "orchestrator", "type": "dag_update", "dag": {...} }
{ "agent_id": "orchestrator", "type": "todo_update", "todos": [...] }
{ "agent_id": "orchestrator", "type": "merge", "branch": "agent/frontend-001", "status": "success" }
{ "agent_id": "orchestrator", "type": "validation", "agent": "fe-001", "level": 2, "status": "pass" }
{ "agent_id": "security", "type": "scan_result", "severity": "high", "text": "..." }
```

---

## Sprint Plan — Milestones

Build one milestone at a time. One branch per milestone. Test before next.

### M1 — Foundation (branch: feat/foundation) [~3h]
- [ ] Monorepo scaffold — packages/frontend + packages/backend
- [ ] FastAPI running with health check + WebSocket endpoint /ws
- [ ] React + Vite + Tailwind running, connects to WebSocket
- [ ] Single test event streamed and displayed in UI
- [ ] Project config file structure (.alchemistral/) created
- [ ] DELIVERABLE: "Hello from orchestrator" streams to UI + .alchemistral/ exists

### M2 — Memory + Projects (branch: feat/memory) [~2h]
- [ ] Project Manager — create project (clone/local/init)
- [ ] .alchemistral/ directory created on project open
- [ ] GLOBAL.md, architecture.json, contracts/ read/write via API
- [ ] Agent memory files read/write
- [ ] todos.json schema implemented
- [ ] Project selector in frontend UI
- [ ] DELIVERABLE: Create a project → memory persists between sessions

### M3 — Orchestrator Core (branch: feat/orchestrator) [~4h]
- [ ] Reprompt engine — Mistral Small reformulates input
- [ ] Orchestrator — Mistral Large decomposes mission into DAG
- [ ] Contract files generated by orchestrator
- [ ] Global todolist updated from orchestrator output
- [ ] Tasks streamed to frontend via WebSocket
- [ ] DELIVERABLE: Type a mission → see orchestrator decompose it live with DAG

### M4 — Agent Loop + Vibe CLI (branch: feat/agents) [~5h]
- [ ] CLIAdapter interface + VibeCLIAdapter implementation
- [ ] Git worktree manager — create/list/cleanup worktrees
- [ ] BaseAgent class with ECS skill system
- [ ] Agent Manager — lifecycle: spawn worktree → launch Vibe CLI → stream → validate
- [ ] Frontend + Backend parent agents working
- [ ] Parallel execution via asyncio.gather
- [ ] Each agent streams to its own WebSocket channel
- [ ] Validation Gate (at least Level 1 + Level 2)
- [ ] DELIVERABLE: Two agents work in parallel in separate worktrees, visible on canvas

### M5 — The Lab Canvas (branch: feat/lab) [~4h]
- [ ] Infinite canvas with draggable agent nodes
- [ ] Agent nodes show: status, skills badges, progress, mini todo, live stream
- [ ] Inspector panel — per-agent chat, skills, memory, todo
- [ ] Working tree panel — branches, merge status, validation results
- [ ] DAG visualization — which agents depend on which
- [ ] DELIVERABLE: Full Lab view with live agents on canvas

### M6 — Security + Skills (branch: feat/skills) [~2h]
- [ ] Security transversal agent — invokable on any node
- [ ] BaseSkill + CodeStyleSkill implementation
- [ ] Skills visible as badges on canvas nodes
- [ ] Attach/detach skills from Inspector
- [ ] DELIVERABLE: Click "Security Scan" → results stream to inspector

### M7 — Child Agents (branch: feat/children) [~2h]
- [ ] Child agent spawn — from Inspector panel
- [ ] Child gets own worktree, branched from parent's branch
- [ ] Child → Parent review flow (parent validates child output)
- [ ] Child merges into parent branch (not directly to integration)
- [ ] DELIVERABLE: Spawn a child, it works in its worktree, parent reviews

### M8 — Demo Mode + Polish (branch: feat/demo) [~4h+]
- [ ] DEMO_MODE=true uses pre-cached session with realistic timing
- [ ] Pre-built project loaded with real agent history and memory
- [ ] All streams replay from cache with realistic delays
- [ ] UI polish — animations, loading states, error handling
- [ ] Deploy to Railway (backend) + Vercel (frontend)
- [ ] 5 consecutive demo runs without failure
- [ ] DELIVERABLE: Flawless 5-minute demo

---

## Deployment Strategy

**For the hackathon demo — keep it simple:**

**Option A — Local demo (recommended for hackathon):**
Run everything on your laptop. No network latency, no deployment issues.
- Backend: `uvicorn main:app --host 0.0.0.0 --port 8000`
- Frontend: `npm run dev` (Vite on :5173)
- Vibe CLI: installed locally, subprocesses spawned by backend
- Project repo: local directory
- Demo mode: DEMO_MODE=true with pre-cached responses

**Option B — Deployed (for judges to test after):**
- Backend: Railway (FastAPI + WebSocket support, auto-deploy from GitHub)
- Frontend: Vercel (React + Vite, zero-config)
- Problem: Vibe CLI needs to run on the server → Railway might not support it
- Solution: For deployed version, mock the Vibe CLI with pre-recorded outputs
- The real Vibe CLI integration only works when running locally

**Recommendation:** Demo locally. Deploy a "viewer mode" for judges.
The viewer mode replays a pre-recorded session — all the WebSocket events,
all the agent streams, all the merges. It looks identical to the real thing.

---

## Non-negotiable Rules

1. One milestone at a time — never skip ahead
2. Test the deliverable before moving to next milestone
3. Every external API call has a fallback mock
4. DEMO_MODE=true must work perfectly before hackathon ends
5. Never break the WebSocket contract
6. Agents never touch files outside their domain
7. Agents must pass Validation Gate before merge
8. Only orchestrator merges — agents never merge directly
9. Contract files (.alchemistral/contracts/) are the source of truth for cross-agent interfaces

---

## Environment Variables

```
MISTRAL_API_KEY=...
DEMO_MODE=false          # true for live demo — uses cached sessions
PROJECT_PATH=...         # path to user's project to orchestrate
CLI_ADAPTER=vibe         # which CLI adapter to use
VIBE_AUTO_APPROVE=true   # agents don't ask for confirmation
```

---

## Demo Strategy

Do NOT build a todo app live. Show a pre-built project.

**The pre-built project:** A data annotation tool (gamified)
built by Alchemistral's agents. Real branches. Real memory files. Real agent history.

**During demo (5 min):**
1. Open Projects — show project list, open "Data Annotation Tool"
2. Open Room — show GLOBAL.md, architecture, todos, contracts
3. Type one new feature request — watch orchestrator decompose live
4. See the DAG — which agents will run in parallel, which wait
5. Switch to Lab — watch agents spawn on canvas, working in parallel
6. See Validation Gate — an agent builds, tests pass, merge approved
7. Inspect one agent — show its memory, skills, todos, live stream
8. Show working tree — branches, merge history
9. Security scan — click on a node, results stream in
10. "Alchemistral doesn't replace your coding agent. It runs your entire engineering team."

**The line that wins:**
"You run one agent. Alchemistral runs your engineering team."
