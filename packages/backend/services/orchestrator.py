"""
Orchestrator — decomposes a refined prompt into a DAG of agent tasks.
Uses Mistral Large. Falls back to a mock result if API key not set or call fails.
"""
import json
import logging
from services.mistral_client import get_client

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
You are the orchestrator of Alchemistral, a multi-agent coding system. You coordinate AI \
coding agents that work in parallel on isolated git worktrees.

You NEVER write code. You ONLY:
1. Analyze the request and project context
2. Decompose into a DAG of tasks with dependencies
3. Define which agent domain handles each task (frontend, backend, security)
4. Generate interface contracts between agents (API schemas, TypeScript types)
5. Update global memory with architectural decisions

Respond in this exact JSON format (no markdown, no code block, raw JSON only):
{
  "analysis": "Brief analysis of the request and how it maps to the codebase",
  "run_command": "Shell command to verify the result works after all tasks complete (e.g. 'python app.py', 'pytest', 'npm start', 'python -m mymodule')",
  "dag": [
    {
      "id": "t1",
      "label": "Short task description",
      "agent_domain": "frontend",
      "agent_type": "parent",
      "parent_id": null,
      "dependencies": [],
      "prompt": "The detailed prompt this agent will receive to execute the task"
    }
  ],
  "contracts": [
    {
      "file": "api-schema.json",
      "content": "The actual contract content as a string",
      "written_by": "backend",
      "read_by": ["frontend"]
    }
  ],
  "memory_updates": {
    "global_additions": ["New decisions or conventions to add to GLOBAL.md"],
    "architecture_changes": "Description of architecture updates"
  }
}

Include a 'run_command' field at the root of your JSON response with the shell command to verify the result \
works after all tasks complete. Examples: 'python -m pong.game', 'pytest', 'python app.py', 'npm start'. \
Pick the most appropriate verification command for the project stack.

CRITICAL: Read the codebase summary carefully. Your tasks MUST match the actual project stack. \
If the project is C++, never create TypeScript tasks. If it has CMakeLists.txt, the build system \
is CMake. Reference ACTUAL files from the scan, not imaginary ones. If the project uses Python, \
agents must run pytest. If it uses Node.js, agents must run npm test.

