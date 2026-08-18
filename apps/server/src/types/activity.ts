export interface TrackPoint {
  lat: number;
  lon: number;
  ele: number | null;
  time: Date | null;
}

export interface Activity {
  id: string;
  name: string;
  sport: string;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  distanceMeters: number;
  elevationGainMeters: number;
  elevationLossMeters: number;
  avgPaceSecondsPerKm: number | null;
  maxPaceSecondsPerKm: number | null;
  trackPoints: TrackPoint[];
  sourceType: "gpx" | "tcx" | "fit" | "strava";
  sourceId: string | null;
}

export interface StoredActivity extends Omit<Activity, "trackPoints"> {
  createdAt: Date;
}
