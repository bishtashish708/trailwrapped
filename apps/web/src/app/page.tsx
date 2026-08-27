"use client";

import { useEffect, useState } from "react";
import FileUpload from "../components/FileUpload";
import RecapCard from "../components/RecapCard";
import { fetchRecap, stravaConnectUrl, importStrava } from "../lib/api";
import type { RecapStats } from "../types/recap";

export default function Home() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [stats, setStats] = useState<RecapStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stravaAthleteId, setStravaAthleteId] = useState<string | null>(null);

  // restore a previously connected Strava athlete from this browser
  useEffect(() => {
    setStravaAthleteId(localStorage.getItem("stravaAthleteId"));
  }, []);

  // pick up ?strava_connected=1&athlete_id=X from Strava OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const athleteId = params.get("athlete_id");
    if (params.get("strava_connected") && athleteId) {
      localStorage.setItem("stravaAthleteId", athleteId);
      setStravaAthleteId(athleteId);
      importStrava(Number(athleteId), year)
        .then(() => loadRecap())
        .catch((e) => setError(String(e)));
      window.history.replaceState({}, "", "/");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadRecap() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRecap(year);
      setStats(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-lg space-y-10">
        {/* hero */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tight">
            Trail<span className="text-trail-lime">Wrapped</span>
          </h1>
          <p className="text-gray-400">Your year on the trail — yours to keep.</p>
        </div>

        {/* year picker */}
        <div className="flex items-center justify-center gap-3">
          <label className="text-sm text-gray-400">Year</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-white/10 text-white rounded-lg px-3 py-1.5 text-sm border border-white/10 focus:outline-none"
          >
            {Array.from({ length: 6 }, (_, i) => currentYear - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* data sources */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Connect a data source</h2>

          {stravaAthleteId ? (
            <div className="flex items-center justify-between gap-3 w-full bg-white/5 border border-trail-lime/30 rounded-xl px-5 py-4">
              <span className="flex items-center gap-3 text-trail-lime font-semibold">
                <StravaIcon />
                Connected to Strava
              </span>
              <button
                onClick={() => {
                  setError(null);
                  importStrava(Number(stravaAthleteId), year)
                    .then(() => loadRecap())
                    .catch((e) => setError(String(e)));
                }}
                className="text-sm text-gray-300 hover:text-white underline underline-offset-2"
              >
                Sync now
              </button>
            </div>
          ) : (
            <a
              href={stravaConnectUrl()}
              className="flex items-center gap-3 w-full bg-[#FC4C02] hover:bg-[#e04400] transition-colors rounded-xl px-5 py-4 font-semibold"
            >
              <StravaIcon />
              Connect with Strava
            </a>
          )}

          <div className="text-center text-sm text-gray-500">or</div>

          <FileUpload onImported={loadRecap} />
        </section>

        {/* generate button */}
        <button
          onClick={loadRecap}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-trail-green hover:bg-trail-lime/80 text-white font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? "Generating..." : `Generate ${year} Recap`}
        </button>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        {/* recap card */}
        {stats && !loading && (
          <RecapCard stats={stats} />
        )}

        {stats?.totalActivities === 0 && (
          <p className="text-center text-gray-500 text-sm">
            No activities found for {year}. Upload some files or connect Strava to get started.
          </p>
        )}
      </div>
    </main>
  );
}

function StravaIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.463 0 4 13.828h4.172" />
    </svg>
  );
}
