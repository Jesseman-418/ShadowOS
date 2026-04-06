"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NicheData {
  niche: string;
  prospects: number;
  emails_sent: number;
  replies: number;
  reply_rate: number;
}

interface HookData {
  hook_type: string;
  total_sent: number;
  replies: number;
  reply_rate: number;
  positive: number;
  warm: number;
  negative: number;
}

export default function AnalyticsPage() {
  const [niches, setNiches] = useState<NicheData[]>([]);
  const [hooks, setHooks] = useState<HookData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    Promise.all([
      fetch(`${apiUrl}/analytics/niches`).then((r) => r.json()).catch(() => ({ data: [] })),
      fetch(`${apiUrl}/analytics/hooks`).then((r) => r.json()).catch(() => ({ data: [] })),
    ]).then(([nicheRes, hookRes]) => {
      setNiches(nicheRes.data || []);
      setHooks(hookRes.data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="text-zinc-500 text-sm mt-1">Performance breakdown by niche and hook type</p>
      </div>

      <Tabs defaultValue="niches">
        <TabsList className="bg-zinc-800 mb-6">
          <TabsTrigger value="niches">By Niche</TabsTrigger>
          <TabsTrigger value="hooks">By Hook Type</TabsTrigger>
        </TabsList>

        <TabsContent value="niches">
          {loading ? (
            <LoadingCard />
          ) : niches.length === 0 ? (
            <EmptyCard message="Run a pipeline to see niche analytics" />
          ) : (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 text-xs">
                      <th className="text-left py-3 px-2">Niche</th>
                      <th className="text-right py-3 px-2">Prospects</th>
                      <th className="text-right py-3 px-2">Emails Sent</th>
                      <th className="text-right py-3 px-2">Replies</th>
                      <th className="text-right py-3 px-2">Reply Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {niches.map((n) => (
                      <tr key={n.niche} className="border-b border-zinc-800/50">
                        <td className="py-3 px-2 text-zinc-300">{n.niche}</td>
                        <td className="py-3 px-2 text-right font-mono">{n.prospects}</td>
                        <td className="py-3 px-2 text-right font-mono">{n.emails_sent}</td>
                        <td className="py-3 px-2 text-right font-mono">{n.replies}</td>
                        <td className="py-3 px-2 text-right">
                          <Badge variant="outline" className={n.reply_rate >= 5 ? "text-green-400 border-green-400/30" : "text-zinc-400"}>
                            {n.reply_rate}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="hooks">
          {loading ? (
            <LoadingCard />
          ) : hooks.length === 0 ? (
            <EmptyCard message="Send emails to see hook performance" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hooks.map((h) => (
                <Card key={h.hook_type} className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm capitalize">{h.hook_type?.replace("_", " ")}</CardTitle>
                      <Badge variant="outline" className={h.reply_rate >= 5 ? "text-green-400 border-green-400/30" : ""}>
                        {h.reply_rate}% reply rate
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xl font-bold font-mono">{h.total_sent}</p>
                        <p className="text-xs text-zinc-500">Sent</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold font-mono text-green-400">{h.replies}</p>
                        <p className="text-xs text-zinc-500">Replies</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold font-mono text-blue-400">{h.positive}</p>
                        <p className="text-xs text-zinc-500">Positive</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoadingCard() {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="py-16 text-center">
        <p className="text-zinc-500">Loading analytics...</p>
      </CardContent>
    </Card>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="py-16 text-center">
        <p className="text-zinc-500">{message}</p>
      </CardContent>
    </Card>
  );
}
