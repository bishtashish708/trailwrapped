import type { StoredActivity } from "../types/activity";

export interface RecapStats {
  year: number;
  totalActivities: number;
  totalDistanceKm: number;
  totalElevationGainMeters: number;
  totalDurationHours: number;
  longestActivityDistanceKm: number;
  longestActivityName: string;
  longestActivityDate: string;
  fastestPaceSecondsPerKm: number | null;
  fastestPaceActivityName: string | null;
  longestStreakDays: number;
  mostActiveMonth: string;
  mostActiveMonthActivityCount: number;
  everestMultiple: number;
  sportBreakdown: Record<string, number>;
}

const EVEREST_METERS = 8849;
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function computeStats(
  activities: StoredActivity[],
  year: number
): RecapStats {
  if (!activities.length) {
    return emptyStats(year);
  }

  const totalDistanceKm = sum(activities, (a) => a.distanceMeters) / 1000;
  const totalElevationGainMeters = sum(activities, (a) => a.elevationGainMeters);
  const totalDurationHours = sum(activities, (a) => a.durationSeconds) / 3600;

  const longest = activities.reduce((best, a) =>
    a.distanceMeters > best.distanceMeters ? a : best
  );

  const withPace = activities.filter((a) => a.avgPaceSecondsPerKm !== null);
  const fastest =
    withPace.length > 0
      ? withPace.reduce((best, a) =>
          (a.avgPaceSecondsPerKm ?? Infinity) <
          (best.avgPaceSecondsPerKm ?? Infinity)
            ? a
            : best
        )
      : null;

  const longestStreak = calcLongestStreak(activities);
  const { month: mostActiveMonth, count: mostActiveMonthCount } =
    calcMostActiveMonth(activities);

  const sportBreakdown: Record<string, number> = {};
  for (const a of activities) {
    sportBreakdown[a.sport] = (sportBreakdown[a.sport] ?? 0) + 1;
  }

  return {
    year,
    totalActivities: activities.length,
    totalDistanceKm: round(totalDistanceKm, 1),
    totalElevationGainMeters: round(totalElevationGainMeters, 0),
    totalDurationHours: round(totalDurationHours, 1),
    longestActivityDistanceKm: round(longest.distanceMeters / 1000, 1),
    longestActivityName: longest.name,
    longestActivityDate: longest.startTime.toISOString().split("T")[0],
    fastestPaceSecondsPerKm: fastest?.avgPaceSecondsPerKm ?? null,
    fastestPaceActivityName: fastest?.name ?? null,
    longestStreakDays: longestStreak,
    mostActiveMonth,
    mostActiveMonthActivityCount: mostActiveMonthCount,
    everestMultiple: round(totalElevationGainMeters / EVEREST_METERS, 2),
    sportBreakdown,
  };
}

function calcLongestStreak(activities: StoredActivity[]): number {
  const days = new Set(
    activities.map((a) => a.startTime.toISOString().split("T")[0])
  );
  const sorted = Array.from(days).sort();

  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays =
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

function calcMostActiveMonth(activities: StoredActivity[]): {
  month: string;
  count: number;
} {
  const counts: number[] = new Array(12).fill(0);
  for (const a of activities) {
    counts[a.startTime.getMonth()]++;
  }
  const maxIdx = counts.indexOf(Math.max(...counts));
  return { month: MONTHS[maxIdx], count: counts[maxIdx] };
}

function sum(
  activities: StoredActivity[],
  fn: (a: StoredActivity) => number
): number {
  return activities.reduce((acc, a) => acc + fn(a), 0);
}

function round(n: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

function emptyStats(year: number): RecapStats {
  return {
    year,
    totalActivities: 0,
    totalDistanceKm: 0,
    totalElevationGainMeters: 0,
    totalDurationHours: 0,
    longestActivityDistanceKm: 0,
    longestActivityName: "",
    longestActivityDate: "",
    fastestPaceSecondsPerKm: null,
    fastestPaceActivityName: null,
    longestStreakDays: 0,
    mostActiveMonth: "",
    mostActiveMonthActivityCount: 0,
    everestMultiple: 0,
    sportBreakdown: {},
  };
}
