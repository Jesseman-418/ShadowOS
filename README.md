# ShadowOS

**Autonomous multi-agent business system for solo operators.**

Built for the [AI Agent Olympics Hackathon](https://lablab.ai/ai-hackathons/milan-ai-week-hackathon) at Milan AI Week 2026.

## What It Does

ShadowOS runs an entire creator outreach business on autopilot. Give it a niche, and 5 specialized AI agents coordinate to:

1. **Find** creators matching your criteria (10K-100K followers, educational content, no content team)
2. **Research** each creator's content, gaps, and personalization hooks
3. **Write** personalized cold emails using proven hook frameworks (contrarian, statistic, big statement, question)
4. **Send** emails via SMTP with rate limiting and delivery tracking
5. **Analyze** reply rates, conversion funnels, and niche performance

## Architecture

```
┌─────────────────────────────────────────────┐
│              ShadowOS Dashboard              │
│            (Next.js + shadcn/ui)             │
├─────────────────────────────────────────────┤
│             Orchestrator Agent                │
│        (Coordinates all sub-agents)           │
├──────┬──────┬──────┬──────┬────────────────┤
│Prospect│Research│Copy  │Outreach│Analytics  │
│Finder  │Agent   │Agent │Manager │Agent      │
└──────┴──────┴──────┴──────┴────────────────┘
         │              │              │
    ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
    │ Gemini  │   │  Vultr  │   │  SMTP   │
    │   API   │   │ Backend │   │ (Gmail) │
    └─────────┘   └─────────┘   └─────────┘
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Python 3.12 + FastAPI |
| AI | Google Gemini API |
| Database | SQLite (aiosqlite) |
| Frontend | Next.js + shadcn/ui |
| Deployment | Vultr VM |

## Quick Start

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set up environment
cp ../.env.example ../.env
# Edit .env with your Gemini API key and Gmail credentials

# Run the server
uvicorn backend.api.main:app --reload --host 0.0.0.0 --port 8000
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | System status |
| POST | `/pipeline/run` | Run the full outreach pipeline |
| POST | `/prospects/search` | Search for prospects only |
| GET | `/analytics/dashboard` | Main dashboard metrics |
| GET | `/analytics/niches` | Performance by niche |
| GET | `/analytics/hooks` | Reply analysis by hook type |
| GET | `/health` | Health check |

### Example: Run a Pipeline

```bash
curl -X POST http://localhost:8000/pipeline/run \
  -H "Content-Type: application/json" \
  -d '{"niche": "fitness coaches", "count": 15, "auto_send": false}'
```

## Agents

| Agent | Role | Input | Output |
|-------|------|-------|--------|
| **Prospector** | Finds creators matching criteria | Niche + count | List of qualified prospects |
| **Researcher** | Deep-dives on each prospect | Prospect data | Personalization hooks, content gaps |
| **Copywriter** | Writes personalized cold emails | Prospect + research | Subject + body + hook type |
| **Outreach** | Sends emails via SMTP | Email data | Send confirmation |
| **Analytics** | Tracks metrics and generates reports | Report type | Dashboard data |
| **Orchestrator** | Coordinates all agents end-to-end | Niche + config | Full pipeline results |

## Hackathon Tracks

- **Agentic Workflows** — Multi-step autonomous pipeline
- **Enterprise Utility** — Solves real solopreneur business friction
- **Collaborative Systems** — 5 agents coordinate on a shared goal
- **Intelligent Reasoning** — Handles failures gracefully (no email → DM fallback)

## License

MIT
