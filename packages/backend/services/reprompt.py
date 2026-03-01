"""
Reprompt engine — rewrites sloppy dev input into precise engineering prompts.
Uses Mistral Small. Falls back to original message if API key not set or call fails.
"""
import logging
from services.mistral_client import get_client

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
You are a prompt engineer for a multi-agent coding orchestration system called Alchemistral.

Your job: take a developer's casual/vague message and rewrite it as a precise, actionable \
engineering prompt that an AI orchestrator can decompose into tasks.

Rules:
- Keep the developer's intent exactly
- Add technical specificity (endpoints, components, data models)
- Mention technologies from the project's global memory when relevant
- Output ONLY the refined prompt, nothing else
- Be concise — no preamble, no explanation\
"""


async def reprompt(message: str, global_memory: str) -> str:
    """Refine a developer message. Returns refined string, falls back to original."""
    client = get_client()
    if not client.api_key:
        logger.warning("MISTRAL_API_KEY not set — reprompt returning original message")
        return message

    user_content = f"Global memory:\n{global_memory}\n\nDeveloper message:\n{message}"
    try:
        return await client.chat(
            model="mistral-small-latest",
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            temperature=0.3,
        )
    except Exception as exc:
        logger.warning(f"Reprompt API error, returning original: {exc}")
        return message
