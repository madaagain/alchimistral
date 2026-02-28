"""
Memory router — read/write .alchemistral/ files for a project.
"""
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.alchemistral import get_project

router = APIRouter(prefix="/api/projects", tags=["memory"])


def _alch_dir(project_id: str) -> Path:
    project = get_project(project_id)
    if not project:
        raise HTTPException(404, f"Project not found: {project_id}")
    d = Path(project["local_path"]) / ".alchemistral"
    if not d.exists():
        raise HTTPException(404, ".alchemistral/ directory not found in project")
    return d


class WriteBody(BaseModel):
    content: str


class AppendBody(BaseModel):
    entry: str


# ── Global memory ───────────────────────────────────────────────────────────

@router.get("/{project_id}/memory/global")
async def get_global_memory(project_id: str):
    alch = _alch_dir(project_id)
    f = alch / "GLOBAL.md"
    return {"content": f.read_text() if f.exists() else ""}


@router.put("/{project_id}/memory/global")
async def write_global_memory(project_id: str, body: WriteBody):
    alch = _alch_dir(project_id)
    (alch / "GLOBAL.md").write_text(body.content)
    return {"status": "ok"}


# ── Agent memories ──────────────────────────────────────────────────────────

@router.get("/{project_id}/memory/agents")
async def list_agent_memories(project_id: str):
    alch = _alch_dir(project_id)
    agents_dir = alch / "agents"
    if not agents_dir.exists():
        return []
    return [f.name for f in sorted(agents_dir.glob("*.md"))]


@router.get("/{project_id}/memory/agents/{name}")
async def get_agent_memory(project_id: str, name: str):
    alch = _alch_dir(project_id)
    f = alch / "agents" / name
    if not f.exists():
        raise HTTPException(404, f"Agent memory not found: {name}")
    return {"content": f.read_text()}


@router.put("/{project_id}/memory/agents/{name}")
async def write_agent_memory(project_id: str, name: str, body: WriteBody):
    alch = _alch_dir(project_id)
    agents_dir = alch / "agents"
    agents_dir.mkdir(exist_ok=True)
    (agents_dir / name).write_text(body.content)
    return {"status": "ok"}


# ── Decisions log ───────────────────────────────────────────────────────────

@router.get("/{project_id}/memory/decisions")
async def get_decisions(project_id: str):
    alch = _alch_dir(project_id)
    f = alch / "decisions.log"
    return {"content": f.read_text() if f.exists() else ""}


@router.post("/{project_id}/memory/decisions")
async def append_decision(project_id: str, body: AppendBody):
    alch = _alch_dir(project_id)
    ts = datetime.now(timezone.utc).isoformat()
    with open(alch / "decisions.log", "a") as fh:
        fh.write(f"[{ts}] {body.entry}\n")
    return {"status": "ok"}


# ── Contracts ───────────────────────────────────────────────────────────────

@router.get("/{project_id}/contracts")
async def list_contracts(project_id: str):
    alch = _alch_dir(project_id)
    contracts_dir = alch / "contracts"
    if not contracts_dir.exists():
        return []
    return [
        {"file": f.name, "size": f.stat().st_size, "modified": f.stat().st_mtime}
        for f in sorted(contracts_dir.iterdir())
        if f.is_file()
    ]


@router.get("/{project_id}/contracts/{file_name}")
async def get_contract(project_id: str, file_name: str):
    alch = _alch_dir(project_id)
    f = alch / "contracts" / file_name
    if not f.exists():
        raise HTTPException(404, f"Contract not found: {file_name}")
    return {"content": f.read_text()}
