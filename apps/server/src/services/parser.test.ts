import { describe, expect, it } from "vitest";
import { parseGpx } from "./parser";

function gpx(trackXml: string): Buffer {
  return Buffer.from(
    `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1">
${trackXml}
</gpx>`,
    "utf-8"
  );
}

const SAMPLE_TRACK = `
  <trk>
    <name>Test Hike</name>
    <type>trail_running</type>
    <trkseg>
      <trkpt lat="37.0000" lon="-122.0000"><ele>100</ele><time>2026-01-01T08:00:00Z</time></trkpt>
      <trkpt lat="37.0010" lon="-122.0000"><ele>150</ele><time>2026-01-01T08:03:00Z</time></trkpt>
      <trkpt lat="37.0020" lon="-122.0000"><ele>120</ele><time>2026-01-01T08:06:00Z</time></trkpt>
      <trkpt lat="37.0030" lon="-122.0000"><ele>200</ele><time>2026-01-01T08:10:00Z</time></trkpt>
    </trkseg>
  </trk>`;

describe("parseGpx", () => {
  it("normalizes a track into an activity", async () => {
    const activity = await parseGpx(gpx(SAMPLE_TRACK));

    expect(activity.name).toBe("Test Hike");
    expect(activity.sport).toBe("trail_running");
    expect(activity.sourceType).toBe("gpx");
    expect(activity.trackPoints).toHaveLength(4);
  });

  it("sums only the positive elevation deltas into gain, and negative into loss", async () => {
    const activity = await parseGpx(gpx(SAMPLE_TRACK));

    // 100 -> 150 (+50) -> 120 (-30) -> 200 (+80)
    expect(activity.elevationGainMeters).toBe(130);
    expect(activity.elevationLossMeters).toBe(30);
  });

  it("derives duration from the first and last trackpoint timestamps", async () => {
    const activity = await parseGpx(gpx(SAMPLE_TRACK));

    expect(activity.durationSeconds).toBe(600); // 08:00 -> 08:10
    expect(activity.startTime.toISOString()).toBe("2026-01-01T08:00:00.000Z");
    expect(activity.endTime.toISOString()).toBe("2026-01-01T08:10:00.000Z");
  });

  it("computes a plausible haversine distance across the track", async () => {
    const activity = await parseGpx(gpx(SAMPLE_TRACK));

    // three ~0.001deg latitude steps at the equator-ish, roughly 111m each
    expect(activity.distanceMeters).toBeGreaterThan(300);
    expect(activity.distanceMeters).toBeLessThan(340);
  });

  it("falls back to 'unknown' sport when the track has no <type>", async () => {
    const noType = SAMPLE_TRACK.replace("<type>trail_running</type>", "");
    const activity = await parseGpx(gpx(noType));

    expect(activity.sport).toBe("unknown");
  });

  it("leaves pace null for a track shorter than 10 meters", async () => {
    const tiny = `
  <trk>
    <name>Standing still</name>
    <trkseg>
      <trkpt lat="37.0000" lon="-122.0000"><ele>100</ele><time>2026-01-01T08:00:00Z</time></trkpt>
      <trkpt lat="37.0000" lon="-122.0000"><ele>100</ele><time>2026-01-01T08:00:05Z</time></trkpt>
    </trkseg>
  </trk>`;
    const activity = await parseGpx(gpx(tiny));

    expect(activity.avgPaceSecondsPerKm).toBeNull();
  });

  it("throws when the file has no track", async () => {
    await expect(parseGpx(gpx(""))).rejects.toThrow("No track found in GPX file");
  });
});
