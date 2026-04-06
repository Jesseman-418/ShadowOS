"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Prospect {
  handle: string;
  name: string;
  followers: number;
  niche: string;
  has_youtube: boolean;
  has_podcast: boolean;
  has_product: boolean;
  website: string;
  email: string | null;
  qualification_score: number;
}

export default function ProspectsPage() {
  const [niche, setNiche] = useState("fitness coaches");
  const [count, setCount] = useState(15);
  const [searching, setSearching] = useState(false);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    setSearching(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/prospects/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, count }),
      });
      const data = await res.json();
      setProspects(data.data?.prospects || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Prospect Search</h2>
        <p className="text-zinc-500 text-sm mt-1">Find creators matching Shadow Operator criteria</p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-zinc-400">Niche</Label>
              <Input
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g., business coaches, yoga instructors"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="w-24 space-y-2">
              <Label className="text-zinc-400">Count</Label>
              <Input
                type="number"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                min={5}
                max={50}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <Button onClick={handleSearch} disabled={searching} className="bg-blue-600 hover:bg-blue-700">
              {searching ? "Searching..." : "Search"}
            </Button>
          </div>
          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
        </CardContent>
      </Card>

      {prospects.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">
              Found {prospects.length} Prospects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-xs">
                    <th className="text-left py-3 px-2">Handle</th>
                    <th className="text-left py-3 px-2">Name</th>
                    <th className="text-right py-3 px-2">Followers</th>
                    <th className="text-left py-3 px-2">Niche</th>
                    <th className="text-center py-3 px-2">YT</th>
                    <th className="text-center py-3 px-2">Pod</th>
                    <th className="text-center py-3 px-2">Product</th>
                    <th className="text-center py-3 px-2">Score</th>
                    <th className="text-left py-3 px-2">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {prospects.map((p) => (
                    <tr key={p.handle} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="py-3 px-2 font-mono text-blue-400">{p.handle}</td>
                      <td className="py-3 px-2 text-zinc-300">{p.name || "—"}</td>
                      <td className="py-3 px-2 text-right font-mono">{p.followers?.toLocaleString()}</td>
                      <td className="py-3 px-2 text-zinc-400">{p.niche}</td>
                      <td className="py-3 px-2 text-center">{p.has_youtube ? "✓" : "—"}</td>
                      <td className="py-3 px-2 text-center">{p.has_podcast ? "✓" : "—"}</td>
                      <td className="py-3 px-2 text-center">{p.has_product ? "✓" : "—"}</td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant="outline" className="text-xs">{p.qualification_score}/5</Badge>
                      </td>
                      <td className="py-3 px-2 text-xs text-zinc-500 max-w-[150px] truncate">
                        {p.email || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {!searching && prospects.length === 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-16 text-center">
            <p className="text-zinc-500">Search for creators to populate this table</p>
            <p className="text-zinc-600 text-xs mt-2">The Prospector Agent uses Gemini to find matching creators</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
