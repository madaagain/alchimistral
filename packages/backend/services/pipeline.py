"""
Mission pipeline — the full orchestration flow triggered by a user message.

Flow:
  user message
    → reprompt (Mistral Small)
    → orchestrate (Mistral Large)
    → write contracts to .alchemistral/contracts/
    → update GLOBAL.md
    → update architecture.json
    → append to decisions.log
    → broadcast all events via WebSocket
"""
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Awaitable

from services.alchemistral import get_project
from services.reprompt import reprompt
from services.orchestrator import orchestrate
from services.dag_executor import execute_dag

logger = logging.getLogger(__name__)


def _ts() -> str:
    return datetime.now(timezone.utc).isoformat()


async def run_mission(
    project_id: str,
    message: str,
    broadcast: Callable[[dict], Awaitable[None]],
) -> None:
    """Run the full pipeline in the background, broadcasting events to all WS clients."""
    try:
        await _pipeline(project_id, message, broadcast)
    except Exception as exc:
        logger.error(f"Mission pipeline error: {exc}", exc_info=True)
        await broadcast({
            "agent_id": "orchestrator",
            "type": "error",
            "text": f"Pipeline error: {exc}",
            "timestamp": _ts(),
        })


async def _pipeline(
    project_id: str,
    message: str,
    broadcast: Callable[[dict], Awaitable[None]],
) -> None:
    project = get_project(project_id)
    if not project:
        raise ValueError(f"Project not found: {project_id}")

    alch = Path(project["local_path"]) / ".alchemistral"

    # Read project context
    global_md = (alch / "GLOBAL.md").read_text() if (alch / "GLOBAL.md").exists() else ""
    arch_json = (alch / "architecture.json").read_text() if (alch / "architecture.json").exists() else "{}"

    contracts_dir = alch / "contracts"
    contract_texts: list[str] = []
    if contracts_dir.exists():
        for f in sorted(contracts_dir.iterdir()):
            if f.is_file():
                contract_texts.append(f"=== {f.name} ===\n{f.read_text()}")

    # ── Step 1: Reprompt ────────────────────────────────────────────────────
    await broadcast({
        "agent_id": "orchestrator",
        "type": "thinking",
        "text": "Refining your request with Reprompt Engine...",
        "timestamp": _ts(),
    })

    refined = await reprompt(message, global_md)

    await broadcast({
        "agent_id": "orchestrator",
        "type": "reprompt",
        "original": message,
        "refined": refined,
        "timestamp": _ts(),
    })

    # ── Step 2: Orchestrate ─────────────────────────────────────────────────
    await broadcast({
        "agent_id": "orchestrator",
        "type": "thinking",
        "text": "Analyzing repository structure and decomposing into agent tasks...",
        "timestamp": _ts(),
    })

    result = await orchestrate(refined, global_md, arch_json, contract_texts)

    # ── Step 3: Stream DAG ──────────────────────────────────────────────────
    await broadcast({
        "agent_id": "orchestrator",
        "type": "dag_update",
        "dag": result.get("dag", []),
        "analysis": result.get("analysis", ""),
        "timestamp": _ts(),
    })

    # ── Step 4: Write contracts ─────────────────────────────────────────────
    contracts_dir.mkdir(parents=True, exist_ok=True)
    for contract in result.get("contracts", []):
        fname: str = contract.get("file", "contract.json")
        content: str = contract.get("content", "")
        (contracts_dir / fname).write_text(content)
        await broadcast({
            "agent_id": "orchestrator",
            "type": "contract_update",
            "file": fname,
            "written_by": contract.get("written_by", "orchestrator"),
            "read_by": contract.get("read_by", []),
            "timestamp": _ts(),
        })

    # ── Step 5: Update GLOBAL.md ────────────────────────────────────────────
    additions: list[str] = result.get("memory_updates", {}).get("global_additions", [])
    if additions:
        new_md = global_md.rstrip()
        if new_md:
            new_md += "\n\n"
        new_md += "## Orchestrator Updates\n" + "\n".join(f"- {a}" for a in additions)
        (alch / "GLOBAL.md").write_text(new_md)
        await broadcast({
            "agent_id": "orchestrator",
            "type": "memory_update",
            "additions": additions,
            "timestamp": _ts(),
        })

    # ── Step 6: Update architecture.json ────────────────────────────────────
    try:
        arch_data = json.loads(arch_json)
    except json.JSONDecodeError:
        arch_data = {}
    arch_data["dag"] = result.get("dag", [])
    arch_data["last_analysis"] = result.get("analysis", "")
    (alch / "architecture.json").write_text(json.dumps(arch_data, indent=2))

    # ── Step 7: Append to decisions.log ────────────────────────────────────
    analysis = result.get("analysis", "")
    if analysis:
        with open(alch / "decisions.log", "a") as fh:
            fh.write(f"[{_ts()}] {analysis}\n")

    # ── Step 8: Ready — start agent execution ─────────────────────────────
    dag = result.get("dag", [])
    n = len(dag)
    await broadcast({
        "agent_id": "orchestrator",
        "type": "ready",
        "text": (
            f"Plan ready. {n} agent task{'s' if n != 1 else ''} queued. "
            "Spawning agents..."
        ),
        "timestamp": _ts(),
    })

    # ── Step 9: Execute DAG — spawn agents with dependency resolution ────
    if dag:
        cli_adapter = project.get("cli_adapter", "vibe")
        await execute_dag(
            dag=dag,
            project_path=project["local_path"],
            alch_dir=str(alch),
            broadcast=broadcast,
            cli_adapter_name=cli_adapter,
        )
