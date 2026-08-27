import { Router, Request, Response } from "express";
import {
  getAuthUrl,
  exchangeCode,
  saveTokens,
  importActivities,
} from "../services/strava";

const router = Router();
const REDIRECT_URI = process.env.STRAVA_REDIRECT_URI ?? "http://localhost:3001/strava/callback";

router.get("/connect", (_req: Request, res: Response) => {
  try {
    res.redirect(getAuthUrl(REDIRECT_URI));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get("/callback", async (req: Request, res: Response) => {
  const { code, error } = req.query;

  if (error || !code) {
    res.status(400).json({ error: error ?? "Missing code" });
    return;
  }

  try {
    const tokens = await exchangeCode(String(code), REDIRECT_URI);
    saveTokens(
      tokens.athlete.id,
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_at
    );
    res.redirect(`http://localhost:3000?strava_connected=1&athlete_id=${tokens.athlete.id}`);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post("/import", async (req: Request, res: Response) => {
  const { athleteId, year } = req.body as { athleteId?: number; year?: number };

  if (!athleteId || !year) {
    res.status(400).json({ error: "athleteId and year are required" });
    return;
  }

  try {
    const count = await importActivities(athleteId, year);
    res.json({ imported: count });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
