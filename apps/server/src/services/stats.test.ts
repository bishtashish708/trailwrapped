import { describe, expect, it } from "vitest";
import type { StoredActivity } from "../types/activity";
import { computeStats } from "./stats";

let counter = 0;

function makeActivity(overrides: Partial<StoredActivity> = {}): StoredActivity {
  counter++;
  return {
    id: `activity-${counter}`,
    name: `Activity ${counter}`,
    sport: "hike",
    startTime: new Date("2026-01-01T08:00:00Z"),
    endTime: new Date("2026-01-01T09:00:00Z"),
    durationSeconds: 3600,
    distanceMeters: 5000,
    elevationGainMeters: 100,
    elevationLossMeters: 100,
    avgPaceSecondsPerKm: 720,
    maxPaceSecondsPerKm: null,
    sourceType: "gpx",
    sourceId: null,
    createdAt: new Date("2026-01-01T09:00:00Z"),
    ...overrides,
  };
}

describe("computeStats", () => {
  it("returns empty stats when there are no activities", () => {
    const stats = computeStats([], 2026);

    expect(stats).toEqual({
      year: 2026,
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
    });
  });

  it("sums distance, elevation, and duration across activities", () => {
    const stats = computeStats(
      [
        makeActivity({ distanceMeters: 5000, elevationGainMeters: 100, durationSeconds: 3600 }),
        makeActivity({ distanceMeters: 8000, elevationGainMeters: 250, durationSeconds: 5400 }),
      ],
      2026
    );

    expect(stats.totalActivities).toBe(2);
    expect(stats.totalDistanceKm).toBe(13);
    expect(stats.totalElevationGainMeters).toBe(350);
    expect(stats.totalDurationHours).toBe(2.5);
  });

  it("picks the longest activity by distance", () => {
    const stats = computeStats(
      [
        makeActivity({ name: "Short loop", distanceMeters: 2000 }),
        makeActivity({
          name: "Ridge traverse",
          distanceMeters: 21000,
          startTime: new Date("2026-03-14T07:00:00Z"),
        }),
      ],
      2026
    );

    expect(stats.longestActivityName).toBe("Ridge traverse");
    expect(stats.longestActivityDistanceKm).toBe(21);
    expect(stats.longestActivityDate).toBe("2026-03-14");
  });

  it("picks the fastest pace among activities that have one", () => {
    const stats = computeStats(
      [
        makeActivity({ name: "Casual walk", avgPaceSecondsPerKm: 900 }),
        makeActivity({ name: "Treadmill sprint", avgPaceSecondsPerKm: 240 }),
        makeActivity({ name: "GPS-less trail", avgPaceSecondsPerKm: null }),
      ],
      2026
    );

    expect(stats.fastestPaceActivityName).toBe("Treadmill sprint");
    expect(stats.fastestPaceSecondsPerKm).toBe(240);
  });

  it("reports no fastest pace when every activity lacks one", () => {
    const stats = computeStats(
      [makeActivity({ avgPaceSecondsPerKm: null }), makeActivity({ avgPaceSecondsPerKm: null })],
      2026
    );

    expect(stats.fastestPaceSecondsPerKm).toBeNull();
    expect(stats.fastestPaceActivityName).toBeNull();
  });

  it("computes the Everest multiple from total elevation gain", () => {
    const stats = computeStats(
      [makeActivity({ elevationGainMeters: 8849 }), makeActivity({ elevationGainMeters: 8849 })],
      2026
    );

    expect(stats.totalElevationGainMeters).toBe(17698);
    expect(stats.everestMultiple).toBe(2);
  });

  it("counts activities per sport", () => {
    const stats = computeStats(
      [
        makeActivity({ sport: "hike" }),
        makeActivity({ sport: "hike" }),
        makeActivity({ sport: "run" }),
      ],
      2026
    );

    expect(stats.sportBreakdown).toEqual({ hike: 2, run: 1 });
  });

  it("finds the longest streak of consecutive calendar days", () => {
    const stats = computeStats(
      [
        makeActivity({ startTime: new Date("2026-06-01T08:00:00Z") }),
        makeActivity({ startTime: new Date("2026-06-02T08:00:00Z") }),
        makeActivity({ startTime: new Date("2026-06-03T08:00:00Z") }),
        // gap
        makeActivity({ startTime: new Date("2026-06-10T08:00:00Z") }),
      ],
      2026
    );

    expect(stats.longestStreakDays).toBe(3);
  });

  it("treats two activities on the same day as a streak of one", () => {
    const stats = computeStats(
      [
        makeActivity({ startTime: new Date("2026-06-01T08:00:00Z") }),
        makeActivity({ startTime: new Date("2026-06-01T18:00:00Z") }),
      ],
      2026
    );

    expect(stats.longestStreakDays).toBe(1);
  });

  it("finds the most active month by activity count", () => {
    const stats = computeStats(
      [
        makeActivity({ startTime: new Date("2026-02-05T08:00:00Z") }),
        makeActivity({ startTime: new Date("2026-02-19T08:00:00Z") }),
        makeActivity({ startTime: new Date("2026-07-04T08:00:00Z") }),
      ],
      2026
    );

    expect(stats.mostActiveMonth).toBe("February");
    expect(stats.mostActiveMonthActivityCount).toBe(2);
  });
});
