import { db } from "./schema";
import type { Activity, StoredActivity } from "../types/activity";

/** Returns true if a new row was inserted, false if it was skipped as a duplicate. */
export function insertActivity(activity: Activity): boolean {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO activities
      (id, name, sport, start_time, end_time, duration_seconds,
       distance_meters, elevation_gain_meters, elevation_loss_meters,
       avg_pace_seconds_per_km, max_pace_seconds_per_km, source_type, source_id)
    VALUES
      (@id, @name, @sport, @startTime, @endTime, @durationSeconds,
       @distanceMeters, @elevationGainMeters, @elevationLossMeters,
       @avgPaceSecondsPerKm, @maxPaceSecondsPerKm, @sourceType, @sourceId)
  `);

  const info = stmt.run({
    id: activity.id,
    name: activity.name,
    sport: activity.sport,
    startTime: activity.startTime.toISOString(),
    endTime: activity.endTime.toISOString(),
    durationSeconds: activity.durationSeconds,
    distanceMeters: activity.distanceMeters,
    elevationGainMeters: activity.elevationGainMeters,
    elevationLossMeters: activity.elevationLossMeters,
    avgPaceSecondsPerKm: activity.avgPaceSecondsPerKm,
    maxPaceSecondsPerKm: activity.maxPaceSecondsPerKm,
    sourceType: activity.sourceType,
    sourceId: activity.sourceId,
  });

  return info.changes > 0;
}

export function getActivitiesForYear(year: number): StoredActivity[] {
  const rows = db
    .prepare(
      `SELECT * FROM activities
       WHERE strftime('%Y', start_time) = ?
       ORDER BY start_time ASC`
    )
    .all(String(year)) as Record<string, unknown>[];

  return rows.map(rowToActivity);
}

export function getAllActivities(): StoredActivity[] {
  const rows = db
    .prepare(`SELECT * FROM activities ORDER BY start_time ASC`)
    .all() as Record<string, unknown>[];

  return rows.map(rowToActivity);
}

function rowToActivity(row: Record<string, unknown>): StoredActivity {
  return {
    id: row.id as string,
    name: row.name as string,
    sport: row.sport as string,
    startTime: new Date(row.start_time as string),
    endTime: new Date(row.end_time as string),
    durationSeconds: row.duration_seconds as number,
    distanceMeters: row.distance_meters as number,
    elevationGainMeters: row.elevation_gain_meters as number,
    elevationLossMeters: row.elevation_loss_meters as number,
    avgPaceSecondsPerKm: row.avg_pace_seconds_per_km as number | null,
    maxPaceSecondsPerKm: row.max_pace_seconds_per_km as number | null,
    sourceType: row.source_type as "gpx" | "tcx" | "fit" | "strava",
    sourceId: row.source_id as string | null,
    createdAt: new Date(row.created_at as string),
  };
}
