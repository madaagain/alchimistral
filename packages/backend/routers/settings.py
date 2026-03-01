"""
Settings router — manage API keys and configuration.
"""
import os
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/settings", tags=["settings"])

_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


class KeysPayload(BaseModel):
    mistral_api_key: str | None = None


def _read_env() -> dict[str, str]:
    """Parse the .env file into a dict."""
    env: dict[str, str] = {}
    if _ENV_PATH.exists():
        for line in _ENV_PATH.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    return env


def _write_env(env: dict[str, str]) -> None:
    """Write dict back to .env file."""
    lines = [f"{k}={v}" for k, v in env.items()]
    _ENV_PATH.write_text("\n".join(lines) + "\n")


@router.get("/keys")
async def get_keys():
    """Return masked API keys (show first 8 chars only)."""
    key = os.getenv("MISTRAL_API_KEY", "")
    return {
        "mistral_api_key": f"{key[:8]}..." if len(key) > 8 else ("set" if key else ""),
    }


@router.put("/keys")
async def update_keys(payload: KeysPayload):
    """Update API keys in .env, process env, and ~/.vibe/.env."""
    env = _read_env()
    if payload.mistral_api_key is not None:
        env["MISTRAL_API_KEY"] = payload.mistral_api_key
        os.environ["MISTRAL_API_KEY"] = payload.mistral_api_key
        # Also write to ~/.vibe/.env so Vibe CLI can find it
        vibe_env = Path.home() / ".vibe" / ".env"
        vibe_env.parent.mkdir(parents=True, exist_ok=True)
        vibe_env.write_text(f"MISTRAL_API_KEY={payload.mistral_api_key}\n")
    _write_env(env)
    return {"status": "ok"}
