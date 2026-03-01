"""
Mission pipeline — the full orchestration flow triggered by a user message.

Flow:
  user message
    → reprompt (Mistral Small) — classifies intent + refines
    → if conversation: Mistral Large answers directly, no DAG
    → if mission:
        → orchestrate (Mistral Large) — decomposes into DAG
        → write contracts to .alchemistral/contracts/
        → update GLOBAL.md
        → update architecture.json
        → append to decisions.log
        → execute DAG (spawn agents)
    → broadcast all events via WebSocket
"""
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Awaitable

from services.alchemistral import get_project
from services.mistral_client import get_client
from services.reprompt import reprompt
from services.orchestrator import orchestrate
from services.dag_executor import execute_dag

logger = logging.getLogger(__name__)


def _ts() -> str:
    return datetime.now(timezone.utc).isoformat()


def _read_file(path: Path) -> str:
    """Read a file if it exists, return empty string otherwise."""
    return path.read_text() if path.exists() else ""


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
    global_md = _read_file(alch / "GLOBAL.md")
    codebase_summary = _read_file(alch / "codebase-summary.md")
    arch_json = _read_file(alch / "architecture.json") or "{}"

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

    reprompt_result = await reprompt(message, global_md, codebase_summary)
    intent = reprompt_result["intent"]
    refined = reprompt_result["refined"]

    await broadcast({
        "agent_id": "orchestrator",
        "type": "reprompt",
        "original": message,
        "refined": refined,
        "intent": intent,
        "timestamp": _ts(),
    })

    # ── Branch: Conversation vs Mission ──────────────────────────────────────

    if intent == "conversation":
        await _handle_conversation(message, global_md, codebase_summary, broadcast)
        return

    # ── Mission flow continues below ─────────────────────────────────────────

    # ── Step 2: Orchestrate ─────────────────────────────────────────────────
    await broadcast({
        "agent_id": "orchestrator",
        "type": "thinking",
        "text": "Analyzing repository structure and decomposing into agent tasks...",
        "timestamp": _ts(),
    })

    result = await orchestrate(refined, global_md, arch_json, contract_texts, codebase_summary)

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
            project_id=project_id,
        )


_CONVERSATION_SYSTEM = """\
You are Alchemistral's assistant — a staff-level engineering copilot. You have full \
knowledge of the project's codebase, stack, and architecture.

Answer the developer's question using the project context provided. Be specific, \
reference actual files and patterns from the codebase. Be concise and technical. \
If you suggest code changes, tell the developer to send a mission instead.\
"""


async def _handle_conversation(
    message: str,
    global_md: str,
    codebase_summary: str,
    broadcast: Callable[[dict], Awaitable[None]],
) -> None:
    """Handle a conversation-type message — answer directly, no DAG."""
    await broadcast({
        "agent_id": "orchestrator",
        "type": "thinking",
        "text": "Thinking...",
        "timestamp": _ts(),
    })

    client = get_client()
    if not client.api_key:
        await broadcast({
            "agent_id": "orchestrator",
            "type": "assistant",
            "text": "I can't answer questions without a Mistral API key configured. Please add one in Settings.",
            "timestamp": _ts(),
        })
        return

    ctx_parts = []
    if global_md.strip():
        ctx_parts.append(f"Project memory:\n{global_md}")
    if codebase_summary.strip():
        ctx_parts.append(f"Codebase scan:\n{codebase_summary}")
    ctx_parts.append(f"Developer question:\n{message}")
    user_content = "\n\n".join(ctx_parts)

    try:
        response = await client.chat(
            model="mistral-large-latest",
            messages=[
                {"role": "system", "content": _CONVERSATION_SYSTEM},
                {"role": "user", "content": user_content},
            ],
            temperature=0.4,
        )
        await broadcast({
            "agent_id": "orchestrator",
            "type": "assistant",
            "text": response,
            "timestamp": _ts(),
        })
    except Exception as exc:
        logger.warning(f"Conversation API error: {exc}")
        await broadcast({
            "agent_id": "orchestrator",
            "type": "error",
            "text": f"Failed to get response: {exc}",
            "timestamp": _ts(),
        })
