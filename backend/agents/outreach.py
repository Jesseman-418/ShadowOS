"""
Outreach Agent — Sends emails and tracks delivery.

Handles email sending via SMTP/Gmail API, manages send rate limiting,
and logs all outreach activity to the database.
"""

import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from backend.agents.base import BaseAgent, AgentResult


class OutreachAgent(BaseAgent):
    name = "outreach"

    async def run(
        self,
        to_email: str,
        subject: str,
        body: str,
        prospect_handle: str = "",
    ) -> AgentResult:
        """Send a cold email via SMTP."""
        sender_email = os.getenv("SENDER_EMAIL", "")
        sender_password = os.getenv("SENDER_APP_PASSWORD", "")
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))

        if not sender_email or not sender_password:
            return AgentResult(
                agent_name=self.name,
                status="failed",
                errors=["SENDER_EMAIL and SENDER_APP_PASSWORD env vars required"],
                metadata={"handle": prospect_handle},
            )

        msg = MIMEMultipart()
        msg["From"] = sender_email
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        try:
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(sender_email, sender_password)
                server.send_message(msg)

            return AgentResult(
                agent_name=self.name,
                status="success",
                data={"to": to_email, "subject": subject},
                metadata={"handle": prospect_handle},
            )
        except Exception as e:
            return AgentResult(
                agent_name=self.name,
                status="failed",
                errors=[f"SMTP error: {e}"],
                metadata={"handle": prospect_handle, "to": to_email},
            )

    async def send_batch(self, emails: list[dict]) -> AgentResult:
        """Send a batch of emails with results tracking."""
        sent = []
        failed = []

        for email in emails:
            result = await self.execute(
                to_email=email["to"],
                subject=email["subject"],
                body=email["body"],
                prospect_handle=email.get("handle", ""),
            )
            if result.status == "success":
                sent.append(email.get("handle", email["to"]))
            else:
                failed.append({"handle": email.get("handle", email["to"]), "error": result.errors})

        return AgentResult(
            agent_name=self.name,
            status="success" if not failed else "partial",
            data={"sent": sent, "failed": failed},
            metadata={"total": len(emails), "sent_count": len(sent), "failed_count": len(failed)},
        )
