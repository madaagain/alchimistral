"""
DAG Executor — runs orchestrator DAG with dependency resolution.

Independent tasks spawn in parallel. Dependent tasks wait for their
dependencies to complete before spawning.
"""
import asyncio
import logging
from datetime import datetime, timezone
from typing import Callable, Awaitable

from services.agent_manager import agent_manager

logger = logging.getLogger(__name__)


async def execute_dag(
    dag: list[dict],
    project_path: str,
    alch_dir: str,
    broadcast: Callable[[dict], Awaitable[None]],
    cli_adapter_name: str = "vibe",
    project_id: str = "",
) -> None:
    """
    Execute a DAG of agent tasks with dependency resolution.

    Tasks with no dependencies run in parallel.
    Tasks wait for all dependencies to complete before spawning.
    """
    if not dag:
        logger.info("Empty DAG — nothing to execute")
        return

    # Build lookup
    tasks_by_id: dict[str, dict] = {t["id"]: t for t in dag}
    completed: set[str] = set()
    failed: set[str] = set()
    spawned: set[str] = set()
    agent_futures: dict[str, asyncio.Task] = {}

    await broadcast({
        "agent_id": "orchestrator",
        "type": "dag_execution_start",
        "text": f"Executing DAG with {len(dag)} tasks",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    async def _wait_for_agent(agent_id: str, task_id: str) -> None:
        """Wait for an agent to complete by polling its state."""
        while True:
            state = agent_manager.get_agent(agent_id)
            if not state:
                break
            if state.status in ("done", "failed"):
                break
            await asyncio.sleep(1)

        state = agent_manager.get_agent(agent_id)
        if state and state.status == "done":
            completed.add(task_id)
        else:
            failed.add(task_id)

    def _deps_met(task: dict) -> bool:
        """Check if all dependencies for a task are completed."""
        deps = task.get("dependencies", [])
        return all(d in completed for d in deps)

    def _deps_failed(task: dict) -> bool:
        """Check if any dependency has failed."""
        deps = task.get("dependencies", [])
        return any(d in failed for d in deps)

    # Main execution loop
    max_iterations = len(dag) * 10  # Safety guard
    iteration = 0

    while len(completed) + len(failed) < len(dag):
        iteration += 1
        if iteration > max_iterations:
            logger.error("DAG execution exceeded max iterations — aborting")
            break

        # Find tasks ready to spawn
        ready: list[dict] = []
        for task in dag:
            tid = task["id"]
            if tid in spawned:
                continue
            if _deps_failed(task):
                failed.add(tid)
                spawned.add(tid)
                await broadcast({
                    "agent_id": "orchestrator",
                    "type": "task_skipped",
                    "task_id": tid,
                    "text": f"Skipped {task.get('label', tid)} — dependency failed",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
                continue
            if _deps_met(task):
                ready.append(task)

        # Spawn ready tasks
        for task in ready:
            tid = task["id"]
            spawned.add(tid)

            agent_id = f"{task.get('agent_domain', 'agent')}-{tid}"
            domain = task.get("agent_domain", "backend")
            label = task.get("label", tid)
            prompt = task.get("prompt", "")

            await agent_manager.spawn_agent(
                agent_id=agent_id,
                domain=domain,
                label=label,
                task_prompt=prompt,
                project_path=project_path,
                alch_dir=alch_dir,
                broadcast=broadcast,
                cli_adapter_name=cli_adapter_name,
                project_id=project_id,
            )

            # Create a future that waits for this agent to finish
            agent_futures[tid] = asyncio.create_task(
                _wait_for_agent(agent_id, tid)
            )

        # If nothing was spawned and nothing is running, we're stuck
        running = [
            tid for tid, fut in agent_futures.items()
            if not fut.done() and tid not in completed and tid not in failed
        ]
        if not ready and not running:
            logger.warning("DAG executor: no tasks ready and none running — possible cycle")
            break

        # Wait for at least one running task to complete
        if running:
            running_futures = [agent_futures[tid] for tid in running]
            await asyncio.wait(running_futures, return_when=asyncio.FIRST_COMPLETED)

    # Summary
    await broadcast({
        "agent_id": "orchestrator",
        "type": "dag_execution_done",
        "completed": list(completed),
        "failed": list(failed),
        "text": f"DAG complete: {len(completed)} succeeded, {len(failed)} failed",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    logger.info(f"DAG execution done: {len(completed)} completed, {len(failed)} failed")
