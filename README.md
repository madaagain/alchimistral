# Alchimistral

**An infinite canvas where you orchestrate AI coding agents in parallel.**

---

## What is it

Alchimistral is a multi-agent orchestration platform for software engineers. You describe what you want to build. The orchestrator decomposes your request into a DAG of tasks, spawns coding agents in isolated git worktrees, and merges the results back into your project -- automatically. You watch it all happen in real time on an infinite canvas.

---

## The Pipeline

```
 Developer
    |
    v
 [ Reprompt Engine ]          Mistral Small refines your prompt,
    |                          classifies intent (mission vs chat)
    v
 [ Orchestrator ]              Mistral Large decomposes into a
    |                          dependency graph (DAG) of tasks
    v
 [ Agent Spawner ]             Each task gets a Vibe CLI agent
    |   |   |                  in its own git worktree
    v   v   v
 [fe] [be] [infra]             Agents work in parallel, isolated
    |   |   |                  filesystems, no conflicts
    v   v   v
 [ Auto-Merge ]                Branches merged into main sequentially
    |
    v
 [ Auto-Run ]                  Verification command confirms it works
    |
    v
 Done.
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Orchestrator LLM | Mistral Large via Mistral API |
| Coding Agents | Devstral 2 (123B) via Vibe CLI |
| Backend | Python, FastAPI, asyncio |
| Frontend | React, TypeScript, Vite, Tailwind |
| Agent Isolation | Git worktrees (one per agent, shared history) |
| Real-time | WebSocket (single stream, events tagged by agent ID) |
| Memory | `.alchemistral/` directory per project (markdown + JSON) |

---

## How to Run

```bash
# Install dependencies
make install

# Start backend + frontend
make dev
```

Open [http://localhost:5173](http://localhost:5173). Add your Mistral API key on the welcome screen.

---

## How It Works

- **Reprompt** -- Your natural language input is refined by Mistral Small into a precise engineering spec. The engine classifies whether you're asking a question (chat) or requesting code changes (mission).

- **DAG Decomposition** -- Mistral Large analyzes your project's codebase, stack, and architecture, then decomposes the mission into a dependency graph of atomic agent tasks. Independent tasks run in parallel. Dependent tasks wait.

- **Isolated Execution** -- Each agent gets its own git worktree: a full copy of your repo on a dedicated branch. Agents read/write files freely with zero filesystem conflicts. A semaphore caps concurrency at 3 to prevent resource exhaustion.

- **Auto-Merge Pipeline** -- When all agents complete, their branches are merged into main sequentially. On conflict, agent code wins (`--strategy-option theirs`). Changed dependency files trigger automatic `pip install` or `npm install`.

- **Verification** -- The orchestrator includes a `run_command` in its plan. After merge, that command executes with a 30-second timeout. The result streams to the chat panel: pass or fail, with full stdout.

---

## Project Structure

```
alchimistral/
  packages/
    backend/           FastAPI + WebSocket + agent lifecycle
      services/
        orchestrator.py    Mistral Large -- DAG decomposition
        reprompt.py        Mistral Small -- prompt refinement
        dag_executor.py    Agent scheduling, auto-merge, auto-run
        agent_manager.py   Agent spawn, stream, state tracking
        cli_adapter.py     Vibe CLI subprocess adapter
        worktree.py        Git worktree create/list/remove
        pipeline.py        Full mission pipeline orchestration
        codebase_scanner.py  Project analysis + GLOBAL.md generation
    frontend/          React + Vite + Tailwind
      src/
        views/Lab.tsx      Infinite canvas with draggable agent nodes
        components/
          ChatPanel.tsx    Mission/chat drawer with live feedback
          FeedBlock.tsx    Typed message blocks (merge, run, agent, etc.)
          FileTree.tsx     Live file browser with WS refresh
```

---

Built for the Mistral Worldwide Hackathon 2026.
