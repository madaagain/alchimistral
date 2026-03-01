"""
Reprompt engine — rewrites sloppy dev input into precise engineering prompts.
Uses Mistral Small. Falls back to original message if API key not set or call fails.
"""
import logging
from services.mistral_client import get_client

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
You are a prompt engineer for a multi-agent coding orchestration system called Alchemistral.

Your job: classify the developer's message and either refine it or pass it through.

Step 1 — Classify intent:
- "mission" = the developer wants to BUILD, CREATE, IMPLEMENT, FIX, ADD, REFACTOR, DELETE, \
or otherwise CHANGE code. Any actionable request that requires agents to write code.
- "conversation" = the developer is ASKING A QUESTION, requesting EXPLANATION, wanting \
ANALYSIS, asking for SUGGESTIONS, or having a discussion. No code changes needed.

Step 2 — If mission: rewrite the message as a precise, actionable engineering prompt.
If conversation: keep the message as-is (pass through unchanged).

Rules:
- Keep the developer's intent exactly
- Add technical specificity only for missions (endpoints, components, data models)
- Reference the project's actual stack and files from the codebase summary
- Output ONLY valid JSON, no markdown, no code block

Output format (raw JSON only):
{"intent": "mission" or "conversation", "refined": "the refined or original message"}\
"""


async def reprompt(message: str, global_memory: str, codebase_summary: str = "") -> dict:
    """
    Classify and refine a developer message.

    Returns: {"intent": "mission"|"conversation", "refined": "..."}
    Falls back to {"intent": "mission", "refined": original_message} on failure.
    """
    fallback = {"intent": "mission", "refined": message}

    client = get_client()
    if not client.api_key:
        logger.warning("MISTRAL_API_KEY not set — reprompt returning original message")
        return fallback

    ctx_parts = []
    if global_memory.strip():
        ctx_parts.append(f"Project memory:\n{global_memory}")
    if codebase_summary.strip():
        ctx_parts.append(f"Codebase scan:\n{codebase_summary}")
    ctx_parts.append(f"Developer message:\n{message}")
    user_content = "\n\n".join(ctx_parts)

    try:
        raw = await client.chat(
            model="mistral-small-latest",
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            temperature=0.3,
        )
        return _parse_reprompt(raw, message)
    except Exception as exc:
        logger.warning(f"Reprompt API error, returning original: {exc}")
        return fallback


def _parse_reprompt(raw: str, original: str) -> dict:
    """Parse reprompt JSON response, with fallback."""
    import json
    text = raw.strip()
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
    try:
        result = json.loads(text)
        intent = result.get("intent", "mission")
        refined = result.get("refined", original)
        if intent not in ("mission", "conversation"):
            intent = "mission"
        return {"intent": intent, "refined": refined}
    except (json.JSONDecodeError, AttributeError):
        logger.warning(f"Reprompt JSON parse failed, treating as mission: {text[:100]}")
        return {"intent": "mission", "refined": text if text else original}
