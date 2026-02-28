"""
Alchemistral service — project storage and .alchemistral/ directory management.
"""
import json
from pathlib import Path

GLOBAL_STORAGE = Path.home() / ".alchemistral"
PROJECTS_FILE = GLOBAL_STORAGE / "projects.json"


def _ensure_global_storage() -> None:
    GLOBAL_STORAGE.mkdir(parents=True, exist_ok=True)
    if not PROJECTS_FILE.exists():
        PROJECTS_FILE.write_text("[]")


def load_projects() -> list[dict]:
    _ensure_global_storage()
    return json.loads(PROJECTS_FILE.read_text())


def save_projects(projects: list[dict]) -> None:
    _ensure_global_storage()
    PROJECTS_FILE.write_text(json.dumps(projects, indent=2))


def get_project(project_id: str) -> dict | None:
    for p in load_projects():
        if p["id"] == project_id:
            return p
    return None


GLOBAL_MD_TEMPLATE = """\
# Global Memory

## Stack

## Conventions

## Decisions
"""

ARCHITECTURE_TEMPLATE = json.dumps(
    {"agents": [], "dag": [], "contracts": []}, indent=2
)


def init_alchemistral_dir(local_path: str) -> None:
    """Create the .alchemistral/ directory structure inside a project."""
    base = Path(local_path) / ".alchemistral"
    base.mkdir(exist_ok=True)
    (base / "contracts").mkdir(exist_ok=True)
    (base / "agents").mkdir(exist_ok=True)

    defaults = {
        "GLOBAL.md": GLOBAL_MD_TEMPLATE,
        "architecture.json": ARCHITECTURE_TEMPLATE,
        "todos.json": "[]",
        "decisions.log": "",
    }
    for name, content in defaults.items():
        f = base / name
        if not f.exists():
            f.write_text(content)
