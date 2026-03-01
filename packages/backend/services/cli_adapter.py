"""
CLI Adapter — pluggable interface for spawning coding agent CLIs.

V1 = VibeCLIAdapter (Devstral 2 via Vibe CLI).
The architecture supports any CLI coding agent via CLI_REGISTRY.
"""
import asyncio
import logging
import shlex
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import AsyncIterator

logger = logging.getLogger(__name__)


@dataclass
class AgentConfig:
    """Configuration for spawning an agent."""
    max_turns: int = 50
    max_price: float = 5.0
    skills: list[str] = field(default_factory=list)


@dataclass
class AgentEvent:
    """A single event from an agent's output stream."""
    agent_id: str
    type: str  # think, code, bash, tool, done, error
    text: str = ""


class CLIAdapter(ABC):
    """Interface for pluggable CLI coding agents."""
    name: str

    @abstractmethod
    async def spawn(
        self,
        worktree_path: str,
        prompt: str,
        config: AgentConfig,
        agent_id: str,
    ) -> None:
        """Launch the CLI process in the given worktree."""
        ...

    @abstractmethod
    async def stream_output(self) -> AsyncIterator[AgentEvent]:
        """Yield events from the running process."""
        ...

    @abstractmethod
    async def is_complete(self) -> bool:
        """Check if the process has finished."""
        ...

    @abstractmethod
    async def kill(self) -> None:
        """Terminate the running process."""
        ...


