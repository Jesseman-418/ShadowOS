"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface PipelineResult {
  status: string;
  duration_ms: number;
  metadata: {
    niche: string;
    prospects_found: number;
    emails_generated: number;
    emails_sent: number;
  };
  data: {
    stages: Record<string, { status: string; duration_ms?: number; [key: string]: unknown }>;
    prospects_processed: Array<{
      handle: string;
      name: string;
      followers: number;
      niche: string;
      email: string | null;
      score: number;
      email_generated: boolean;
    }>;
    emails_generated: Array<{
      handle: string;
      subject: string;
      hook_type: string;
      has_email: boolean;
    }>;
    errors: string[];
  };
}

export default function PipelinePage() {
  const [niche, setNiche] = useState("fitness coaches");
  const [count, setCount] = useState(15);
  const [autoSend, setAutoSend] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState("");

  async function handleRun() {
    setRunning(true);
    setError(null);
    setResult(null);
    setCurrentStage("Finding prospects...");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/pipeline/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, count, auto_send: autoSend }),
      });
      const data = await res.json();
      setResult(data);
      setCurrentStage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pipeline failed");
      setCurrentStage("");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Run Pipeline</h2>
        <p className="text-zinc-500 text-sm mt-1">
          Launch the full autonomous outreach pipeline
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Target Niche</Label>
              <Input
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g., fitness coaches"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400">Prospect Count</Label>
              <Input
                type="number"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                min={5}
                max={50}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoSend"
                checked={autoSend}
                onChange={(e) => setAutoSend(e.target.checked)}
                className="rounded bg-zinc-800 border-zinc-700"
              />
              <Label htmlFor="autoSend" className="text-zinc-400 text-sm">
                Auto-send emails
              </Label>
            </div>

            <Button
              onClick={handleRun}
              disabled={running || !niche}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {running ? "Running Pipeline..." : "Launch Pipeline"}
            </Button>

            {running && (
              <div className="flex items-center gap-2 text-sm text-yellow-400">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                {currentStage}
              </div>
            )}

            {error && (
              <div className="text-sm text-red-400 bg-red-400/10 p-3 rounded-md">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {result && (
            <>
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-zinc-400">Pipeline Result</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={result.status === "success" ? "default" : "destructive"}>
                        {result.status}
                      </Badge>
                      <span className="text-xs text-zinc-500 font-mono">
                        {(result.duration_ms / 1000).toFixed(1)}s
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <Stat label="Prospects Found" value={result.metadata.prospects_found} />
                    <Stat label="Emails Generated" value={result.metadata.emails_generated} />
                    <Stat label="Emails Sent" value={result.metadata.emails_sent} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-sm text-zinc-400">Pipeline Stages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(result.data.stages).map(([stage, info]) => (
                      <div key={stage} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                        <div className="flex items-center gap-3">
                          <StageIcon status={info.status} />
                          <span className="text-sm capitalize">{stage}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {info.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {result.data.prospects_processed.length > 0 && (
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-sm text-zinc-400">
                      Prospects ({result.data.prospects_processed.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.data.prospects_processed.map((p) => (
                        <div key={p.handle} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                          <div>
                            <span className="text-sm font-medium">{p.handle}</span>
                            {p.name && <span className="text-xs text-zinc-500 ml-2">{p.name}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500 font-mono">{p.followers?.toLocaleString()}</span>
                            <Badge variant="outline" className="text-xs">
                              {p.score}/5
                            </Badge>
                            {p.email ? (
                              <Badge className="bg-green-500/10 text-green-400 text-xs">Email</Badge>
                            ) : (
                              <Badge className="bg-purple-500/10 text-purple-400 text-xs">DM Only</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {result.data.emails_generated.length > 0 && (
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-sm text-zinc-400">
                      Generated Emails ({result.data.emails_generated.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.data.emails_generated.map((e, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                          <div>
                            <span className="text-sm">{e.handle}</span>
                            <span className="text-xs text-zinc-500 ml-2">{e.subject}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <HookBadge type={e.hook_type} />
                            {e.has_email ? (
                              <Badge className="bg-green-500/10 text-green-400 text-xs">Ready</Badge>
                            ) : (
                              <Badge className="bg-zinc-500/10 text-zinc-400 text-xs">No Email</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {result.data.errors.length > 0 && (
                <Card className="bg-zinc-900 border-red-800/50">
                  <CardHeader>
                    <CardTitle className="text-sm text-red-400">Errors ({result.data.errors.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {result.data.errors.map((err, i) => (
                        <p key={i} className="text-xs text-red-300 font-mono">{String(err)}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!result && !running && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-16 text-center">
                <p className="text-zinc-500 text-sm">Configure and launch a pipeline to see results here</p>
                <p className="text-zinc-600 text-xs mt-2">The orchestrator will coordinate all 5 agents autonomously</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold font-mono">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}

function StageIcon({ status }: { status: string }) {
  if (status === "success") return <div className="w-2 h-2 rounded-full bg-green-400" />;
  if (status === "failed") return <div className="w-2 h-2 rounded-full bg-red-400" />;
  if (status === "skipped") return <div className="w-2 h-2 rounded-full bg-zinc-500" />;
  return <div className="w-2 h-2 rounded-full bg-yellow-400" />;
}

function HookBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    contrarian: "bg-red-500/10 text-red-400",
    statistic: "bg-blue-500/10 text-blue-400",
    big_statement: "bg-yellow-500/10 text-yellow-400",
    question: "bg-purple-500/10 text-purple-400",
  };
  return (
    <Badge className={`text-xs ${colors[type] || "bg-zinc-500/10 text-zinc-400"}`}>
      {type}
    </Badge>
  );
}
