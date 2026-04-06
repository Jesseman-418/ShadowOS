from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any
import time


@dataclass
class AgentResult:
    agent_name: str
    status: str  # "success", "partial", "failed"
    data: Any = None
    errors: list[str] = field(default_factory=list)
    duration_ms: int = 0
    metadata: dict = field(default_factory=dict)


class BaseAgent(ABC):
    """Base class for all ShadowOS agents."""

    name: str = "base"

    @abstractmethod
    async def run(self, **kwargs) -> AgentResult:
        """Execute the agent's primary task."""
        ...

    async def execute(self, **kwargs) -> AgentResult:
        """Wrapper that tracks timing and catches errors."""
        start = time.monotonic()
        try:
            result = await self.run(**kwargs)
            result.duration_ms = int((time.monotonic() - start) * 1000)
            return result
        except Exception as e:
            return AgentResult(
                agent_name=self.name,
                status="failed",
                errors=[str(e)],
                duration_ms=int((time.monotonic() - start) * 1000),
            )
