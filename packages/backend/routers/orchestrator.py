"""
Orchestrator router — reprompt, orchestrate, and mission endpoints.
"""
import asyncio
import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.alchemistral import get_project
from services.reprompt import reprompt as _reprompt
from services.orchestrator import orchestrate as _orchestrate
from services.pipeline import run_mission
from ws_manager import manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/projects", tags=["orchestrator"])


class MessageRequest(BaseModel):
    message: str


def _get_alch(project_id: str) -> Path:
    project = get_project(project_id)
    if not project:
        raise HTTPException(404, f"Project not found: {project_id}")
    d = Path(project["local_path"]) / ".alchemistral"
    if not d.exists():
        raise HTTPException(404, ".alchemistral/ directory not found in project")
    return d


# ── Reprompt ────────────────────────────────────────────────────────────────

@router.post("/{project_id}/reprompt")
async def reprompt_endpoint(project_id: str, req: MessageRequest):
    """Refine a developer message. Returns original + refined text."""
    alch = _get_alch(project_id)
    global_md = (alch / "GLOBAL.md").read_text() if (alch / "GLOBAL.md").exists() else ""
    refined = await _reprompt(req.message, global_md)
    return {"original": req.message, "refined": refined}


# ── Orchestrate ──────────────────────────────────────────────────────────────

@router.post("/{project_id}/orchestrate")
async def orchestrate_endpoint(project_id: str, req: MessageRequest):
    """Run orchestrator on a refined prompt. Returns full DAG plan."""
    alch = _get_alch(project_id)
    global_md = (alch / "GLOBAL.md").read_text() if (alch / "GLOBAL.md").exists() else ""
    arch_json = (alch / "architecture.json").read_text() if (alch / "architecture.json").exists() else "{}"
    contracts_dir = alch / "contracts"
    contract_texts: list[str] = []
    if contracts_dir.exists():
        for f in sorted(contracts_dir.iterdir()):
            if f.is_file():
                contract_texts.append(f"=== {f.name} ===\n{f.read_text()}")
    result = await _orchestrate(req.message, global_md, arch_json, contract_texts)
    return result


# ── Mission (full pipeline, fire-and-forget) ─────────────────────────────────

@router.post("/{project_id}/mission")
async def mission_endpoint(project_id: str, req: MessageRequest):
    """
    Start the full pipeline: reprompt → orchestrate → write contracts → update memory.
    Returns immediately; events stream via WebSocket.
    """
    project = get_project(project_id)
    if not project:
        raise HTTPException(404, f"Project not found: {project_id}")
    asyncio.create_task(run_mission(project_id, req.message, manager.broadcast))
    return {"status": "started"}
