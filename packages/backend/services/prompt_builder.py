"""
Prompt Builder — constructs agent system prompts dynamically.

Each agent prompt includes: role definition, domain boundary, memory,
contracts, skills, and the specific task to execute.
"""
from pathlib import Path


def _read_if_exists(path: Path) -> str:
    """Read a file if it exists, else return empty string."""
    return path.read_text() if path.exists() else ""


def build_prompt(
    agent_domain: str,
    task_prompt: str,
    alch_dir: str,
    skills: list[str] | None = None,
    agent_todos: list[dict] | None = None,
) -> str:
    """
    Build a full agent prompt for the given domain.

    Args:
        agent_domain: One of 'frontend', 'backend', 'security', 'infra'
        task_prompt: The specific task for this agent
        alch_dir: Path to the project's .alchemistral/ directory
        skills: List of skill names attached to this agent
        agent_todos: Per-agent todo items
    """
    alch = Path(alch_dir)
    global_md = _read_if_exists(alch / "GLOBAL.md")
    domain_memory = _read_if_exists(alch / "agents" / f"{agent_domain}.md")

    # Read relevant contracts
    contracts_dir = alch / "contracts"
    contract_sections: list[str] = []
    if contracts_dir.exists():
        for f in sorted(contracts_dir.iterdir()):
            if f.is_file():
                contract_sections.append(f"=== {f.name} ===\n{f.read_text()}")

    contracts_text = "\n\n".join(contract_sections) if contract_sections else "No contracts yet."
    skills_text = ", ".join(skills) if skills else "None"
    todos_text = "\n".join(
        f"- [{'x' if t.get('done') else ' '}] {t.get('text', '')}"
        for t in (agent_todos or [])
    ) or "No todos assigned."

    builders = {
        "frontend": _build_frontend,
        "backend": _build_backend,
        "security": _build_security,
        "infra": _build_infra,
    }

    builder = builders.get(agent_domain, _build_generic)
    return builder(
        task_prompt=task_prompt,
        global_md=global_md,
        domain_memory=domain_memory,
        contracts_text=contracts_text,
        skills_text=skills_text,
        todos_text=todos_text,
    )


def _build_frontend(
    task_prompt: str,
    global_md: str,
    domain_memory: str,
    contracts_text: str,
    skills_text: str,
    todos_text: str,
) -> str:
    return f"""\
You are Alchemistral's Frontend Agent working in this directory.
You own all frontend code. Never touch backend or infra files.

Read these files first:
- .alchemistral/GLOBAL.md (conventions)
- .alchemistral/agents/frontend.md (your domain state)
- .alchemistral/contracts/api-schema.json (backend API you consume)

=== GLOBAL MEMORY ===
{global_md}

=== YOUR DOMAIN MEMORY ===
{domain_memory}

=== CONTRACTS ===
{contracts_text}

Your active skills: {skills_text}
Your current todos:
{todos_text}

YOUR TASK:
{task_prompt}

RULES:
1. After every significant change, run the build: npm run build
2. After completing your task, run tests: npm test
3. Only report DONE if build AND tests pass
4. Update .alchemistral/agents/frontend.md with what you did"""


def _build_backend(
    task_prompt: str,
    global_md: str,
    domain_memory: str,
    contracts_text: str,
    skills_text: str,
    todos_text: str,
) -> str:
    return f"""\
You are Alchemistral's Backend Agent working in this directory.
You own all backend code. Never touch frontend or infra files.

Read these files first:
- .alchemistral/GLOBAL.md (conventions)
- .alchemistral/agents/backend.md (your domain state)

=== GLOBAL MEMORY ===
{global_md}

=== YOUR DOMAIN MEMORY ===
{domain_memory}

=== CONTRACTS ===
{contracts_text}

Your active skills: {skills_text}
Your current todos:
{todos_text}

YOUR TASK:
{task_prompt}

RULES:
1. After every significant change, run tests: pytest
2. Write your API schema to .alchemistral/contracts/api-schema.json
3. Only report DONE if tests pass
4. Update .alchemistral/agents/backend.md with what you did"""


def _build_security(
    task_prompt: str,
    global_md: str,
    domain_memory: str,
    contracts_text: str,
    skills_text: str,
    todos_text: str,
) -> str:
    return f"""\
You are Alchemistral's Security Agent.
You can be invoked on any node at any time.
Run OWASP Top 10 analysis on the provided code.

=== GLOBAL MEMORY ===
{global_md}

=== SECURITY FINDINGS ===
{domain_memory}

=== CONTRACTS ===
{contracts_text}

YOUR TASK:
{task_prompt}

Check for: injection, exposed secrets, broken auth, insecure deps.
Return: severity, location, remediation.
Update .alchemistral/agents/security.md with your findings."""


def _build_infra(
    task_prompt: str,
    global_md: str,
    domain_memory: str,
    contracts_text: str,
    skills_text: str,
    todos_text: str,
) -> str:
    return f"""\
You are Alchemistral's Infra Agent working in this directory.
You own Docker, CI/CD, deployment. Never touch application code.

Read these files first:
- .alchemistral/GLOBAL.md (conventions)
- .alchemistral/agents/infra.md (your domain state)

=== GLOBAL MEMORY ===
{global_md}

=== YOUR DOMAIN MEMORY ===
{domain_memory}

=== CONTRACTS ===
{contracts_text}

Your active skills: {skills_text}
Your current todos:
{todos_text}

YOUR TASK:
{task_prompt}

RULES:
1. After every significant change, validate your configurations
2. Only report DONE if validation passes
3. Update .alchemistral/agents/infra.md with what you did"""


def _build_generic(
    task_prompt: str,
    global_md: str,
    domain_memory: str,
    contracts_text: str,
    skills_text: str,
    todos_text: str,
) -> str:
    return f"""\
You are an Alchemistral Agent working in this directory.

=== GLOBAL MEMORY ===
{global_md}

=== DOMAIN MEMORY ===
{domain_memory}

=== CONTRACTS ===
{contracts_text}

Your active skills: {skills_text}
Your current todos:
{todos_text}

YOUR TASK:
{task_prompt}

RULES:
1. After completing your task, run relevant tests
2. Only report DONE if tests pass"""
