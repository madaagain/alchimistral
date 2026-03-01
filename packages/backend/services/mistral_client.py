"""
Mistral API client — thin async wrapper around the chat completions endpoint.
"""
import os
import logging
import httpx

logger = logging.getLogger(__name__)

_BASE_URL = "https://api.mistral.ai/v1"


class MistralClient:
    def __init__(self, api_key: str) -> None:
        self.api_key = api_key

    async def chat(
        self,
        model: str,
        messages: list[dict],
        temperature: float = 0.7,
    ) -> str:
        """Single chat completion. Returns the assistant message text."""
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(
                f"{_BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={"model": model, "messages": messages, "temperature": temperature},
            )
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]


def get_client() -> MistralClient:
    """Always reads MISTRAL_API_KEY fresh from the environment."""
    return MistralClient(os.getenv("MISTRAL_API_KEY", ""))
