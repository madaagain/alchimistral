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
    if not any(p["id"] == project_id for p in projects):
        raise HTTPException(404, f"Project not found: {project_id}")
    save_projects([p for p in projects if p["id"] != project_id])
    return {"status": "deleted"}
