import { describe, expect, it } from "vitest";
import { BARBADOS_BEACHES, getBeachBySlug } from "../beaches";
import { findBestPivotBeach } from "../pivot";
import {
  computeVectorExposure,
  RawMarineTelemetry,
  scoreBeachConditions,
} from "../scoring";

describe("BimBeachCheck Marine & Pivot Telemetry Engine", () => {
  const typicalTradeDay: RawMarineTelemetry = {
    waveHeightM: 1.6,
    swellHeightM: 1.5,
    swellDirectionDeg: 115, // ESE trade swell
    swellPeriodSec: 9,
    windSpeedKmh: 26,
    windDirectionDeg: 110, // ESE trade wind
    waterTempC: 28.2,
    timestampIso: "2026-10-16T15:00:00.000Z",
  };

  it("computes high exposure for East/Southeast coast and low leeward exposure for West coast", () => {
    const crane = getBeachBySlug("crane-beach")!;
    const pebbles = getBeachBySlug("pebbles-beach")!;

    const craneExp = computeVectorExposure(crane.coastalAzimuthDeg, 115);
    const pebblesExp = computeVectorExposure(pebbles.coastalAzimuthDeg, 115);

    expect(craneExp).toBeGreaterThan(0.9);
    expect(pebblesExp).toBeLessThan(0.15);
  });

  it("scores Pebbles Beach as Prime Swim (green) on a brisk ESE trade wind day", () => {
    const pebbles = getBeachBySlug("pebbles-beach")!;
    const telemetry = scoreBeachConditions(pebbles, typicalTradeDay);

    expect(telemetry.statusColor).toBe("green");
    expect(telemetry.swimScore).toBeGreaterThanOrEqual(80);
    expect(telemetry.inshoreChop).toBe("Glassy");
  });

  it("overrides heuristic sargassum model when a fresh (<3h) Gemini 2.5 Flash grade is present", () => {
    const miami = getBeachBySlug("miami-beach")!;
    const nowMs = Date.parse("2026-10-16T15:30:00.000Z");

    const withHeavyAiGrade = scoreBeachConditions(
      miami,
      typicalTradeDay,
      {
        beachSlug: "miami-beach",
        sargassumScore: 88,
        waterClarity: "Brown Tide",
        tractorPresent: true,
        summary: "Heavy sargassum mat along the southern shoreline; NCC tractor actively clearing.",
        gradedAtIso: "2026-10-16T15:00:00.000Z",
      },
      nowMs
    );

    expect(withHeavyAiGrade.effectiveSargassumScore).toBeGreaterThan(70);
    expect(withHeavyAiGrade.waterClarity).toBe("Brown Tide");
    expect(withHeavyAiGrade.statusColor).toBe("red");
  });

  it("calculates a nearby green Safe Pivot beach when Miami Beach is red/amber", () => {
    const nowMs = Date.parse("2026-10-16T15:30:00.000Z");
    const allTelemetries = BARBADOS_BEACHES.map((beach) =>
      scoreBeachConditions(
        beach,
        typicalTradeDay,
        beach.slug === "miami-beach"
          ? {
              beachSlug: "miami-beach",
              sargassumScore: 85,
              waterClarity: "Brown Tide",
              tractorPresent: true,
              summary: "Heavy sargassum influx on south side.",
              gradedAtIso: "2026-10-16T15:00:00.000Z",
            }
          : undefined,
        nowMs
      )
    );

    const miamiTelemetry = allTelemetries.find((t) => t.beach.slug === "miami-beach")!;
    const pivot = findBestPivotBeach(miamiTelemetry, allTelemetries);

    expect(pivot).not.toBeNull();
    expect(pivot!.target.statusColor).toBe("green");
    expect(pivot!.estimatedDriveMinutes).toBeGreaterThanOrEqual(4);
    expect(pivot!.estimatedDriveMinutes).toBeLessThanOrEqual(25);
    expect(pivot!.reasonHeadline).toContain("Pivot to");
  });
});
