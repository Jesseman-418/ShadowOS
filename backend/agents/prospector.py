"""
Prospector Agent — Finds creators matching the Shadow Operator criteria.

Searches the web for Instagram/YouTube creators in a given niche with
10K-100K followers, educational content, and no content team.
"""

import json
import httpx
from backend.agents.base import BaseAgent, AgentResult
from backend.core.llm import generate_json
from backend.config.settings import FOLLOWER_MIN, FOLLOWER_MAX


SYSTEM_PROMPT = """You are a prospect research agent for a content repurposing business.
Your job is to find Instagram creators who match these criteria:
- 10K-100K followers
- Educational/transformation content (business, health, fitness, finance, personal dev)
- Has long-form content (YouTube, podcast, or blog)
- Posts inconsistently on Instagram OR has weak captions
- No visible content team
- Sells something (course, coaching, digital product)

Return results as a JSON array of objects with these fields:
handle, name, followers (number), niche, has_youtube (boolean), has_podcast (boolean),
has_product (boolean), website, email (if found, else null), notes
"""


class ProspectorAgent(BaseAgent):
    name = "prospector"

    async def run(self, niche: str, count: int = 15) -> AgentResult:
        prompt = f"""Find {count} Instagram creators in the "{niche}" niche who match
the Shadow Operator criteria. For each creator, provide their handle, name,
approximate follower count, whether they have YouTube/podcast, what products
they sell, their website, and email if publicly available.

Search across Instagram, YouTube, and coaching directories.
Return as a JSON array."""

        try:
            raw = await generate_json(prompt, system_instruction=SYSTEM_PROMPT)
            prospects = json.loads(raw)

            # Filter by follower range
            qualified = []
            skipped = []
            for p in prospects:
                followers = p.get("followers", 0)
                if FOLLOWER_MIN <= followers <= FOLLOWER_MAX:
                    p["qualification_score"] = self._score(p)
                    qualified.append(p)
                else:
                    skipped.append(p.get("handle", "unknown"))

            return AgentResult(
                agent_name=self.name,
                status="success",
                data={"prospects": qualified, "skipped": skipped},
                metadata={"niche": niche, "total_found": len(prospects), "qualified": len(qualified)},
            )
        except json.JSONDecodeError as e:
            return AgentResult(
                agent_name=self.name,
                status="failed",
                errors=[f"Failed to parse LLM response as JSON: {e}"],
                data={"raw_response": raw if 'raw' in dir() else None},
            )

    def _score(self, prospect: dict) -> int:
        """Quick qualification score (0-5)."""
        score = 0
        if prospect.get("has_youtube"):
            score += 1
        if prospect.get("has_podcast"):
            score += 1
        if prospect.get("has_product"):
            score += 1
        if prospect.get("email"):
            score += 1
        followers = prospect.get("followers", 0)
        if 20000 <= followers <= 80000:  # Sweet spot
            score += 1
        return score
