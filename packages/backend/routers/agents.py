"""
Agents router — query and control running agents.
"""
import logging

from fastapi import APIRouter, HTTPException

from services.agent_manager import agent_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.get("")
async def list_agents():
    """List all agents with their current status."""
    return agent_manager.list_agents()


@router.get("/{agent_id}")
async def get_agent(agent_id: str):
    """Get detailed info for a single agent."""
    state = agent_manager.get_agent(agent_id)
    if not state:
        raise HTTPException(404, f"Agent not found: {agent_id}")
    return state.to_dict()


@router.post("/{agent_id}/kill")
async def kill_agent(agent_id: str):
    """Kill a running agent."""
    ok = await agent_manager.kill_agent(agent_id)
    if not ok:
        raise HTTPException(404, f"Agent not found: {agent_id}")
    return {"status": "killed", "agent_id": agent_id}
