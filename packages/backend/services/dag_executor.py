"""
DAG Executor — runs orchestrator DAG with dependency resolution,
then auto-merges, auto-installs deps, and auto-runs verification.
"""
import asyncio
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Awaitable

from services.agent_manager import agent_manager

logger = logging.getLogger(__name__)

MAX_CONCURRENT_AGENTS = 3
AUTO_RUN_TIMEOUT = 30


def _ts() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _git(cwd: str, *args: str) -> tuple[int, str, str]:
    proc = await asyncio.create_subprocess_exec(
        "git", *args,
        cwd=cwd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()
    return proc.returncode, stdout.decode(), stderr.decode()


async def _shell(cwd: str, cmd: str, timeout: int = AUTO_RUN_TIMEOUT) -> tuple[int, str]:
    """Run a shell command with timeout. Returns (exit_code, combined output)."""
    try:
        proc = await asyncio.create_subprocess_shell(
            cmd,
            cwd=cwd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=timeout)
        return proc.returncode or 0, stdout.decode("utf-8", errors="replace")
    except asyncio.TimeoutError:
        proc.kill()  # type: ignore[union-attr]
        return -1, f"Timeout after {timeout}s"


# ── Auto-merge ──────────────────────────────────────────────────────────────

async def _auto_merge(
    project_path: str,
    dag: list[dict],
    completed: set[str],
    broadcast: Callable[[dict], Awaitable[None]],
) -> list[str]:
    """Merge completed agent branches into main. Returns list of merged branch names."""
    await broadcast({
        "agent_id": "orchestrator", "type": "thinking",
        "text": "Merging agent branches into main...", "timestamp": _ts(),
    })

    # Checkout main
    rc, _, err = await _git(project_path, "checkout", "main")
    if rc != 0:
        # Try master if main doesn't exist
        rc, _, err = await _git(project_path, "checkout", "master")
        if rc != 0:
            logger.warning(f"Could not checkout main/master: {err}")

    merged: list[str] = []
    conflicts: list[str] = []

    for t in dag:
        tid = t["id"]
        if tid not in completed:
            continue
        branch = f"agent/{t.get('agent_domain', 'agent')}-{tid}"

        rc, out, err = await _git(project_path, "merge", branch, "--no-edit", "-m", f"merge {tid}")
        if rc != 0:
            # Conflict — abort and retry with theirs strategy
            await _git(project_path, "merge", "--abort")
            rc2, out2, err2 = await _git(
                project_path, "merge", branch, "--no-edit",
                "-m", f"merge {tid} (theirs)",
                "--strategy-option", "theirs",
            )
            if rc2 != 0:
                await _git(project_path, "merge", "--abort")
                conflicts.append(branch)
                logger.warning(f"Merge conflict unresolvable for {branch}: {err2}")
                continue

        merged.append(branch)
        logger.info(f"Merged {branch} into main")

    await broadcast({
        "agent_id": "orchestrator", "type": "merge_complete",
        "merged": merged, "conflicts": conflicts,
        "text": f"Merged {len(merged)} branch{'es' if len(merged) != 1 else ''} into main."
                + (f" {len(conflicts)} conflict(s)." if conflicts else ""),
        "timestamp": _ts(),
    })

    return merged


# ── Auto-install deps ───────────────────────────────────────────────────────

async def _auto_install_deps(
    project_path: str,
    merge_count: int,
    broadcast: Callable[[dict], Awaitable[None]],
) -> None:
    """Check if requirements.txt or package.json changed, install if so."""
    # Check for Python deps
    rc, diff_out, _ = await _git(project_path, "diff", f"HEAD~{merge_count}", "--", "requirements.txt")
    if rc == 0 and diff_out.strip():
        await broadcast({
            "agent_id": "orchestrator", "type": "thinking",
            "text": "Installing Python dependencies...", "timestamp": _ts(),
        })
        exit_code, output = await _shell(project_path, "pip install -r requirements.txt", timeout=60)
        await broadcast({
            "agent_id": "orchestrator", "type": "deps_installed",
            "text": "Python dependencies installed." if exit_code == 0 else f"pip install failed (code {exit_code})",
            "exit_code": exit_code,
            "timestamp": _ts(),
        })
        return

    # Check for Node deps
    rc, diff_out, _ = await _git(project_path, "diff", f"HEAD~{merge_count}", "--", "package.json")
    if rc == 0 and diff_out.strip():
        await broadcast({
            "agent_id": "orchestrator", "type": "thinking",
            "text": "Installing Node dependencies...", "timestamp": _ts(),
        })
        exit_code, output = await _shell(project_path, "npm install", timeout=60)
        await broadcast({
            "agent_id": "orchestrator", "type": "deps_installed",
            "text": "Node dependencies installed." if exit_code == 0 else f"npm install failed (code {exit_code})",
            "exit_code": exit_code,
            "timestamp": _ts(),
        })


# ── Auto-run ────────────────────────────────────────────────────────────────

async def _auto_run(
    project_path: str,
    run_command: str,
    broadcast: Callable[[dict], Awaitable[None]],
) -> None:
    """Run the verification command and broadcast result."""
    await broadcast({
        "agent_id": "orchestrator", "type": "thinking",
        "text": f"Running verification: {run_command}", "timestamp": _ts(),
    })

    exit_code, output = await _shell(project_path, run_command, timeout=AUTO_RUN_TIMEOUT)

    await broadcast({
        "agent_id": "orchestrator", "type": "run_result",
        "command": run_command,
        "exit_code": exit_code,
        "output": output[:4000],  # Cap output at 4KB
        "text": f"Verification {'passed' if exit_code == 0 else 'failed'}: {run_command}",
        "timestamp": _ts(),
    })


# ── Main DAG executor ──────────────────────────────────────────────────────

async def execute_dag(
    dag: list[dict],
    project_path: str,
    alch_dir: str,
    broadcast: Callable[[dict], Awaitable[None]],
    cli_adapter_name: str = "vibe",
    project_id: str = "",
    run_command: str = "",
) -> None:
    """
    Execute a DAG of agent tasks with dependency resolution.

    Tasks with no dependencies run in parallel (up to MAX_CONCURRENT_AGENTS).
    Tasks wait for all dependencies to complete before spawning.
    After all agents complete successfully: auto-merge, auto-install, auto-run.
    """
    if not dag:
        logger.info("Empty DAG — nothing to execute")
        return

    # Semaphore to limit concurrent agent processes (prevents OOM)
    semaphore = asyncio.Semaphore(MAX_CONCURRENT_AGENTS)

    # Build lookup
    tasks_by_id: dict[str, dict] = {t["id"]: t for t in dag}
    completed: set[str] = set()
    failed: set[str] = set()
    spawned: set[str] = set()
    agent_futures: dict[str, asyncio.Task] = {}

    await broadcast({
        "agent_id": "orchestrator", "type": "dag_execution_start",
        "text": f"Executing DAG with {len(dag)} tasks", "timestamp": _ts(),
    })

    async def _run_agent(agent_id: str, task_id: str, task: dict) -> None:
        """Acquire semaphore, spawn agent, wait for completion, commit work, release."""
        async with semaphore:
            domain = task.get("agent_domain", "backend")
            label = task.get("label", task_id)
            prompt = task.get("prompt", "")

            logger.info(f"[dag] Semaphore acquired for {agent_id}")

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

            # Poll until done
            while True:
                state = agent_manager.get_agent(agent_id)
                if not state:
                    break
                if state.status in ("done", "failed"):
                    break
                await asyncio.sleep(1)

            # ── Git commit agent work ──
            # Vibe CLI creates files but doesn't commit them.
            # We must git add + commit so auto-merge has actual changes.
            state = agent_manager.get_agent(agent_id)
            if state and state.status == "done" and state.worktree_path:
                wt = state.worktree_path
                try:
                    # Write .gitignore to exclude build artifacts
                    gi_path = Path(wt) / ".gitignore"
                    if not gi_path.exists():
                        gi_path.write_text(
                            "venv/\n__pycache__/\nnode_modules/\n"
                            ".env\n*.pyc\ndist/\nbuild/\n.venv/\n"
                        )

                    await _git(wt, "add", "-A")
                    rc, out, err = await _git(
                        wt, "commit",
                        "-m", f"agent {task_id}: {label}",
                        "--allow-empty",
                    )
                    if rc == 0:
                        logger.info(f"[dag] Committed agent work in {wt}")
                    else:
                        logger.warning(f"[dag] git commit in {wt} returned {rc}: {err}")
                except Exception as exc:
                    logger.error(f"[dag] Failed to commit agent work in {wt}: {exc}")

        state = agent_manager.get_agent(agent_id)
        if state and state.status == "done":
            completed.add(task_id)
        else:
            failed.add(task_id)

    def _deps_met(task: dict) -> bool:
        deps = task.get("dependencies", [])
        return all(d in completed for d in deps)

    def _deps_failed(task: dict) -> bool:
        deps = task.get("dependencies", [])
        return any(d in failed for d in deps)

    # Main execution loop
    max_iterations = len(dag) * 10
    iteration = 0

    while len(completed) + len(failed) < len(dag):
        iteration += 1
        if iteration > max_iterations:
            logger.error("DAG execution exceeded max iterations — aborting")
            break

        ready: list[dict] = []
        for task in dag:
            tid = task["id"]
            if tid in spawned:
                continue
            if _deps_failed(task):
                failed.add(tid)
                spawned.add(tid)
                await broadcast({
                    "agent_id": "orchestrator", "type": "task_skipped",
                    "task_id": tid,
                    "text": f"Skipped {task.get('label', tid)} — dependency failed",
                    "timestamp": _ts(),
                })
                continue
            if _deps_met(task):
                ready.append(task)

        for task in ready:
            tid = task["id"]
            spawned.add(tid)
            agent_id = f"{task.get('agent_domain', 'agent')}-{tid}"
            agent_futures[tid] = asyncio.create_task(
                _run_agent(agent_id, tid, task)
            )

        running = [
            tid for tid, fut in agent_futures.items()
            if not fut.done() and tid not in completed and tid not in failed
        ]
        if not ready and not running:
            logger.warning("DAG executor: no tasks ready and none running — possible cycle")
            break

        if running:
            running_futures = [agent_futures[tid] for tid in running]
            await asyncio.wait(running_futures, return_when=asyncio.FIRST_COMPLETED)

    # ── DAG execution summary ──
    await broadcast({
        "agent_id": "orchestrator", "type": "dag_execution_done",
        "completed": list(completed), "failed": list(failed),
        "text": f"DAG complete: {len(completed)} succeeded, {len(failed)} failed",
        "timestamp": _ts(),
    })

    # ── Mission complete report ──
    task_summaries = []
    for t in dag:
        tid = t["id"]
        status = "done" if tid in completed else "failed" if tid in failed else "unknown"
        task_summaries.append({
            "id": tid,
            "label": t.get("label", tid),
            "domain": t.get("agent_domain", "unknown"),
            "status": status,
            "branch": f"agent/{t.get('agent_domain', 'agent')}-{tid}",
        })

    all_passed = len(failed) == 0 and len(completed) == len(dag)
    await broadcast({
        "agent_id": "orchestrator", "type": "mission_complete",
        "success": all_passed,
        "completed_count": len(completed), "failed_count": len(failed),
        "total_count": len(dag), "tasks": task_summaries,
        "text": (
            f"All {len(completed)} agents finished successfully."
            if all_passed
            else f"Finished with issues: {len(completed)} succeeded, {len(failed)} failed."
        ),
        "timestamp": _ts(),
    })

    logger.info(f"DAG execution done: {len(completed)} completed, {len(failed)} failed")

    # ── Post-DAG: Auto-merge + auto-install + auto-run ──
    if all_passed and len(completed) > 0:
        try:
            merged = await _auto_merge(project_path, dag, completed, broadcast)
            if merged:
                await _auto_install_deps(project_path, len(merged), broadcast)
                if run_command.strip():
                    await _auto_run(project_path, run_command.strip(), broadcast)
        except Exception as exc:
            logger.error(f"Post-DAG automation error: {exc}", exc_info=True)
            await broadcast({
                "agent_id": "orchestrator", "type": "error",
                "text": f"Post-merge error: {exc}", "timestamp": _ts(),
            })
