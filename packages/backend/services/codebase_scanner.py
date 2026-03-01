"""
Codebase Scanner — analyses a project's files, stack, and structure on first open.

Runs ONCE at project creation. Produces:
  1. .alchemistral/codebase-summary.md  (raw scan data)
  2. .alchemistral/GLOBAL.md            (LLM-generated project intelligence)
"""
import asyncio
import logging
from pathlib import Path

from services.mistral_client import get_client

logger = logging.getLogger(__name__)

# Directories to skip when scanning
_SKIP_DIRS = {
    ".git", "node_modules", ".worktrees", "__pycache__", ".venv", "venv",
    ".tox", ".mypy_cache", ".pytest_cache", "dist", "build", ".next",
    ".nuxt", "target", "out", ".turbo", ".cache", "coverage",
}

# Stack detection: filename → stack label
_STACK_MARKERS: dict[str, str] = {
    "CMakeLists.txt": "C/C++ (CMake)",
    "Makefile": "Make build system",
    "package.json": "Node.js / JavaScript",
    "tsconfig.json": "TypeScript",
    "Cargo.toml": "Rust (Cargo)",
    "go.mod": "Go",
    "pyproject.toml": "Python (pyproject)",
    "requirements.txt": "Python (pip)",
    "setup.py": "Python (setuptools)",
    "Pipfile": "Python (Pipenv)",
    "poetry.lock": "Python (Poetry)",
    "Gemfile": "Ruby (Bundler)",
    "pom.xml": "Java (Maven)",
    "build.gradle": "Java/Kotlin (Gradle)",
    "*.sln": "C# / .NET",
    "mix.exs": "Elixir (Mix)",
    "deno.json": "Deno",
    "composer.json": "PHP (Composer)",
    "Dockerfile": "Docker",
    "docker-compose.yml": "Docker Compose",
    "docker-compose.yaml": "Docker Compose",
}

# Source file extensions to sample imports from
_SOURCE_EXTS = {
    ".py", ".js", ".ts", ".tsx", ".jsx", ".rs", ".go", ".c", ".cpp", ".h",
    ".hpp", ".java", ".kt", ".rb", ".ex", ".exs", ".cs", ".php", ".swift",
    ".zig", ".lua", ".vue", ".svelte",
}

_GLOBAL_SYSTEM_PROMPT = """\
You are analyzing a codebase to create a project memory file for Alchemistral, \
a multi-agent coding orchestrator. Based on the scan below, generate a GLOBAL.md \
with these sections:

## Project Overview
(What is this project? What does it do?)

## Stack
(Language, frameworks, build system, dependencies)

## Architecture
(Key modules/directories and what they do)

## Conventions
(Coding style, naming, patterns detected)

## Entry Points
(Main files, build commands)

Be specific to THIS project. If it's C++ with CMake, say so. If it's a game engine, \
describe the engine architecture. Never mention TypeScript unless the project actually \
uses it. Never invent files that don't appear in the scan. Be concise — max 80 lines.\
"""


def _collect_files(project_path: str, max_files: int = 200) -> list[str]:
    """Walk project tree, skip junk dirs, return relative paths (max_files cap)."""
    root = Path(project_path)
    files: list[str] = []
    for item in sorted(root.rglob("*")):
        # Skip directories themselves
        if item.is_dir():
            continue
        # Check if any parent is a skip dir
        parts = item.relative_to(root).parts
        if any(p in _SKIP_DIRS for p in parts):
            continue
        # Skip hidden files/dirs (except .alchemistral)
        if any(p.startswith(".") and p != ".alchemistral" for p in parts):
            continue
        files.append(str(item.relative_to(root)))
        if len(files) >= max_files:
            break
    return files


def _detect_stack(project_path: str, files: list[str]) -> list[str]:
    """Detect stack by checking for known marker files."""
    root = Path(project_path)
    detected: list[str] = []
    filenames = {Path(f).name for f in files}

    for marker, label in _STACK_MARKERS.items():
        if marker.startswith("*"):
            # Glob match (e.g. *.sln)
            ext = marker[1:]
            if any(f.endswith(ext) for f in files):
                if label not in detected:
                    detected.append(label)
        else:
            if marker in filenames:
                if label not in detected:
                    detected.append(label)
    return detected


def _read_readme(project_path: str, max_chars: int = 2000) -> str:
    """Read README.md first N chars if it exists."""
    for name in ("README.md", "readme.md", "Readme.md", "README.rst", "README"):
        p = Path(project_path) / name
        if p.exists():
            try:
                text = p.read_text(errors="replace")[:max_chars]
                return f"=== {name} (first {max_chars} chars) ===\n{text}"
            except Exception:
                pass
    return ""


def _sample_imports(project_path: str, files: list[str], max_files: int = 10, max_lines: int = 10) -> str:
    """Read first N lines of top source files to capture imports/includes."""
    root = Path(project_path)
    source_files = [f for f in files if Path(f).suffix in _SOURCE_EXTS][:max_files]
    parts: list[str] = []
    for f in source_files:
        try:
            lines = (root / f).read_text(errors="replace").splitlines()[:max_lines]
            parts.append(f"=== {f} (first {max_lines} lines) ===\n" + "\n".join(lines))
        except Exception:
            pass
    return "\n\n".join(parts)


def build_codebase_summary(project_path: str) -> str:
    """Build a raw codebase summary string (no LLM call)."""
    files = _collect_files(project_path)
    stack = _detect_stack(project_path, files)
    readme = _read_readme(project_path)
    imports = _sample_imports(project_path, files)

    sections = [
        f"# Codebase Scan\n\nScanned: {len(files)} files",
        f"## Detected Stack\n{chr(10).join(f'- {s}' for s in stack) if stack else '(none detected)'}",
        f"## File Tree\n{chr(10).join(files)}",
    ]
    if readme:
        sections.append(f"## README\n{readme}")
    if imports:
        sections.append(f"## Source Samples (imports)\n{imports}")

    return "\n\n".join(sections)


async def scan_and_generate_global(project_path: str) -> None:
    """
    Full scan flow — called once at project creation.
    1. Build codebase-summary.md
    2. Call Mistral Large to generate intelligent GLOBAL.md
    3. Write both files to .alchemistral/
    """
    alch = Path(project_path) / ".alchemistral"
    alch.mkdir(parents=True, exist_ok=True)

    # Step 1: raw scan
    summary = await asyncio.to_thread(build_codebase_summary, project_path)
    (alch / "codebase-summary.md").write_text(summary)
    logger.info(f"Wrote codebase-summary.md for {project_path}")

    # Step 2: call Mistral Large for intelligent GLOBAL.md
    client = get_client()
    if not client.api_key:
        logger.warning("MISTRAL_API_KEY not set — skipping LLM-generated GLOBAL.md")
        return

    try:
        global_md = await client.chat(
            model="mistral-large-latest",
            messages=[
                {"role": "system", "content": _GLOBAL_SYSTEM_PROMPT},
                {"role": "user", "content": summary},
            ],
            temperature=0.3,
        )
        (alch / "GLOBAL.md").write_text(global_md)
        logger.info(f"Wrote LLM-generated GLOBAL.md for {project_path}")
    except Exception as exc:
        logger.warning(f"Failed to generate GLOBAL.md via LLM: {exc}")
