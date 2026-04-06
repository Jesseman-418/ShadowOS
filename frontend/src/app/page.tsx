"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface DashboardData {
  total_prospects: number;
  by_status: Record<string, number>;
  emails_sent: number;
  replies: number;
  reply_rate: number;
  total_runs: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiUrl}/analytics/dashboard`)
      .then((r) => r.json())
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-zinc-500">Loading dashboard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard title="Total Prospects" value="—" subtitle="Connect backend to see data" />
          <MetricCard title="Emails Sent" value="—" subtitle="Start the API server" />
          <MetricCard title="Replies" value="—" subtitle="uvicorn backend.api.main:app" />
          <MetricCard title="Reply Rate" value="—%" subtitle="--reload --port 8000" />
        </div>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6 space-y-3 text-sm text-zinc-500">
            <p className="text-zinc-400 font-medium">Quick Start</p>
            <p>1. Set up your <code className="text-zinc-300 font-mono">.env</code> with Gemini API key</p>
            <p>2. Run: <code className="text-zinc-300 font-mono">cd backend && uvicorn backend.api.main:app --reload</code></p>
            <p>3. Go to <a href="/pipeline" className="text-blue-400 hover:underline">Run Pipeline</a> to find prospects</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const funnelStages = [
    { label: "Prospects Found", value: data.total_prospects },
    { label: "Emails Sent", value: data.emails_sent },
    { label: "Replies", value: data.replies },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-zinc-500 text-sm mt-1">Real-time outreach pipeline metrics</p>
        </div>
        <Badge variant="outline" className="text-green-400 border-green-400/30">System Online</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Total Prospects" value={data.total_prospects.toLocaleString()} subtitle={`${data.total_runs} pipeline runs`} />
        <MetricCard title="Emails Sent" value={data.emails_sent.toLocaleString()} subtitle="Across all niches" />
        <MetricCard title="Replies" value={data.replies.toLocaleString()} subtitle={`${data.reply_rate}% reply rate`} />
        <MetricCard title="Reply Rate" value={`${data.reply_rate}%`} subtitle={data.reply_rate >= 5 ? "Above average" : "Keep sending"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <p className="text-sm text-zinc-400 mb-4">Pipeline Funnel</p>
            <div className="space-y-4">
              {funnelStages.map((stage) => (
                <div key={stage.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-400">{stage.label}</span>
                    <span className="font-mono text-zinc-200">{stage.value}</span>
                  </div>
                  <Progress value={data.total_prospects > 0 ? (stage.value / data.total_prospects) * 100 : 0} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <p className="text-sm text-zinc-400 mb-4">Prospect Status</p>
            <div className="space-y-3">
              {Object.entries(data.by_status).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <StatusDot status={status} />
                    <span className="text-sm text-zinc-300 capitalize">{status.replace("_", " ")}</span>
                  </div>
                  <span className="font-mono text-sm text-zinc-400">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle }: { title: string; value: string | number; subtitle: string }) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="pt-6">
        <p className="text-xs text-zinc-500 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold font-mono mt-1">{value}</p>
        <p className="text-xs text-zinc-600 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    discovered: "bg-blue-400", emailed: "bg-yellow-400", replied: "bg-green-400",
    dm_only: "bg-purple-400", call_booked: "bg-emerald-400", signed: "bg-green-500", dead: "bg-zinc-600",
  };
  return <div className={`w-2 h-2 rounded-full ${colors[status] || "bg-zinc-500"}`} />;
}
