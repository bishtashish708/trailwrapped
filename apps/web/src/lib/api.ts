import type { RecapStats } from "../types/recap";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function fetchRecap(year: number): Promise<RecapStats> {
  const res = await fetch(`${API}/recap/${year}`);
  if (!res.ok) throw new Error(`Failed to fetch recap: ${res.status}`);
  return res.json();
}

export async function uploadFiles(files: File[]): Promise<{ results: { file: string; status: string; error?: string }[] }> {
  const form = new FormData();
  for (const file of files) form.append("files", file);

  const res = await fetch(`${API}/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

export function stravaConnectUrl(): string {
  return `${API}/strava/connect`;
}

export async function importStrava(athleteId: number, year: number): Promise<{ imported: number }> {
  const res = await fetch(`${API}/strava/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ athleteId, year }),
  });
  if (!res.ok) throw new Error(`Strava import failed: ${res.status}`);
  return res.json();
}