class VibeCLIAdapter(CLIAdapter):
    """Adapter for Vibe CLI (Devstral 2)."""
    name = "vibe"

    def __init__(self) -> None:
        self._proc: asyncio.subprocess.Process | None = None
        self._agent_id: str = ""
        self._done: bool = False

    async def spawn(
        self,
        worktree_path: str,
        prompt: str,
        config: AgentConfig,
        agent_id: str,
    ) -> None:
        self._agent_id = agent_id
        self._done = False

        prompt_escaped = shlex.quote(prompt)
        cmd = (
            f"vibe --prompt {prompt_escaped}"
            f" --max-turns {config.max_turns}"
            f" --max-price {config.max_price}"
        )

        print(f"[vibe-adapter][{agent_id}] cwd: {worktree_path}")
        print(f"[vibe-adapter][{agent_id}] prompt length: {len(prompt)} chars")
        print(f"[vibe-adapter][{agent_id}] prompt first 200 chars: {prompt[:200]!r}")
        print(f"[vibe-adapter][{agent_id}] shell command: vibe --prompt <{len(prompt)} chars> --max-turns {config.max_turns} --max-price {config.max_price}")

        self._proc = await asyncio.create_subprocess_shell(
            cmd,
            cwd=worktree_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        print(f"[vibe-adapter][{agent_id}] process spawned, PID: {self._proc.pid}")

    async def stream_output(self) -> AsyncIterator[AgentEvent]:
        """Stream stdout line-by-line as agent events. Also captures stderr."""
        if not self._proc or not self._proc.stdout:
            print(f"[vibe-adapter][{self._agent_id}] WARNING: no process or no stdout pipe")
            return

        # Start a background task to drain stderr
        stderr_lines: list[str] = []

        async def _drain_stderr() -> None:
            if self._proc and self._proc.stderr:
                async for raw in self._proc.stderr:
                    line = raw.decode("utf-8", errors="replace").rstrip()
                    if line:
                        stderr_lines.append(line)
                        print(f"[vibe-adapter][{self._agent_id}] STDERR: {line}")

        stderr_task = asyncio.create_task(_drain_stderr())

        line_count = 0
        try:
            async for raw_line in self._proc.stdout:
                line = raw_line.decode("utf-8", errors="replace").rstrip()
                if not line:
                    continue

                line_count += 1
                if line_count <= 5:
                    print(f"[vibe-adapter][{self._agent_id}] STDOUT[{line_count}]: {line[:200]}")

                # Classify output lines
                event_type = "output"
                if line.startswith("Thinking") or line.startswith(">"):
                    event_type = "think"
                elif line.startswith("$ ") or line.startswith("Running:"):
                    event_type = "bash"
                elif line.startswith("Writing") or line.startswith("Editing"):
                    event_type = "code"

                yield AgentEvent(
                    agent_id=self._agent_id,
                    type=event_type,
                    text=line,
                )
        except Exception as exc:
            print(f"[vibe-adapter][{self._agent_id}] stream error: {exc}")
            yield AgentEvent(
                agent_id=self._agent_id,
                type="error",
                text=f"Stream error: {exc}",
            )

        # Wait for process to finish and collect exit info
        if self._proc:
            await self._proc.wait()
            exit_code = self._proc.returncode
            print(f"[vibe-adapter][{self._agent_id}] process exited with code: {exit_code}")
            print(f"[vibe-adapter][{self._agent_id}] total stdout lines read: {line_count}")
        else:
            exit_code = None

        # Wait for stderr drain to finish
        await stderr_task
        if stderr_lines:
            print(f"[vibe-adapter][{self._agent_id}] total stderr lines: {len(stderr_lines)}")
            # Print last 10 stderr lines for debugging
            for sl in stderr_lines[-10:]:
                print(f"[vibe-adapter][{self._agent_id}] STDERR(tail): {sl}")

        self._done = True

        # Report if vibe exited with an error
        if exit_code and exit_code != 0:
            err_summary = "; ".join(stderr_lines[-3:]) if stderr_lines else f"exit code {exit_code}"
            yield AgentEvent(
                agent_id=self._agent_id,
                type="error",
                text=f"Vibe exited with code {exit_code}: {err_summary}",
            )
        else:
            yield AgentEvent(
                agent_id=self._agent_id,
                type="done",
                text=f"Agent completed ({line_count} output lines)",
            )

    async def is_complete(self) -> bool:
        if self._proc is None:
            return True
        return self._done or self._proc.returncode is not None

    async def kill(self) -> None:
        if self._proc and self._proc.returncode is None:
            logger.info(f"[{self._agent_id}] Killing vibe process")
            self._proc.terminate()
            try:
                await asyncio.wait_for(self._proc.wait(), timeout=5)
            except asyncio.TimeoutError:
                self._proc.kill()
            self._done = True


class MockCLIAdapter(CLIAdapter):
    """Mock adapter for demo/testing — simulates agent work."""
    name = "mock"

    def __init__(self) -> None:
        self._agent_id: str = ""
        self._prompt: str = ""
        self._done: bool = False

    async def spawn(
        self,
        worktree_path: str,
        prompt: str,
        config: AgentConfig,
        agent_id: str,
    ) -> None:
        self._agent_id = agent_id
        self._prompt = prompt
        self._done = False
        logger.info(f"[{agent_id}] Mock spawn in {worktree_path}")

    async def stream_output(self) -> AsyncIterator[AgentEvent]:
        steps = [
            ("think", f"Analyzing task: {self._prompt[:80]}..."),
            ("think", "Reading project structure..."),
            ("bash", "$ ls -la src/"),
            ("code", "Writing implementation..."),
            ("bash", "$ npm test"),
            ("output", "All tests passed."),
        ]
        for event_type, text in steps:
            await asyncio.sleep(1.5)
            yield AgentEvent(
                agent_id=self._agent_id,
                type=event_type,
                text=text,
            )
        self._done = True
        yield AgentEvent(
            agent_id=self._agent_id,
            type="done",
            text="Agent completed (mock)",
        )

    async def is_complete(self) -> bool:
        return self._done

    async def kill(self) -> None:
        self._done = True


def get_adapter(name: str = "vibe") -> CLIAdapter:
    """Get a CLI adapter by name."""
    registry: dict[str, type[CLIAdapter]] = {
        "vibe": VibeCLIAdapter,
        "mock": MockCLIAdapter,
    }
    cls = registry.get(name)
    if cls is None:
        raise ValueError(f"Unknown CLI adapter: {name!r}. Available: {list(registry)}")
    return cls()
