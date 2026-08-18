import { v4 as uuidv4 } from "uuid";
import type { Activity, TrackPoint } from "../types/activity";

// ---------- shared helpers ----------

function calcElevationDeltas(points: TrackPoint[]): {
  gain: number;
  loss: number;
} {
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1].ele;
    const curr = points[i].ele;
    if (prev !== null && curr !== null) {
      const diff = curr - prev;
      if (diff > 0) gain += diff;
      else loss += Math.abs(diff);
    }
  }
  return { gain, loss };
}

function calcDistanceMeters(points: TrackPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineMeters(
      points[i - 1].lat,
      points[i - 1].lon,
      points[i].lat,
      points[i].lon
    );
  }
  return total;
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function paceFromDistanceAndDuration(
  distanceMeters: number,
  durationSeconds: number
): number | null {
  if (distanceMeters < 10) return null;
  const km = distanceMeters / 1000;
  return durationSeconds / km;
}

// ---------- GPX ----------

export async function parseGpx(buffer: Buffer): Promise<Activity> {
  const GpxParser = (await import("gpxparser")).default;
  const parser = new GpxParser();
  parser.parse(buffer.toString("utf-8"));

  const track = parser.tracks?.[0];
  if (!track) throw new Error("No track found in GPX file");

  const points: TrackPoint[] = (track.points ?? []).map(
    (p: { lat: number; lon: number; ele: number; time: Date }) => ({
      lat: p.lat,
      lon: p.lon,
      ele: p.ele ?? null,
      time: p.time ? new Date(p.time) : null,
    })
  );

  const times = points.map((p) => p.time).filter(Boolean) as Date[];
  const startTime = times[0] ?? new Date();
  const endTime = times[times.length - 1] ?? startTime;
  const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
  const distanceMeters = calcDistanceMeters(points);
  const { gain, loss } = calcElevationDeltas(points);

  return {
    id: uuidv4(),
    name: track.name || "Unnamed activity",
    sport: track.type || "unknown",
    startTime,
    endTime,
    durationSeconds,
    distanceMeters,
    elevationGainMeters: gain,
    elevationLossMeters: loss,
    avgPaceSecondsPerKm: paceFromDistanceAndDuration(
      distanceMeters,
      durationSeconds
    ),
    maxPaceSecondsPerKm: null,
    trackPoints: points,
    sourceType: "gpx",
    sourceId: null,
  };
}

// ---------- TCX ----------

export async function parseTcx(buffer: Buffer): Promise<Activity> {
  // tcx-js has no type defs — import dynamically
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const TCXParser = require("tcx-js");
  const parser = new TCXParser.TcxDataParser();
  parser.parse(buffer.toString("utf-8"));

  const activities = parser.activity_list();
  if (!activities?.length) throw new Error("No activities found in TCX file");

  const act = activities[0];
  const laps: unknown[] = act.laps ?? [];

  const points: TrackPoint[] = [];
  for (const lap of laps) {
    const l = lap as {
      trackpoints?: {
        lat?: number;
        lng?: number;
        alt?: number;
        time?: string;
      }[];
    };
    for (const tp of l.trackpoints ?? []) {
      if (tp.lat !== undefined && tp.lng !== undefined) {
        points.push({
          lat: tp.lat,
          lon: tp.lng,
          ele: tp.alt ?? null,
          time: tp.time ? new Date(tp.time) : null,
        });
      }
    }
  }

  const times = points.map((p) => p.time).filter(Boolean) as Date[];
  const startTime = new Date(act.start_time ?? times[0] ?? Date.now());
  const endTime = times[times.length - 1] ?? startTime;
  const distanceMeters = calcDistanceMeters(points);
  const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
  const { gain, loss } = calcElevationDeltas(points);

  return {
    id: uuidv4(),
    name: act.name || "TCX activity",
    sport: act.sport || "unknown",
    startTime,
    endTime,
    durationSeconds,
    distanceMeters,
    elevationGainMeters: gain,
    elevationLossMeters: loss,
    avgPaceSecondsPerKm: paceFromDistanceAndDuration(
      distanceMeters,
      durationSeconds
    ),
    maxPaceSecondsPerKm: null,
    trackPoints: points,
    sourceType: "tcx",
    sourceId: null,
  };
}

// ---------- FIT ----------

export async function parseFit(buffer: Buffer): Promise<Activity> {
  const FitParser = (await import("fit-file-parser")).default;
  const fitParser = new FitParser({ force: true, mode: "both" });

  const fitData = await new Promise<Record<string, unknown>>(
    (resolve, reject) => {
      fitParser.parse(buffer, (err: Error | null, data: unknown) => {
        if (err) reject(err);
        else resolve(data as Record<string, unknown>);
      });
    }
  );

  const records = (fitData.records as Record<string, unknown>[]) ?? [];
  const points: TrackPoint[] = records
    .filter((r) => r.position_lat !== undefined && r.position_long !== undefined)
    .map((r) => ({
      lat: r.position_lat as number,
      lon: r.position_long as number,
      ele: (r.altitude as number) ?? null,
      time: r.timestamp ? new Date(r.timestamp as string) : null,
    }));

  const session = (fitData.sessions as Record<string, unknown>[])?.[0] ?? {};
  const times = points.map((p) => p.time).filter(Boolean) as Date[];
  const startTime = session.start_time
    ? new Date(session.start_time as string)
    : times[0] ?? new Date();
  const endTime = times[times.length - 1] ?? startTime;
  const distanceMeters =
    (session.total_distance as number) ?? calcDistanceMeters(points);
  const durationSeconds =
    (session.total_elapsed_time as number) ??
    (endTime.getTime() - startTime.getTime()) / 1000;
  const { gain, loss } = calcElevationDeltas(points);

  const sport = (session.sport as string) ?? "unknown";
  const name = sport.charAt(0).toUpperCase() + sport.slice(1) + " activity";

  return {
    id: uuidv4(),
    name,
    sport,
    startTime,
    endTime,
    durationSeconds,
    distanceMeters,
    elevationGainMeters: (session.total_ascent as number) ?? gain,
    elevationLossMeters: (session.total_descent as number) ?? loss,
    avgPaceSecondsPerKm: paceFromDistanceAndDuration(
      distanceMeters,
      durationSeconds
    ),
    maxPaceSecondsPerKm: null,
    trackPoints: points,
    sourceType: "fit",
    sourceId: null,
  };
}
