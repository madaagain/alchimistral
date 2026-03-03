"""
Demo pipeline — hardcoded DAG + mock agent simulation for hackathon demo.

IMPORTANT: This file is completely isolated from the real pipeline.
It never calls Mistral API, never spawns Vibe CLI, never touches git worktrees.
All events are synthetic, streamed over WebSocket with realistic timing.
"""
import asyncio
import logging
from datetime import datetime, timezone
from typing import Callable, Awaitable

logger = logging.getLogger(__name__)


def _ts() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── Hardcoded DAG ────────────────────────────────────────────────────────────

DEMO_DAG = [
    {
        "id": "t1",
        "label": "Backend API schema + models",
        "agent_domain": "backend",
        "agent_type": "parent",
        "parent_id": None,
        "dependencies": [],
        "prompt": "Design and implement the FastAPI data models and Pydantic schemas for the annotation tool.",
    },
    {
        "id": "t2",
        "label": "Auth API endpoints",
        "agent_domain": "backend",
        "agent_type": "parent",
        "parent_id": None,
        "dependencies": ["t1"],
        "prompt": "Implement /auth/login, /auth/refresh with JWT and refresh token rotation.",
    },
    {
        "id": "t3",
        "label": "Database migrations",
        "agent_domain": "backend",
        "agent_type": "parent",
        "parent_id": None,
        "dependencies": ["t1"],
        "prompt": "Create Alembic migrations for users, sessions, annotations tables.",
    },
    {
        "id": "t4",
        "label": "Write API contract",
        "agent_domain": "backend",
        "agent_type": "parent",
        "parent_id": None,
        "dependencies": ["t2"],
        "prompt": "Write OpenAPI contract to .alchemistral/contracts/api-schema.json.",
    },
    {
        "id": "t5",
        "label": "Frontend auth UI",
        "agent_domain": "frontend",
        "agent_type": "parent",
        "parent_id": None,
        "dependencies": ["t4"],
        "prompt": "Build login/signup form with OAuth2 redirect flow using Zustand + Tailwind.",
    },
    {
        "id": "t6",
        "label": "Annotation dashboard",
        "agent_domain": "frontend",
        "agent_type": "parent",
        "parent_id": None,
        "dependencies": ["t4"],
        "prompt": "Build the main annotation dashboard with metric cards, sidebar, and WebSocket updates.",
    },
    {
        "id": "t7",
        "label": "Security audit",
        "agent_domain": "security",
        "agent_type": "parent",
        "parent_id": None,
        "dependencies": ["t2", "t5"],
        "prompt": "Run OWASP Top 10 analysis on auth endpoints and frontend forms.",
    },
]


# ── Mock agent output lines per domain ────────────────────────────────────────

MOCK_OUTPUT = {
    "backend": [
        "$ cat requirements.txt",
        "Reading project structure...",
        "Creating models/user.py with User, Session schemas",
        "Writing app/routers/auth.py",
        '  POST /auth/login -> {"access_token": "..."}',
        '  POST /auth/refresh -> {"access_token": "..."}',
        "$ python -m pytest tests/ -v",
        "tests/test_auth.py::test_login PASSED",
        "tests/test_auth.py::test_refresh PASSED",
        "tests/test_auth.py::test_invalid_creds PASSED",
        "tests/test_models.py::test_user_schema PASSED",
        "All 4 tests passed.",
        "Writing contract to .alchemistral/contracts/api-schema.json",
        "Build verified. Agent done.",
    ],
    "frontend": [
        "$ npm run dev",
        "Reading .alchemistral/contracts/api-schema.json",
        "Creating src/components/LoginForm.tsx",
        "Creating src/components/SignupForm.tsx",
        "Creating src/store/authStore.ts (Zustand)",
        "Implementing OAuth2 redirect flow...",
        "Writing Tailwind classes — responsive grid layout",
        "Creating src/pages/Dashboard.tsx",
        "Adding metric cards with live WebSocket updates",
        "$ npm run build",
        "vite v5.4.1 building for production...",
        "dist/assets/index-3a1b2c.js  142.3 kB | gzip: 45.1 kB",
        "$ npm test -- --run",
        "PASS src/__tests__/LoginForm.test.tsx (8 tests)",
        "PASS src/__tests__/Dashboard.test.tsx (6 tests)",
        "All 14 tests passed.",
        "Build verified. Agent done.",
    ],
    "security": [
        "$ scanning auth endpoints...",
        "Analyzing POST /auth/login for injection vectors",
        "Analyzing POST /auth/refresh for token reuse",
        "Checking JWT implementation...",
        "  - Algorithm: RS256 (good)",
        "  - Expiry: 15min access, 7d refresh (good)",
        "  - Rotation: enabled (good)",
        "Scanning frontend forms for XSS...",
        "  - Input sanitization: present",
        "  - CSP headers: configured",
        "OWASP Top 10 scan complete.",
        "No critical vulnerabilities found.",
        "1 low-severity finding: missing rate limiting on /auth/login",
        "Recommendation: Add rate limiter (e.g., slowapi)",
        "Security audit complete.",
    ],
}

