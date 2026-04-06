const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function runPipeline(niche: string, count: number, autoSend: boolean) {
  return fetchAPI("/pipeline/run", {
    method: "POST",
    body: JSON.stringify({ niche, count, auto_send: autoSend }),
  });
}

export async function searchProspects(niche: string, count: number) {
  return fetchAPI("/prospects/search", {
    method: "POST",
    body: JSON.stringify({ niche, count }),
  });
}

export async function getDashboard() {
  return fetchAPI("/analytics/dashboard");
}

export async function getNicheBreakdown() {
  return fetchAPI("/analytics/niches");
}

export async function getHookAnalysis() {
  return fetchAPI("/analytics/hooks");
}
