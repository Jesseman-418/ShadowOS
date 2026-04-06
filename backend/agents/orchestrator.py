"""
Orchestrator Agent — Coordinates all sub-agents into a full pipeline.

This is the brain of ShadowOS. Given a niche and target count, it:
1. Runs the Prospector to find creators
2. Runs the Researcher on each prospect (parallel)
3. Runs the Copywriter to generate personalized emails
4. Runs the Outreach agent to send emails
5. Logs everything to the database

Handles failures gracefully — if one prospect fails research,
it skips to the next instead of stopping the pipeline.
"""

import asyncio
import json
import aiosqlite
import os
from backend.agents.base import BaseAgent, AgentResult
from backend.agents.prospector import ProspectorAgent
from backend.agents.researcher import ResearcherAgent
from backend.agents.copywriter import CopywriterAgent
from backend.agents.outreach import OutreachAgent
from backend.agents.analytics import AnalyticsAgent

DB_PATH = os.getenv("DB_PATH", "shadowos.db")


class OrchestratorAgent(BaseAgent):
    name = "orchestrator"

    def __init__(self):
        self.prospector = ProspectorAgent()
        self.researcher = ResearcherAgent()
        self.copywriter = CopywriterAgent()
        self.outreach = OutreachAgent()
        self.analytics = AnalyticsAgent()

    async def run(
        self,
        niche: str,
        count: int = 15,
        auto_send: bool = False,
    ) -> AgentResult:
        """Run the full outreach pipeline."""
        pipeline_log = {
            "niche": niche,
            "stages": {},
            "prospects_processed": [],
            "emails_generated": [],
            "emails_sent": [],
            "errors": [],
        }

        # Stage 1: Find prospects
        prospect_result = await self.prospector.execute(niche=niche, count=count)
        pipeline_log["stages"]["prospecting"] = {
            "status": prospect_result.status,
            "duration_ms": prospect_result.duration_ms,
            "found": prospect_result.metadata.get("qualified", 0),
        }

        if prospect_result.status == "failed":
            return AgentResult(
                agent_name=self.name,
                status="failed",
                errors=["Prospector failed: " + "; ".join(prospect_result.errors)],
                data=pipeline_log,
            )

        prospects = prospect_result.data.get("prospects", [])

        # Stage 2: Research each prospect (parallel, max 5 concurrent)
        semaphore = asyncio.Semaphore(5)

        async def research_one(prospect):
            async with semaphore:
                return await self.researcher.execute(prospect=prospect)

        research_tasks = [research_one(p) for p in prospects]
        research_results = await asyncio.gather(*research_tasks)

        pipeline_log["stages"]["research"] = {
            "status": "success",
            "total": len(prospects),
            "succeeded": sum(1 for r in research_results if r.status == "success"),
            "failed": sum(1 for r in research_results if r.status == "failed"),
        }

        # Stage 3: Generate emails for researched prospects
        emails_to_send = []
        for prospect, research_result in zip(prospects, research_results):
            if research_result.status != "success":
                pipeline_log["errors"].append(
                    f"Research failed for {prospect.get('handle')}: {research_result.errors}"
                )
                continue

            email_result = await self.copywriter.execute(
                prospect=prospect,
                research=research_result.data,
            )

            if email_result.status == "success":
                email_data = email_result.data
                email_data["to"] = prospect.get("email")
                email_data["handle"] = prospect.get("handle")
                email_data["prospect"] = prospect
                email_data["research"] = research_result.data

                pipeline_log["emails_generated"].append({
                    "handle": prospect.get("handle"),
                    "subject": email_data.get("subject"),
                    "hook_type": email_data.get("hook_type"),
                    "has_email": bool(prospect.get("email")),
                })

                if prospect.get("email"):
                    emails_to_send.append(email_data)
            else:
                pipeline_log["errors"].append(
                    f"Copywriting failed for {prospect.get('handle')}: {email_result.errors}"
                )

            pipeline_log["prospects_processed"].append({
                "handle": prospect.get("handle"),
                "name": prospect.get("name"),
                "followers": prospect.get("followers"),
                "niche": prospect.get("niche"),
                "email": prospect.get("email"),
                "score": prospect.get("qualification_score"),
                "research": research_result.data if research_result.status == "success" else None,
                "email_generated": email_result.status == "success",
            })

        pipeline_log["stages"]["copywriting"] = {
            "status": "success",
            "emails_generated": len(pipeline_log["emails_generated"]),
            "with_email": len(emails_to_send),
            "dm_only": len(pipeline_log["emails_generated"]) - len(emails_to_send),
        }

        # Stage 4: Send emails (only if auto_send is True)
        if auto_send and emails_to_send:
            send_result = await self.outreach.send_batch(emails_to_send)
            pipeline_log["stages"]["outreach"] = {
                "status": send_result.status,
                "sent": send_result.metadata.get("sent_count", 0),
                "failed": send_result.metadata.get("failed_count", 0),
            }
            pipeline_log["emails_sent"] = send_result.data.get("sent", [])
        else:
            pipeline_log["stages"]["outreach"] = {
                "status": "skipped" if not auto_send else "no_emails",
                "reason": "auto_send=False" if not auto_send else "no valid emails found",
            }

        # Save to database
        await self._save_to_db(pipeline_log)

        return AgentResult(
            agent_name=self.name,
            status="success",
            data=pipeline_log,
            metadata={
                "niche": niche,
                "prospects_found": len(prospects),
                "emails_generated": len(pipeline_log["emails_generated"]),
                "emails_sent": len(pipeline_log.get("emails_sent", [])),
            },
        )

    async def _save_to_db(self, pipeline_log: dict):
        """Persist pipeline results to SQLite."""
        try:
            async with aiosqlite.connect(DB_PATH) as db:
                for p in pipeline_log.get("prospects_processed", []):
                    await db.execute(
                        """INSERT OR IGNORE INTO prospects
                        (handle, name, followers, niche, email, qualification_score, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?)""",
                        (
                            p.get("handle"),
                            p.get("name"),
                            p.get("followers"),
                            p.get("niche"),
                            p.get("email"),
                            p.get("score", 0),
                            "emailed" if p.get("email") else "dm_only",
                        ),
                    )
                await db.commit()
        except Exception:
            pass  # Don't fail pipeline on DB errors
