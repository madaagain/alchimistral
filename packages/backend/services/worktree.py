"""
Git Worktree Manager — create, list, and remove isolated worktrees for agents.

Each agent gets its own worktree under .worktrees/ in the project root,
checked out to a dedicated branch. All worktrees share the same .git history.
"""
import asyncio
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


async def _run_git(cwd: str, *args: str) -> tuple[int, str, str]:
    """Run a git command and return (returncode, stdout, stderr)."""
    proc = await asyncio.create_subprocess_exec(
        "git", *args,
        cwd=cwd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()
    return proc.returncode, stdout.decode(), stderr.decode()


async def create_worktree(project_path: str, agent_id: str) -> str:
    """
    Create a git worktree for an agent.

    Returns the absolute path to the new worktree directory.
    The worktree is checked out to branch agent/{agent_id}.
    """
    wt_dir = Path(project_path) / ".worktrees" / agent_id
    branch = f"agent/{agent_id}"

    if wt_dir.exists():
        logger.info(f"Worktree already exists: {wt_dir}")
        return str(wt_dir)

    wt_dir.parent.mkdir(parents=True, exist_ok=True)

    rc, out, err = await _run_git(
        project_path,
        "worktree", "add", str(wt_dir), "-b", branch,
    )
    if rc != 0:
        raise RuntimeError(f"git worktree add failed: {err}")

    logger.info(f"Created worktree {wt_dir} on branch {branch}")
    return str(wt_dir)


async def list_worktrees(project_path: str) -> list[dict]:
    """List all worktrees for a project."""
    rc, out, err = await _run_git(project_path, "worktree", "list", "--porcelain")
    if rc != 0:
        logger.warning(f"git worktree list failed: {err}")
        return []

    worktrees: list[dict] = []
    current: dict = {}
    for line in out.splitlines():
        if line.startswith("worktree "):
            if current:
                worktrees.append(current)
            current = {"path": line.split(" ", 1)[1]}
        elif line.startswith("HEAD "):
            current["head"] = line.split(" ", 1)[1]
        elif line.startswith("branch "):
            current["branch"] = line.split(" ", 1)[1]
        elif line == "bare":
            current["bare"] = True
    if current:
        worktrees.append(current)

    return worktrees


async def remove_worktree(project_path: str, agent_id: str) -> None:
    """Remove an agent's worktree and its branch."""
    wt_dir = Path(project_path) / ".worktrees" / agent_id
    branch = f"agent/{agent_id}"

    if wt_dir.exists():
        rc, out, err = await _run_git(
            project_path,
            "worktree", "remove", str(wt_dir), "--force",
        )
        if rc != 0:
            logger.warning(f"git worktree remove failed: {err}")

    # Clean up the branch
    rc, out, err = await _run_git(
        project_path,
        "branch", "-D", branch,
    )
    if rc != 0:
        logger.debug(f"Branch cleanup {branch}: {err.strip()}")

    logger.info(f"Removed worktree {wt_dir}")
