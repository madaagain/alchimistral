import logging
import os
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Load the .env file that lives next to this file, regardless of cwd.
# override=True ensures the file beats any shell-level env var already set.
_env_path = Path(__file__).parent / ".env"
load_dotenv(_env_path, override=True)

# Confirm the key is present at startup so misconfiguration is obvious.
_key = os.getenv("MISTRAL_API_KEY", "")
logging.basicConfig(level=logging.INFO)
_log = logging.getLogger("alchemistral")
if _key:
    _log.info("MISTRAL_API_KEY loaded: %s…", _key[:8])
    # Vibe CLI reads its API key from ~/.vibe/.env, NOT from subprocess env.
    # Write it once at startup so vibe subprocesses can find it.
    _vibe_env = Path.home() / ".vibe" / ".env"
    _vibe_env.parent.mkdir(parents=True, exist_ok=True)
    _needs_write = True
    if _vibe_env.exists():
        _existing = _vibe_env.read_text()
        if f"MISTRAL_API_KEY={_key}" in _existing:
            _needs_write = False
    if _needs_write:
        _vibe_env.write_text(f"MISTRAL_API_KEY={_key}\n")
        _log.info("Wrote MISTRAL_API_KEY to %s for Vibe CLI", _vibe_env)
else:
    _log.warning("MISTRAL_API_KEY is not set — orchestrator will use mock fallback")

from routers import projects, memory
from routers.orchestrator import router as orchestrator_router
from routers.settings import router as settings_router
from routers.agents import router as agents_router
from ws_manager import manager

app = FastAPI(title="Alchemistral", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(memory.router)
app.include_router(orchestrator_router)
app.include_router(settings_router)
app.include_router(agents_router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        # Send initial connection event
        await ws.send_json({
            "agent_id": "orchestrator",
            "type": "status",
            "text": "Alchemistral online",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        # Keep alive — blocks until client disconnects
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)