# ── Child agent output ────────────────────────────────────────────────────────

CHILD_OUTPUT = [
    "$ Spawned from security-t7 for rate limiting fix",
    "Reading app/routers/auth.py",
    "Installing slowapi...",
    "$ pip install slowapi",
    "Adding rate limiter middleware to FastAPI app",
    "  from slowapi import Limiter",
    '  limiter = Limiter(key_func=get_remote_address)',
    '  @limiter.limit("5/minute")',
    "  async def login(...):",
    "$ python -m pytest tests/test_auth.py -v",
    "tests/test_auth.py::test_rate_limit PASSED",
    "All tests passed. Rate limiting applied.",
]


# ── Mock agent runner ─────────────────────────────────────────────────────────

async def _mock_agent(
    agent_id: str,
    task: dict,
    broadcast: Callable[[dict], Awaitable[None]],
    delay_range: tuple[float, float] = (0.3, 0.6),
) -> None:
    """Simulate an agent working with realistic output events."""
    domain = task.get("agent_domain", "backend")
    label = task.get("label", task["id"])
    lines = MOCK_OUTPUT.get(domain, MOCK_OUTPUT["backend"])

    # Spawn event
    await broadcast({
        "agent_id": agent_id,
        "type": "spawn",
        "domain": domain,
        "label": label,
        "worktree": f".worktrees/{agent_id}/",
        "branch": f"agent/{agent_id}",
        "timestamp": _ts(),
    })

    await asyncio.sleep(0.5)

    # Status: active
    await broadcast({
        "agent_id": agent_id,
        "type": "status",
        "status": "active",
        "branch": f"agent/{agent_id}",
        "worktree": f".worktrees/{agent_id}/",
        "timestamp": _ts(),
    })

    # Stream output lines with delays
    import random
    for i, line in enumerate(lines):
        await asyncio.sleep(random.uniform(*delay_range))
        event_type = "bash" if line.startswith("$") else "output"
        if "PASS" in line or "passed" in line.lower():
            event_type = "output"
        await broadcast({
            "agent_id": agent_id,
            "type": event_type,
            "text": line,
            "timestamp": _ts(),
        })

    # Done event
    await asyncio.sleep(0.3)
    await broadcast({
        "agent_id": agent_id,
        "type": "done",
        "text": f"{label} completed successfully",
        "branch": f"agent/{agent_id}",
        "timestamp": _ts(),
    })


async def _mock_child_agent(
    parent_id: str,
    broadcast: Callable[[dict], Awaitable[None]],
) -> None:
    """Simulate a child agent spawned after security audit."""
    child_id = "security-t7-child-ratelimit"

    # Child spawn event
    await broadcast({
        "agent_id": child_id,
        "type": "child_agent_spawn",
        "parent_id": parent_id,
        "domain": "backend",
        "label": "Rate Limit Fix",
        "worktree": f".worktrees/{child_id}/",
        "branch": f"agent/{child_id}",
        "timestamp": _ts(),
    })

    # Also send spawn so canvas picks it up
    await broadcast({
        "agent_id": child_id,
        "type": "spawn",
        "domain": "backend",
        "label": "Rate Limit Fix",
        "parent_id": parent_id,
        "worktree": f".worktrees/{child_id}/",
        "branch": f"agent/{child_id}",
        "is_child": True,
        "timestamp": _ts(),
    })

    await asyncio.sleep(0.5)
    await broadcast({
        "agent_id": child_id,
        "type": "status",
        "status": "active",
        "branch": f"agent/{child_id}",
        "worktree": f".worktrees/{child_id}/",
        "timestamp": _ts(),
    })

    import random
    for line in CHILD_OUTPUT:
        await asyncio.sleep(random.uniform(0.3, 0.5))
        await broadcast({
            "agent_id": child_id,
            "type": "bash" if line.startswith("$") else "output",
            "text": line,
            "timestamp": _ts(),
        })

    await asyncio.sleep(0.3)
    await broadcast({
        "agent_id": child_id,
        "type": "done",
        "text": "Rate Limit Fix completed",
        "branch": f"agent/{child_id}",
        "timestamp": _ts(),
    })

    # Child complete event for chat
    await broadcast({
        "agent_id": child_id,
        "type": "child_agent_complete",
        "parent_id": parent_id,
        "label": "Rate Limit Fix",
        "status": "done",
        "timestamp": _ts(),
    })


