"""
Analytics Agent — Tracks pipeline metrics and generates reports.

Monitors reply rates, conversion funnels, niche performance,
and provides actionable insights.
"""

import aiosqlite
import os
from backend.agents.base import BaseAgent, AgentResult

DB_PATH = os.getenv("DB_PATH", "shadowos.db")


class AnalyticsAgent(BaseAgent):
    name = "analytics"

    async def run(self, report_type: str = "dashboard") -> AgentResult:
        """Generate analytics report."""
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row

            if report_type == "dashboard":
                return await self._dashboard(db)
            elif report_type == "niche_breakdown":
                return await self._niche_breakdown(db)
            elif report_type == "reply_analysis":
                return await self._reply_analysis(db)
            else:
                return AgentResult(
                    agent_name=self.name,
                    status="failed",
                    errors=[f"Unknown report type: {report_type}"],
                )

    async def _dashboard(self, db: aiosqlite.Connection) -> AgentResult:
        """Main dashboard metrics."""
        metrics = {}

        # Total prospects
        cursor = await db.execute("SELECT COUNT(*) as count FROM prospects")
        row = await cursor.fetchone()
        metrics["total_prospects"] = row[0]

        # By status
        cursor = await db.execute(
            "SELECT status, COUNT(*) as count FROM prospects GROUP BY status"
        )
        rows = await cursor.fetchall()
        metrics["by_status"] = {row[0]: row[1] for row in rows}

        # Emails sent
        cursor = await db.execute(
            "SELECT COUNT(*) as count FROM emails WHERE status = 'sent'"
        )
        row = await cursor.fetchone()
        metrics["emails_sent"] = row[0]

        # Replies received
        cursor = await db.execute(
            "SELECT COUNT(*) as count FROM emails WHERE replied_at IS NOT NULL"
        )
        row = await cursor.fetchone()
        metrics["replies"] = row[0]

        # Reply rate
        if metrics["emails_sent"] > 0:
            metrics["reply_rate"] = round(metrics["replies"] / metrics["emails_sent"] * 100, 1)
        else:
            metrics["reply_rate"] = 0

        # Pipeline runs
        cursor = await db.execute(
            "SELECT COUNT(*) as count FROM pipeline_runs"
        )
        row = await cursor.fetchone()
        metrics["total_runs"] = row[0]

        return AgentResult(
            agent_name=self.name,
            status="success",
            data=metrics,
        )

    async def _niche_breakdown(self, db: aiosqlite.Connection) -> AgentResult:
        """Performance by niche."""
        cursor = await db.execute("""
            SELECT
                p.niche,
                COUNT(DISTINCT p.id) as prospects,
                COUNT(DISTINCT CASE WHEN e.status = 'sent' THEN e.id END) as emails_sent,
                COUNT(DISTINCT CASE WHEN e.replied_at IS NOT NULL THEN e.id END) as replies
            FROM prospects p
            LEFT JOIN emails e ON p.id = e.prospect_id
            GROUP BY p.niche
            ORDER BY prospects DESC
        """)
        rows = await cursor.fetchall()
        niches = [
            {
                "niche": row[0],
                "prospects": row[1],
                "emails_sent": row[2],
                "replies": row[3],
                "reply_rate": round(row[3] / row[2] * 100, 1) if row[2] > 0 else 0,
            }
            for row in rows
        ]

        return AgentResult(
            agent_name=self.name,
            status="success",
            data=niches,
        )

    async def _reply_analysis(self, db: aiosqlite.Connection) -> AgentResult:
        """Analyze replies by sentiment and hook type."""
        cursor = await db.execute("""
            SELECT
                e.hook_type,
                COUNT(*) as total_sent,
                COUNT(CASE WHEN e.replied_at IS NOT NULL THEN 1 END) as replies,
                COUNT(CASE WHEN e.reply_sentiment = 'positive' THEN 1 END) as positive,
                COUNT(CASE WHEN e.reply_sentiment = 'warm' THEN 1 END) as warm,
                COUNT(CASE WHEN e.reply_sentiment = 'negative' THEN 1 END) as negative
            FROM emails e
            WHERE e.status = 'sent'
            GROUP BY e.hook_type
        """)
        rows = await cursor.fetchall()
        hooks = [
            {
                "hook_type": row[0],
                "total_sent": row[1],
                "replies": row[2],
                "reply_rate": round(row[2] / row[1] * 100, 1) if row[1] > 0 else 0,
                "positive": row[3],
                "warm": row[4],
                "negative": row[5],
            }
            for row in rows
        ]

        return AgentResult(
            agent_name=self.name,
            status="success",
            data=hooks,
        )