Rules:
- agent_domain must be one of: frontend, backend, security, infra
- agent_type must be one of: parent, child
- Tasks with no dependencies can run in parallel
- Child tasks depend on their parent being started first
- Always generate contracts when frontend and backend need to communicate
- Contract format: OpenAPI-style JSON for APIs, TypeScript interfaces for shared types
- Keep task prompts specific — each agent only knows its own domain
- Maximum 10 tasks per decomposition
- Output ONLY valid JSON, no prose, no explanation\
"""


def _mock_result(refined_prompt: str) -> dict:
    snippet = refined_prompt[:80].replace("\n", " ")
    return {
        "analysis": (
            f"Mock analysis (MISTRAL_API_KEY not configured). "
            f'Request: "{snippet}..." — showing example decomposition.'
        ),
        "run_command": "echo 'mock run — no verification command'",
        "dag": [
            {
                "id": "t1",
                "label": "Define API schema and data models",
                "agent_domain": "backend",
                "agent_type": "parent",
                "parent_id": None,
                "dependencies": [],
                "prompt": (
                    f"Design and implement the API schema and Pydantic models for: {refined_prompt}. "
                    "Write the OpenAPI schema to .alchemistral/contracts/api-schema.json."
                ),
            },
            {
                "id": "t2",
                "label": "Implement backend endpoints",
                "agent_domain": "backend",
                "agent_type": "parent",
                "parent_id": None,
                "dependencies": ["t1"],
                "prompt": (
                    "Implement the FastAPI endpoints based on .alchemistral/contracts/api-schema.json. "
                    "Run pytest after each change. Report DONE only when all tests pass."
                ),
            },
            {
                "id": "t3",
                "label": "Build frontend UI components",
                "agent_domain": "frontend",
                "agent_type": "parent",
                "parent_id": None,
                "dependencies": ["t1"],
                "prompt": (
                    "Build the React components. Read .alchemistral/contracts/api-schema.json first. "
                    "Run npm run build after changes. Report DONE only when build passes."
                ),
            },
            {
                "id": "t4",
                "label": "Security audit",
                "agent_domain": "security",
                "agent_type": "parent",
                "parent_id": None,
                "dependencies": ["t2", "t3"],
                "prompt": (
                    "Run OWASP Top 10 analysis on the implemented code. "
                    "Check for injection, exposed secrets, broken auth, insecure deps. "
                    "Return: severity, location, remediation."
                ),
            },
        ],
        "contracts": [
            {
                "file": "api-schema.json",
                "content": json.dumps(
                    {
                        "info": "Mock API schema — MISTRAL_API_KEY not configured",
                        "description": f"Auto-generated for: {snippet}",
                        "endpoints": [
                            {
                                "path": "/api/resource",
                                "method": "GET",
                                "response": {"items": "array"},
                            },
                            {
                                "path": "/api/resource",
                                "method": "POST",
                                "body": {"name": "string"},
                                "response": {"id": "string", "name": "string"},
                            },
                        ],
                    },
                    indent=2,
                ),
                "written_by": "backend",
                "read_by": ["frontend"],
            }
        ],
        "memory_updates": {
            "global_additions": [
                "Mock orchestration run (MISTRAL_API_KEY not configured)",
                f"Feature requested: {snippet}",
            ],
            "architecture_changes": "Example decomposition — 4 tasks, 2 parallel tracks (backend + frontend), security audit gating.",
        },
    }


def _parse_response(text: str, refined_prompt: str) -> dict:
    text = text.strip()
    print(f"[orchestrator] raw response first 100 chars: {text[:100]!r}")
    # Strip markdown code block if present
    if text.startswith("```"):
        lines = text.split("\n")
        start = 1
        end = len(lines)
        for i in range(len(lines) - 1, 0, -1):
            if lines[i].strip() == "```":
                end = i
                break
        text = "\n".join(lines[start:end])
        print(f"[orchestrator] stripped markdown block, reparsing: {text[:100]!r}")
    try:
        result = json.loads(text)
        print(f"[orchestrator] JSON parsed OK — dag tasks: {len(result.get('dag', []))}")
        return result
    except json.JSONDecodeError as exc:
        print(f"[orchestrator] JSON parse FAILED: {exc}")
        print(f"[orchestrator] full raw text:\n{text}")
        logger.warning(f"Orchestrator response parse failed: {exc}")
        return _mock_result(refined_prompt)


async def orchestrate(
    refined_prompt: str,
    global_memory: str,
    architecture: str,
    contracts: list[str],
    codebase_summary: str = "",
) -> dict:
    """Decompose a refined prompt into a DAG plan. Falls back to mock on any failure."""
    client = get_client()
    if not client.api_key:
        print("[orchestrator] MISTRAL_API_KEY is empty — using mock")
        logger.warning("MISTRAL_API_KEY not set — orchestrator returning mock result")
        return _mock_result(refined_prompt)

    print(f"[orchestrator] calling mistral-large-latest, key prefix: {client.api_key[:8]}…")

    ctx_parts = [
        f"Global memory:\n{global_memory}" if global_memory.strip() else "",
        f"Codebase scan:\n{codebase_summary}" if codebase_summary.strip() else "",
        f"Architecture:\n{architecture}" if architecture.strip() not in ("", "{}") else "",
        ("Existing contracts:\n" + "\n\n".join(contracts)) if contracts else "",
        f"Mission:\n{refined_prompt}",
    ]
    context = "\n\n".join(p for p in ctx_parts if p)

    try:
        text = await client.chat(
            model="mistral-large-latest",
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": context},
            ],
            temperature=0.2,
        )
        print(f"[orchestrator] API call succeeded, response len: {len(text)}")
        return _parse_response(text, refined_prompt)
    except Exception as exc:
        print(f"[orchestrator] API call FAILED: {type(exc).__name__}: {exc}")
        logger.warning(f"Orchestrator API error, returning mock: {exc}")
        return _mock_result(refined_prompt)
