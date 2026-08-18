import { db } from "../db/schema";
import { insertActivity } from "../db/activities";
import { v4 as uuidv4 } from "uuid";

const STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_API_BASE = "https://www.strava.com/api/v3";

function getClientId(): string {
  const id = process.env.STRAVA_CLIENT_ID;
  if (!id) throw new Error("STRAVA_CLIENT_ID not set");
  return id;
}

function getClientSecret(): string {
  const secret = process.env.STRAVA_CLIENT_SECRET;
  if (!secret) throw new Error("STRAVA_CLIENT_SECRET not set");
  return secret;
}

export function getAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: "activity:read_all",
  });
  return `${STRAVA_AUTH_URL}?${params}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: { id: number };
}

export async function exchangeCode(
  code: string,
  redirectUri: string
): Promise<TokenResponse> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: getClientId(),
      client_secret: getClientSecret(),
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) throw new Error(`Strava token exchange failed: ${res.status}`);
  return res.json() as Promise<TokenResponse>;
}

export function saveTokens(
  athleteId: number,
  accessToken: string,
  refreshToken: string,
  expiresAt: number
): void {
  db.prepare(`
    INSERT OR REPLACE INTO strava_tokens (athlete_id, access_token, refresh_token, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(athleteId, accessToken, refreshToken, expiresAt);
}

function getTokens(
  athleteId: number
): { accessToken: string; refreshToken: string; expiresAt: number } | null {
  const row = db
    .prepare(`SELECT * FROM strava_tokens WHERE athlete_id = ?`)
    .get(athleteId) as
    | {
        access_token: string;
        refresh_token: string;
        expires_at: number;
      }
    | undefined;

  if (!row) return null;
  return {
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    expiresAt: row.expires_at,
  };
}

async function refreshAccessToken(athleteId: number): Promise<string> {
  const tokens = getTokens(athleteId);
  if (!tokens) throw new Error("No tokens for athlete");

  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: getClientId(),
      client_secret: getClientSecret(),
      refresh_token: tokens.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  const data = (await res.json()) as TokenResponse;
  saveTokens(athleteId, data.access_token, data.refresh_token, data.expires_at);
  return data.access_token;
}

async function getValidAccessToken(athleteId: number): Promise<string> {
  const tokens = getTokens(athleteId);
  if (!tokens) throw new Error("No tokens for athlete");

  if (Date.now() / 1000 >= tokens.expiresAt - 300) {
    return refreshAccessToken(athleteId);
  }
  return tokens.accessToken;
}

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  start_date: string;
  elapsed_time: number;
  distance: number;
  total_elevation_gain: number;
  average_speed: number;
}

export async function importActivities(
  athleteId: number,
  year: number
): Promise<number> {
  const accessToken = await getValidAccessToken(athleteId);

  const after = new Date(`${year}-01-01T00:00:00Z`).getTime() / 1000;
  const before = new Date(`${year + 1}-01-01T00:00:00Z`).getTime() / 1000;

  let page = 1;
  let imported = 0;

  while (true) {
    const params = new URLSearchParams({
      after: String(after),
      before: String(before),
      per_page: "100",
      page: String(page),
    });

    const res = await fetch(`${STRAVA_API_BASE}/athlete/activities?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) throw new Error(`Strava API error: ${res.status}`);
    const activities = (await res.json()) as StravaActivity[];
    if (!activities.length) break;

    for (const a of activities) {
      const startTime = new Date(a.start_date);
      const durationSeconds = a.elapsed_time;
      const endTime = new Date(startTime.getTime() + durationSeconds * 1000);
      const distanceMeters = a.distance;
      const avgPace =
        a.average_speed > 0 ? 1000 / a.average_speed : null;

      insertActivity({
        id: uuidv4(),
        name: a.name,
        sport: a.type.toLowerCase(),
        startTime,
        endTime,
        durationSeconds,
        distanceMeters,
        elevationGainMeters: a.total_elevation_gain,
        elevationLossMeters: 0,
        avgPaceSecondsPerKm: avgPace,
        maxPaceSecondsPerKm: null,
        trackPoints: [],
        sourceType: "strava",
        sourceId: String(a.id),
      });
      imported++;
    }

    page++;
  }

  return imported;
}
