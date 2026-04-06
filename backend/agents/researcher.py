"""
Researcher Agent — Deep-dives on individual prospects.

Scrapes websites, pulls YouTube transcripts, analyzes content gaps,
and extracts personalization hooks for outreach.
"""

import json
from backend.agents.base import BaseAgent, AgentResult
from backend.core.llm import generate_json


SYSTEM_PROMPT = """You are a content research agent. Given a creator's details,
analyze their content and business to extract:

1. Content summary (2-3 sentences on who they are)
2. Personalization hooks (3 specific things to reference in outreach)
3. Content gaps (what they're NOT doing that they should be)
4. Recommended spec work (what to create as a free sample)
5. YouTube-to-IG gap ratio (if applicable)

Return as JSON with fields: content_summary, personalization_hooks (array of strings),
content_gaps (array of strings), recommended_spec_work (string), yt_ig_gap_ratio (string or null)
"""


class ResearcherAgent(BaseAgent):
    name = "researcher"

    async def run(self, prospect: dict) -> AgentResult:
        handle = prospect.get("handle", "unknown")
        prompt = f"""Research this creator for content repurposing outreach:

Handle: {prospect.get('handle')}
Name: {prospect.get('name')}
Followers: {prospect.get('followers')}
Niche: {prospect.get('niche')}
YouTube: {prospect.get('has_youtube')}
Podcast: {prospect.get('has_podcast')}
Products: {prospect.get('has_product')}
Website: {prospect.get('website')}

Analyze their content strategy, identify gaps where content repurposing would help,
and find specific personalization hooks (recent posts, achievements, content topics)
that can be referenced in cold outreach.

Return as JSON."""

        try:
            raw = await generate_json(prompt, system_instruction=SYSTEM_PROMPT)
            research = json.loads(raw)

            return AgentResult(
                agent_name=self.name,
                status="success",
                data=research,
                metadata={"handle": handle},
            )
        except Exception as e:
            return AgentResult(
                agent_name=self.name,
                status="failed",
                errors=[str(e)],
                metadata={"handle": handle},
            )