# ── Main demo pipeline ───────────────────────────────────────────────────────

async def run_demo_mission(
    project_id: str,
    message: str,
    broadcast: Callable[[dict], Awaitable[None]],
) -> None:
    """Run the full demo pipeline — no API calls, no real agents."""
    try:
        await _demo_pipeline(message, broadcast)
    except Exception as exc:
        logger.error(f"Demo pipeline error: {exc}", exc_info=True)
        await broadcast({
            "agent_id": "orchestrator",
            "type": "error",
            "text": f"Demo pipeline error: {exc}",
            "timestamp": _ts(),
        })


async def _demo_pipeline(
    message: str,
    broadcast: Callable[[dict], Awaitable[None]],
) -> None:
    # ── Step 1: Fake reprompt ────────────────────────────────────────────────
    await broadcast({
        "agent_id": "orchestrator",
        "type": "thinking",
        "text": "Refining your request with Reprompt Engine...",
        "timestamp": _ts(),
    })
    await asyncio.sleep(1.2)

    refined = (
        "Implement a complete authentication system for the Data Annotation Tool. "
        "Backend: FastAPI with JWT access/refresh token rotation, PostgreSQL with Alembic migrations. "
        "Frontend: React login/signup forms with OAuth2 redirect flow, Zustand state management, Tailwind CSS. "
        "Security: OWASP Top 10 audit on all auth endpoints and forms."
    )
    await broadcast({
        "agent_id": "orchestrator",
        "type": "reprompt",
        "original": message,
        "refined": refined,
        "intent": "mission",
        "timestamp": _ts(),
    })

    # ── Step 2: Fake orchestration ───────────────────────────────────────────
    await asyncio.sleep(0.8)
    await broadcast({
        "agent_id": "orchestrator",
        "type": "thinking",
        "text": "Analyzing repository structure and decomposing into agent tasks...",
        "timestamp": _ts(),
    })
    await asyncio.sleep(1.5)

    # DAG update
    await broadcast({
        "agent_id": "orchestrator",
        "type": "dag_update",
        "dag": DEMO_DAG,
        "analysis": "Monorepo detected: React 18 + FastAPI + PostgreSQL. Decomposed into 7 tasks with 3 parallel tracks.",
        "timestamp": _ts(),
    })

    # ── Step 3: Fake contract write ──────────────────────────────────────────
    await asyncio.sleep(0.5)
    await broadcast({
        "agent_id": "orchestrator",
        "type": "contract_update",
        "file": "api-schema.json",
        "written_by": "orchestrator",
        "read_by": ["frontend"],
        "timestamp": _ts(),
    })

    # ── Step 4: Fake memory update ───────────────────────────────────────────
    await asyncio.sleep(0.3)
    await broadcast({
        "agent_id": "orchestrator",
        "type": "memory_update",
        "additions": [
            "OAuth2 + JWT with refresh token rotation",
            "FastAPI + PostgreSQL + Alembic",
            "Zustand for frontend state",
            "Tailwind CSS for styling",
        ],
        "timestamp": _ts(),
    })

    # ── Step 5: Ready ────────────────────────────────────────────────────────
    await asyncio.sleep(0.5)
    await broadcast({
        "agent_id": "orchestrator",
        "type": "ready",
        "text": "Plan ready. 7 agent tasks queued. Spawning agents...",
        "timestamp": _ts(),
    })

    # ── Step 6: Execute DAG with mock agents ─────────────────────────────────
    await broadcast({
        "agent_id": "orchestrator",
        "type": "dag_execution_start",
        "text": "Executing DAG with 7 tasks",
        "timestamp": _ts(),
    })

    tasks_by_id = {t["id"]: t for t in DEMO_DAG}
    completed: set[str] = set()
    spawned: set[str] = set()

    # Simple dependency-aware execution
    while len(completed) < len(DEMO_DAG):
        ready = []
        for task in DEMO_DAG:
            tid = task["id"]
            if tid in spawned:
                continue
            deps = task.get("dependencies", [])
            if all(d in completed for d in deps):
                ready.append(task)

        if not ready:
            await asyncio.sleep(0.5)
            continue

        # Run ready tasks concurrently (max 3)
        batch = ready[:3]
        for task in batch:
            spawned.add(task["id"])

        agents = []
        for task in batch:
            agent_id = f"{task['agent_domain']}-{task['id']}"
            agents.append(_mock_agent(agent_id, task, broadcast))

        await asyncio.gather(*agents)

        for task in batch:
            completed.add(task["id"])

        # After security audit (t7), spawn child agent
        if "t7" in completed and "t7" in [t["id"] for t in batch]:
            await asyncio.sleep(0.5)
            await broadcast({
                "agent_id": "orchestrator",
                "type": "thinking",
                "text": "Security audit found low-severity issue. Spawning child agent for remediation...",
                "timestamp": _ts(),
            })
            await asyncio.sleep(0.8)
            await _mock_child_agent("security-t7", broadcast)

    # ── Step 7: DAG execution done ───────────────────────────────────────────
    await broadcast({
        "agent_id": "orchestrator",
        "type": "dag_execution_done",
        "completed": list(completed),
        "failed": [],
        "text": f"DAG complete: {len(completed)} succeeded, 0 failed",
        "timestamp": _ts(),
    })

    # ── Step 8: Mission complete ─────────────────────────────────────────────
    task_summaries = []
    for t in DEMO_DAG:
        task_summaries.append({
            "id": t["id"],
            "label": t["label"],
            "domain": t["agent_domain"],
            "status": "done",
            "branch": f"agent/{t['agent_domain']}-{t['id']}",
        })

    await broadcast({
        "agent_id": "orchestrator",
        "type": "mission_complete",
        "success": True,
        "completed_count": len(DEMO_DAG),
        "failed_count": 0,
        "total_count": len(DEMO_DAG),
        "tasks": task_summaries,
        "text": f"All {len(DEMO_DAG)} agents finished successfully.",
        "timestamp": _ts(),
    })

    # ── Step 9: Fake auto-merge ──────────────────────────────────────────────
    await asyncio.sleep(0.8)
    merged_branches = [f"agent/{t['agent_domain']}-{t['id']}" for t in DEMO_DAG]
    await broadcast({
        "agent_id": "orchestrator",
        "type": "merge_complete",
        "merged": merged_branches,
        "conflicts": [],
        "text": f"Merged {len(merged_branches)} branches into main.",
        "timestamp": _ts(),
    })

    # ── Step 10: Fake auto-run ───────────────────────────────────────────────
    await asyncio.sleep(0.6)
    await broadcast({
        "agent_id": "orchestrator",
        "type": "thinking",
        "text": "Running verification: npm test && pytest",
        "timestamp": _ts(),
    })
    await asyncio.sleep(1.5)
    await broadcast({
        "agent_id": "orchestrator",
        "type": "run_result",
        "command": "npm test && pytest",
        "exit_code": 0,
        "output": (
            "PASS src/__tests__/LoginForm.test.tsx (8 tests)\n"
            "PASS src/__tests__/Dashboard.test.tsx (6 tests)\n"
            "tests/test_auth.py::test_login PASSED\n"
            "tests/test_auth.py::test_refresh PASSED\n"
            "tests/test_auth.py::test_rate_limit PASSED\n"
            "tests/test_models.py::test_user_schema PASSED\n"
            "\n"
            "All 18 tests passed."
        ),
        "text": "Verification passed: npm test && pytest",
        "timestamp": _ts(),
    })

    logger.info("Demo pipeline completed successfully")
