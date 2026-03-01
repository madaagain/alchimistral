"""
Projects router — CRUD for named projects stored in ~/.alchemistral/projects.json
"""
import asyncio
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.alchemistral import (
    get_project,
    init_alchemistral_dir,
    load_projects,
    save_projects,
)
from services.codebase_scanner import scan_and_generate_global
from services.agent_manager import agent_manager
from services.worktree import list_worktrees, _run_git

router = APIRouter(prefix="/api/projects", tags=["projects"])


class CreateProjectRequest(BaseModel):
    name: str
    source: str  # "clone" | "local" | "init"
    repo_url: str | None = None
    local_path: str | None = None
    cli_adapter: str = "vibe"


@router.get("")
async def list_projects():
    return load_projects()


@router.post("")
async def create_project(req: CreateProjectRequest):
    if req.source == "clone":
        if not req.repo_url:
            raise HTTPException(400, "repo_url required for clone source")
        repo_name = req.repo_url.rstrip("/").split("/")[-1].removesuffix(".git")
        local_path = str(Path.home() / "alchemistral-projects" / repo_name)
        Path(local_path).parent.mkdir(parents=True, exist_ok=True)
        proc = await asyncio.create_subprocess_exec(
            "git", "clone", req.repo_url, local_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await proc.communicate()
        if proc.returncode != 0:
            raise HTTPException(500, f"git clone failed: {stderr.decode()}")

    elif req.source == "local":
        if not req.local_path:
            raise HTTPException(400, "local_path required for local source")
        local_path = req.local_path
        if not Path(local_path).exists():
            raise HTTPException(400, f"Path does not exist: {local_path}")

    elif req.source == "init":
        if not req.local_path:
            raise HTTPException(400, "local_path required for init source")
        local_path = req.local_path
        Path(local_path).mkdir(parents=True, exist_ok=True)
        proc = await asyncio.create_subprocess_exec(
            "git", "init", local_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        await proc.communicate()

    else:
        raise HTTPException(400, f"Invalid source: {req.source!r}")

    init_alchemistral_dir(local_path)

    # Run codebase scan in background — generates codebase-summary.md + smart GLOBAL.md
    asyncio.create_task(scan_and_generate_global(local_path))

    project = {
        "id": str(uuid.uuid4()),
        "name": req.name,
        "source": req.source,
        "repo_url": req.repo_url,
        "local_path": local_path,
        "cli_adapter": req.cli_adapter,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "idle",
    }

    projects = load_projects()
    projects.append(project)
    save_projects(projects)
    return project


@router.get("/{project_id}")
async def get_project_by_id(project_id: str):
    project = get_project(project_id)
    if not project:
        raise HTTPException(404, f"Project not found: {project_id}")
    return project


@router.delete("/{project_id}")
async def delete_project(project_id: str):
    projects = load_projects()
    project = next((p for p in projects if p["id"] == project_id), None)
    if not project:
        raise HTTPException(404, f"Project not found: {project_id}")

    local_path = project.get("local_path", "")
    errors: list[str] = []

    if local_path and Path(local_path).exists():
        # 1. Remove all git worktrees
        try:
            worktrees = await list_worktrees(local_path)
            for wt in worktrees:
                wt_path = wt.get("path", "")
                # Skip the main worktree (the project root itself)
                if wt_path == local_path:
                    continue
                rc, _, err = await _run_git(local_path, "worktree", "remove", wt_path, "--force")
                if rc != 0:
                    errors.append(f"worktree remove {wt_path}: {err.strip()}")
        except Exception as exc:
            errors.append(f"worktree cleanup: {exc}")

        # 2. Delete all agent/* branches
        try:
            rc, out, _ = await _run_git(local_path, "branch", "--list", "agent/*")
            if rc == 0 and out.strip():
                for line in out.strip().splitlines():
                    branch = line.strip().lstrip("* ")
                    if branch:
                        rc2, _, err2 = await _run_git(local_path, "branch", "-D", branch)
                        if rc2 != 0:
                            errors.append(f"branch -D {branch}: {err2.strip()}")
        except Exception as exc:
            errors.append(f"branch cleanup: {exc}")

        # 3. Remove .worktrees/ directory
        import shutil
        wt_dir = Path(local_path) / ".worktrees"
        if wt_dir.exists():
            try:
                shutil.rmtree(wt_dir)
            except Exception as exc:
                errors.append(f"rmtree .worktrees: {exc}")

        # 4. Remove .alchemistral/ directory
        alch_dir = Path(local_path) / ".alchemistral"
        if alch_dir.exists():
            try:
                shutil.rmtree(alch_dir)
            except Exception as exc:
                errors.append(f"rmtree .alchemistral: {exc}")

    # 5. Clear agents for this project from agent_manager
    if project_id in agent_manager._agents:
        del agent_manager._agents[project_id]

    # 6. Remove from projects.json
    save_projects([p for p in projects if p["id"] != project_id])

    return {"status": "deleted", "errors": errors if errors else None}


@router.get("/{project_id}/files")
async def list_files(project_id: str, path: str = ""):
    """List files in project directory. Skip hidden dirs except .alchemistral."""
    project = get_project(project_id)
    if not project:
        raise HTTPException(404, f"Project not found: {project_id}")

    base = Path(project["local_path"])
    target = base / path if path else base
    if not target.exists() or not target.is_dir():
        return []

    entries = []
    try:
        for item in sorted(target.iterdir(), key=lambda p: (not p.is_dir(), p.name)):
            name = item.name
            # Skip hidden except .alchemistral
            if name.startswith(".") and name != ".alchemistral":
                continue
            # Skip common junk
            if name in ("node_modules", "__pycache__", ".git", ".venv", "venv"):
                continue
            rel = str(item.relative_to(base))
            if item.is_dir():
                entries.append({"name": name, "type": "dir", "path": rel})
            else:
                entries.append({"name": name, "type": "file", "path": rel})
    except PermissionError:
        pass

    return entries
