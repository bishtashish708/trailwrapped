"use client";

import { useRef } from "react";
import { toPng } from "html-to-image";
import type { RecapStats } from "../types/recap";

interface Props {
  stats: RecapStats;
}

function formatPace(secondsPerKm: number | null): string {
  if (!secondsPerKm) return "—";
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.round(secondsPerKm % 60);
  return `${mins}:${String(secs).padStart(2, "0")} /km`;
}

function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`;
}

export default function RecapCard({ stats }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  async function exportPng() {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
    const a = document.createElement("a");
    a.download = `trailwrapped-${stats.year}.png`;
    a.href = dataUrl;
    a.click();
  }

  const topSport = Object.entries(stats.sportBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";

  return (
    <div className="space-y-6">
      <div
        ref={cardRef}
        className="relative bg-gradient-to-br from-trail-dark via-[#1a2e22] to-[#0d1f14] rounded-2xl p-8 overflow-hidden"
        style={{ width: 480 }}
      >
        {/* decorative ring */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-trail-lime/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* header */}
          <div>
            <p className="text-trail-lime text-xs font-semibold uppercase tracking-widest">TrailWrapped</p>
            <h2 className="text-4xl font-black text-white mt-1">{stats.year}</h2>
            {topSport && (
              <p className="text-gray-400 text-sm mt-1 capitalize">{topSport} · {stats.totalActivities} activities</p>
            )}
          </div>

          {/* hero stat */}
          <div className="bg-trail-lime/10 rounded-xl px-6 py-5">
            <p className="text-trail-lime/70 text-xs font-medium uppercase tracking-wider">Total distance</p>
            <p className="text-5xl font-black text-white mt-1">
              {stats.totalDistanceKm.toLocaleString()}<span className="text-2xl font-medium text-trail-lime ml-1">km</span>
            </p>
          </div>

          {/* grid stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatBlock label="Elevation gained" value={`${stats.totalElevationGainMeters.toLocaleString()} m`} />
            <StatBlock label="Time on trail" value={formatDuration(stats.totalDurationHours)} />
            <StatBlock label="Longest activity" value={`${stats.longestActivityDistanceKm} km`} sub={stats.longestActivityName} />
            <StatBlock label="Best pace" value={formatPace(stats.fastestPaceSecondsPerKm)} sub={stats.fastestPaceActivityName ?? ""} />
            <StatBlock label="Longest streak" value={`${stats.longestStreakDays} days`} />
            <StatBlock label="Best month" value={stats.mostActiveMonth} sub={`${stats.mostActiveMonthActivityCount} activities`} />
          </div>

          {/* everest comparison */}
          {stats.everestMultiple > 0 && (
            <p className="text-sm text-gray-400 text-center">
              You climbed the equivalent of{" "}
              <span className="text-trail-lime font-semibold">{stats.everestMultiple}× Everest</span>
            </p>
          )}
        </div>
      </div>

      <button
        onClick={exportPng}
        className="w-full py-3 rounded-xl bg-trail-green hover:bg-trail-lime/80 text-white font-semibold transition-colors"
      >
        Export as PNG
      </button>
    </div>
  );
}

function StatBlock({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/5 rounded-lg px-4 py-3">
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="text-white font-bold text-lg leading-tight mt-0.5">{value}</p>
      {sub && <p className="text-gray-500 text-xs truncate">{sub}</p>}
    </div>
  );
}
