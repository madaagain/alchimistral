"""
Agent Manager — lifecycle management for coding agents.

Handles: spawn → stream output → validate → track state.
Each agent runs in an isolated git worktree with its own CLI process.
Agents are scoped by project_id — switching projects shows only that project's agents.
"""
import asyncio
import logging
import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Callable, Awaitable

from services.cli_adapter import AgentConfig, AgentEvent, get_adapter
from services.prompt_builder import build_prompt
from services.worktree import create_worktree

logger = logging.getLogger(__name__)


@dataclass
class AgentState:
    """Runtime state of a single agent."""
    id: str
    project_id: str
    domain: str
    label: str
    status: str = "pending"  # pending, spawning, active, validating, done, failed
    worktree_path: str = ""
    branch: str = ""
    prompt: str = ""
    started_at: str | None = None
    completed_at: str | None = None
    validation_level: int = 0  # 0=none, 1=self-test, 2=orchestrator, 3=integration
    output_lines: list[str] = field(default_factory=list)
    error: str | None = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "project_id": self.project_id,
            "domain": self.domain,
            "label": self.label,
            "status": self.status,
            "worktree_path": self.worktree_path,
            "branch": self.branch,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "validation_level": self.validation_level,
            "output_line_count": len(self.output_lines),
            "error": self.error,
        }


class AgentManager:
    """Manages all active agents, scoped by project."""

    def __init__(self) -> None:
        # agents[project_id][agent_id] = AgentState
        self._agents: dict[str, dict[str, AgentState]] = {}
        self._tasks: dict[str, asyncio.Task] = {}

    def get_agent(self, agent_id: str, project_id: str | None = None) -> AgentState | None:
        if project_id:
            return self._agents.get(project_id, {}).get(agent_id)
        # Fallback: search all projects (used by _stream_loop / _wait_for_agent)
        for proj_agents in self._agents.values():
            if agent_id in proj_agents:
                return proj_agents[agent_id]
        return None

    def list_agents(self, project_id: str | None = None) -> list[dict]:
        if project_id:
            return [a.to_dict() for a in self._agents.get(project_id, {}).values()]
        # All agents across all projects
        result = []
        for proj_agents in self._agents.values():
            result.extend(a.to_dict() for a in proj_agents.values())
        return result

    async def spawn_agent(
        self,
        agent_id: str,
        domain: str,
        label: str,
        task_prompt: str,
        project_path: str,
        alch_dir: str,
        broadcast: Callable[[dict], Awaitable[None]],
        cli_adapter_name: str = "vibe",
        skills: list[str] | None = None,
        project_id: str = "",
    ) -> AgentState:
        """
        Spawn an agent: create worktree, build prompt, launch CLI, stream output.
        """
        state = AgentState(
            id=agent_id,
            project_id=project_id,
            domain=domain,
            label=label,
            status="spawning",
            prompt=task_prompt,
            started_at=datetime.now(timezone.utc).isoformat(),
        )
        # Store scoped by project
        if project_id not in self._agents:
            self._agents[project_id] = {}
        self._agents[project_id][agent_id] = state

        # Broadcast spawn event
        await broadcast({
            "agent_id": agent_id,
            "type": "spawn",
            "domain": domain,
            "label": label,
            "project_id": project_id,
            "timestamp": state.started_at,
        })

        try:
            # Create worktree
            wt_path = await create_worktree(project_path, agent_id)
            state.worktree_path = wt_path
            state.branch = f"agent/{agent_id}"

            # Build prompt
            full_prompt = build_prompt(
                agent_domain=domain,
                task_prompt=task_prompt,
                alch_dir=alch_dir,
                skills=skills,
            )

            # Get CLI adapter
            demo = os.getenv("DEMO_MODE", "false").lower() == "true"
            adapter_name = "mock" if demo else cli_adapter_name
            adapter = get_adapter(adapter_name)

            config = AgentConfig(skills=skills or [])

            # Spawn the CLI process
            await adapter.spawn(wt_path, full_prompt, config, agent_id)
            state.status = "active"

            await broadcast({
                "agent_id": agent_id,
                "type": "status",
                "text": f"Agent {agent_id} active in {state.branch}",
                "status": "active",
                "worktree": wt_path,
                "branch": state.branch,
                "project_id": project_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

            # Stream output in background
            task = asyncio.create_task(
                self._stream_loop(agent_id, adapter, broadcast)
            )
            self._tasks[agent_id] = task

        except Exception as exc:
            state.status = "failed"
            state.error = str(exc)
            logger.error(f"[{agent_id}] Spawn failed: {exc}", exc_info=True)
            await broadcast({
                "agent_id": agent_id,
                "type": "error",
                "text": f"Spawn failed: {exc}",
                "project_id": project_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

        return state

    async def _stream_loop(
        self,
        agent_id: str,
        adapter,
        broadcast: Callable[[dict], Awaitable[None]],
    ) -> None:
        """Read agent output and broadcast each event."""
        state = self.get_agent(agent_id)
        if not state:
            return

        try:
            async for event in adapter.stream_output():
                state.output_lines.append(event.text)

                await broadcast({
                    "agent_id": event.agent_id,
                    "type": event.type,
                    "text": event.text,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })

                if event.type == "done":
                    state.status = "done"
                    state.completed_at = datetime.now(timezone.utc).isoformat()
                    state.validation_level = 1  # Self-test passed (agent reported done)
                    break

        except Exception as exc:
            state.status = "failed"
            state.error = str(exc)
            logger.error(f"[{agent_id}] Stream error: {exc}")
            await broadcast({
                "agent_id": agent_id,
                "type": "error",
                "text": f"Agent error: {exc}",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

    async def kill_agent(self, agent_id: str) -> bool:
        """Kill a running agent."""
        task = self._tasks.get(agent_id)
        if task and not task.done():
            task.cancel()

        state = self.get_agent(agent_id)
        if state:
            state.status = "failed"
            state.error = "Killed by user"
            state.completed_at = datetime.now(timezone.utc).isoformat()
            return True
        return False


# Global singleton
agent_manager = AgentManager()
