import { Router, Request, Response } from "express";
import { getActivitiesForYear } from "../db/activities";
import { computeStats } from "../services/stats";

const router = Router();

router.get("/:year", (req: Request, res: Response) => {
  const year = parseInt(req.params.year, 10);
  if (isNaN(year) || year < 2000 || year > 2100) {
    res.status(400).json({ error: "Invalid year" });
    return;
  }

  const activities = getActivitiesForYear(year);
  const stats = computeStats(activities, year);
  res.json(stats);
});

export default router;
