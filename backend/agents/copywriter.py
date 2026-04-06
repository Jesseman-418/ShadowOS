"""
Copywriter Agent — Generates personalized cold emails using hook frameworks.

Uses four hook types: Contrarian, Statistic, Big Statement, Question.
Selects the best hook based on prospect data and generates a short,
personalized cold email.
"""

import json
from backend.agents.base import BaseAgent, AgentResult
from backend.core.llm import generate_json


SYSTEM_PROMPT = """You are an elite cold email copywriter. You write SHORT emails
(under 100 words) that get replies. You use these hook frameworks:

1. CONTRARIAN — Say the opposite of what they expect. Go full contrarian.
2. STATISTIC — Use specific numbers that surprise. "One video = 14 days of posts."
3. BIG STATEMENT — Bold claim backed by specifics. "I found $50K in your account."
4. QUESTION — Force mental engagement. "Have you ever turned one video into a week of posts?"

Rules:
- Under 100 words total
- Reference something SPECIFIC about their content
- No hard pitch — start a conversation
- Casual tone, not formal
- End with a soft CTA (question, not a demand)
- Sign off as "— Jesse"

Return JSON with fields: subject (under 8 words), body, hook_type (contrarian/statistic/big_statement/question)
"""


class CopywriterAgent(BaseAgent):
    name = "copywriter"

    async def run(self, prospect: dict, research: dict) -> AgentResult:
        handle = prospect.get("handle", "unknown")
        prompt = f"""Write a cold email for this prospect:

PROSPECT:
- Handle: {prospect.get('handle')}
- Name: {prospect.get('name')}
- Followers: {prospect.get('followers')}
- Niche: {prospect.get('niche')}
- Has YouTube: {prospect.get('has_youtube')}
- Has Podcast: {prospect.get('has_podcast')}
- Products: {prospect.get('has_product')}

RESEARCH:
- Summary: {research.get('content_summary', 'N/A')}
- Personalization hooks: {json.dumps(research.get('personalization_hooks', []))}
- Content gaps: {json.dumps(research.get('content_gaps', []))}
- YT/IG gap: {research.get('yt_ig_gap_ratio', 'N/A')}

Choose the best hook type for this prospect and write the email.
If they have a big YouTube but small IG, use STATISTIC or CONTRARIAN about the gap.
If they have a podcast, use QUESTION about repurposing episodes.
If they have products, use BIG STATEMENT about revenue potential.

Return as JSON."""

        try:
            raw = await generate_json(prompt, system_instruction=SYSTEM_PROMPT)
            email = json.loads(raw)

            return AgentResult(
                agent_name=self.name,
                status="success",
                data=email,
                metadata={"handle": handle, "hook_type": email.get("hook_type")},
            )
        except Exception as e:
            return AgentResult(
                agent_name=self.name,
                status="failed",
                errors=[str(e)],
                metadata={"handle": handle},
            )
