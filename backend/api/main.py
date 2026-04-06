"""
ShadowOS API — FastAPI backend for the autonomous outreach system.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager

from backend.core.database import init_db
from backend.agents.orchestrator import OrchestratorAgent
from backend.agents.analytics import AnalyticsAgent
from backend.agents.prospector import ProspectorAgent


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="ShadowOS",
    description="Autonomous multi-agent business system for solo operators",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request Models ---

class PipelineRequest(BaseModel):
    niche: str
    count: int = 15
    auto_send: bool = False


class ProspectSearchRequest(BaseModel):
    niche: str
    count: int = 15


# --- Routes ---

@app.get("/")
async def root():
    return {
        "name": "ShadowOS",
        "version": "0.1.0",
        "status": "running",
        "agents": ["prospector", "researcher", "copywriter", "outreach", "analytics", "orchestrator"],
    }


@app.post("/pipeline/run")
async def run_pipeline(req: PipelineRequest):
    """Run the full outreach pipeline for a given niche."""
    orchestrator = OrchestratorAgent()
    result = await orchestrator.execute(
        niche=req.niche,
        count=req.count,
        auto_send=req.auto_send,
    )
    return {
        "status": result.status,
        "duration_ms": result.duration_ms,
        "metadata": result.metadata,
        "data": result.data,
        "errors": result.errors,
    }


@app.post("/prospects/search")
async def search_prospects(req: ProspectSearchRequest):
    """Search for prospects without running the full pipeline."""
    prospector = ProspectorAgent()
    result = await prospector.execute(niche=req.niche, count=req.count)
    return {
        "status": result.status,
        "duration_ms": result.duration_ms,
        "data": result.data,
        "errors": result.errors,
    }


@app.get("/analytics/dashboard")
async def dashboard():
    """Get the main analytics dashboard."""
    analytics = AnalyticsAgent()
    result = await analytics.execute(report_type="dashboard")
    return {"status": result.status, "data": result.data}


@app.get("/analytics/niches")
async def niche_breakdown():
    """Get performance breakdown by niche."""
    analytics = AnalyticsAgent()
    result = await analytics.execute(report_type="niche_breakdown")
    return {"status": result.status, "data": result.data}


@app.get("/analytics/hooks")
async def hook_analysis():
    """Get reply analysis by hook type."""
    analytics = AnalyticsAgent()
    result = await analytics.execute(report_type="reply_analysis")
    return {"status": result.status, "data": result.data}


@app.get("/health")
async def health():
    return {"status": "healthy"}
