import "dotenv/config";
import express from "express";
import cors from "cors";
import "./db/schema";
import uploadRouter from "./routes/upload";
import stravaRouter from "./routes/strava";
import recapRouter from "./routes/recap";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json());

app.use("/upload", uploadRouter);
app.use("/strava", stravaRouter);
app.use("/recap", recapRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`TrailWrapped server running on http://localhost:${PORT}`);
});
