import { BeachDefinition } from "./beaches";

export type InshoreChopLevel = "Glassy" | "Light Ripple" | "Moderate Chop" | "Rough / Heavy";
export type WaterClarityState = "Turquoise" | "Brown Tide" | "Choppy";
export type BeachStatusColor = "green" | "amber" | "red";

export interface RawMarineTelemetry {
  waveHeightM: number;
  swellHeightM: number;
  swellDirectionDeg: number;
  swellPeriodSec: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  waterTempC?: number;
  timestampIso: string;
}

export interface AIVisionGrade {
  beachSlug: string;
  sargassumScore: number; // 0-100
  waterClarity: WaterClarityState;
  tractorPresent: boolean;
  summary: string;
  gradedAtIso: string;
  cameraId?: string;
  source?: "gemini-2.5-flash" | "heuristic-fallback";
}

export interface ComputedBeachTelemetry {
  beach: BeachDefinition;
  marine: RawMarineTelemetry;
  aiGrade?: AIVisionGrade;
  /** 0 (dangerous/unswimmable) to 100 (perfect glassy turquoise swim) */
  swimScore: number;
  /** 0 (zero seaweed) to 100 (heavy sargassum inundation) */
  sargassumRisk: number;
  /** Effective sargassum % combining AI vision (<3h old) with marine vector model */
  effectiveSargassumScore: number;
  /** Effective inshore wave height in meters after coastal azimuth & reef attenuation */
  inshoreWaveM: number;
  inshoreChop: InshoreChopLevel;
  waterClarity: WaterClarityState;
  statusColor: BeachStatusColor;
  statusLabel: "Prime Swim" | "Caution / Moderate" | "Pivot Recommended";
  swellExposureFactor: number;
  windExposureFactor: number;
  compassSwellLabel: string;
  compassWindLabel: string;
}

/**
 * Plain-language status so nobody has to decode pin colors.
 * Returns a short word plus the tone used for text color.
 */
export function plainStatusLabel(item: {
  statusColor: BeachStatusColor;
  effectiveSargassumScore: number;
  inshoreWaveM: number;
}): { text: string; tone: "good" | "ok" | "bad" } {
  if (item.statusColor === "green") {
    return { text: "Calm & clear", tone: "good" };
  }
  if (item.statusColor === "amber") {
    if (item.effectiveSargassumScore >= 28) return { text: "Light seaweed", tone: "ok" };
    return { text: "Gentle waves", tone: "ok" };
  }
  if (item.effectiveSargassumScore >= 58) return { text: "Heavy seaweed", tone: "bad" };
  return { text: "Rough water", tone: "bad" };
}

export function statusToneClass(tone: "good" | "ok" | "bad"): string {
  return tone === "good" ? "text-emerald-300" : tone === "ok" ? "text-amber-300" : "text-rose-300";
}

/** "Updated just now", "Updated 4 min ago", "Updated 2 hr ago" */
export function formatCameraAge(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return "Live feed";
  if (minutes < 1) return "Updated just now";
  if (minutes < 60) return `Updated ${minutes} min ago`;
  return `Updated ${Math.round(minutes / 60)} hr ago`;
}

/**
 * Top beaches right now: best swim score, then least seaweed. Rough/red beaches never qualify.
 */
export function rankBestRightNow<
  T extends {
    beach: { slug: string };
    statusColor: BeachStatusColor;
    swimScore: number;
    effectiveSargassumScore: number;
  }
>(items: T[], count = 3): T[] {
  return items
    .filter((b) => b.statusColor === "green")
    .sort(
      (a, b) =>
        b.swimScore - a.swimScore || a.effectiveSargassumScore - b.effectiveSargassumScore
    )
    .slice(0, count);
}

/**
 * Angular difference between two compass bearings (0-180 degrees)
 */
export function angularDifferenceDeg(a: number, b: number): number {
  const diff = Math.abs(((a - b) % 360) + 360) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Compute cosine exposure (0.0 to 1.0) of a coastline facing `coastalAzimuthDeg`
 * to an incoming vector from `incomingDirectionDeg`.
 * Direct onshore = 1.0; parallel = 0.15 (diffraction wrap); offshore = 0.05.
 */
export function computeVectorExposure(coastalAzimuthDeg: number, incomingDirectionDeg: number): number {
  const deltaRad = (angularDifferenceDeg(coastalAzimuthDeg, incomingDirectionDeg) * Math.PI) / 180;
  const rawCos = Math.cos(deltaRad);
  if (rawCos >= 0) {
    // Onshore quadrant: blend direct cosine with 15% wrap-around diffraction
    return Math.min(1, 0.15 + 0.85 * rawCos);
  }
  // Leeward / offshore shadow: slight refraction wrap when near 90-120 deg
  const wrap = Math.max(0, (rawCos + 0.5) * 0.3);
  return Number(Math.max(0.04, wrap).toFixed(3));
}

export function degreesToCompass(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const idx = Math.round((((deg % 360) + 360) % 360) / 22.5) % 16;
  return dirs[idx];
}

export function isAiGradeFresh(aiGrade?: AIVisionGrade, nowMs: number = Date.now()): boolean {
  if (!aiGrade?.gradedAtIso) return false;
  const gradedMs = Date.parse(aiGrade.gradedAtIso);
  if (Number.isNaN(gradedMs)) return false;
  const threeHoursMs = 3 * 60 * 60 * 1000;
  return nowMs - gradedMs <= threeHoursMs;
}

/**
 * Core oceanographic scoring model for a Barbados beach.
 */
export function scoreBeachConditions(
  beach: BeachDefinition,
  marine: RawMarineTelemetry,
  aiGrade?: AIVisionGrade,
  nowMs: number = Date.now()
): ComputedBeachTelemetry {
  const swellExp = computeVectorExposure(beach.coastalAzimuthDeg, marine.swellDirectionDeg);
  const windExp = computeVectorExposure(beach.coastalAzimuthDeg, marine.windDirectionDeg);

  // Reef attenuation reduces offshore wave energy significantly, though long-period swells (>11s) overtop reefs more
  const periodFactor = Math.min(1.35, Math.max(0.8, marine.swellPeriodSec / 9.5));
  const effectiveReefShield = Math.max(0.08, beach.reefProtectionFactor * (1 / periodFactor));

  const offshoreEnergyM = Math.max(marine.waveHeightM, marine.swellHeightM * 0.9);
  const rawInshoreWaveM = offshoreEnergyM * swellExp * (1 - effectiveReefShield * 0.78);
  const windChopM = (marine.windSpeedKmh / 45) * windExp * (1 - beach.reefProtectionFactor * 0.5) * 0.45;
  const inshoreWaveM = Number(Math.max(0.05, rawInshoreWaveM + windChopM).toFixed(2));

  // Classify Inshore Chop
  let inshoreChop: InshoreChopLevel = "Glassy";
  if (inshoreWaveM >= 0.95 || (inshoreWaveM >= 0.7 && marine.windSpeedKmh * windExp > 24)) {
    inshoreChop = "Rough / Heavy";
  } else if (inshoreWaveM >= 0.48) {
    inshoreChop = "Moderate Chop";
  } else if (inshoreWaveM >= 0.22) {
    inshoreChop = "Light Ripple";
  }

  // Sargassum Advection Model (Equatorial / Trade Drift predominantly 90° E to 150° SE)
  // Scale by active swell/wind energy so calm days (<1.2m swell) do not falsely trigger high seaweed alerts on the South Coast
  const tradeAdvectionAlignment = computeVectorExposure(120, marine.windDirectionDeg);
  const onshoreTransport = 0.6 * windExp + 0.4 * swellExp;
  const swellEnergyScale = Math.min(1.3, Math.max(0.45, offshoreEnergyM / 1.45));
  const rawSargassumModel =
    (beach.sargassumBaselineFactor * 28 +
      onshoreTransport * 26 * beach.sargassumBaselineFactor +
      tradeAdvectionAlignment * 14 * beach.sargassumBaselineFactor) *
    swellEnergyScale;

  const sargassumRisk = Math.round(Math.min(100, Math.max(0, rawSargassumModel)));

  // Override with Gemini 2.5 Flash vision grade if fresh (<3 hours old)
  const freshAi = isAiGradeFresh(aiGrade, nowMs);
  const effectiveSargassumScore = freshAi && aiGrade
    ? Math.round(aiGrade.sargassumScore * 0.8 + sargassumRisk * 0.2)
    : sargassumRisk;

  // Compute Swim Score (0-100)
  // Start at 98, deduct for inshore wave energy, onshore wind chop, East/North rip current hazard, and sargassum
  let swimRaw = 98;
  swimRaw -= inshoreWaveM * 36;
  swimRaw -= Math.max(0, (marine.windSpeedKmh * windExp - 12) * 0.65);
  swimRaw -= effectiveSargassumScore * 0.48;

  if (beach.coast === "East/Southeast" && beach.reefProtectionFactor < 0.35) {
    swimRaw -= 28; // Persistent Atlantic rip current penalty for open East Coast
  } else if (beach.coast === "North" && beach.reefProtectionFactor < 0.35) {
    swimRaw -= 22;
  }

  if (freshAi && aiGrade?.waterClarity === "Brown Tide") {
    swimRaw -= 18;
  }

  const swimScore = Math.round(Math.min(99, Math.max(8, swimRaw)));

  // Determine Water Clarity
  let waterClarity: WaterClarityState = "Turquoise";
  if (freshAi && aiGrade) {
    waterClarity = aiGrade.waterClarity;
  } else if (effectiveSargassumScore >= 62) {
    waterClarity = "Brown Tide";
  } else if (inshoreChop === "Rough / Heavy" || inshoreChop === "Moderate Chop") {
    waterClarity = "Choppy";
  }

  // Determine overall status pin color
  let statusColor: BeachStatusColor = "green";
  let statusLabel: ComputedBeachTelemetry["statusLabel"] = "Prime Swim";

  if (swimScore < 52 || effectiveSargassumScore >= 58 || inshoreChop === "Rough / Heavy") {
    statusColor = "red";
    statusLabel = "Pivot Recommended";
  } else if (swimScore < 74 || effectiveSargassumScore >= 28 || inshoreChop === "Moderate Chop") {
    statusColor = "amber";
    statusLabel = "Caution / Moderate";
  }

  return {
    beach,
    marine,
    aiGrade,
    swimScore,
    sargassumRisk,
    effectiveSargassumScore,
    inshoreWaveM,
    inshoreChop,
    waterClarity,
    statusColor,
    statusLabel,
    swellExposureFactor: Number(swellExp.toFixed(2)),
    windExposureFactor: Number(windExp.toFixed(2)),
    compassSwellLabel: degreesToCompass(marine.swellDirectionDeg),
    compassWindLabel: degreesToCompass(marine.windDirectionDeg),
  };
}

export interface WindSurfaceAnalysis {
  type: "Offshore" | "Cross-Offshore" | "Cross-Shore" | "Onshore";
  label: string;
  explanation: string;
  tone: "good" | "ok" | "bad";
  windSpeedKmh: number;
  windDirectionDeg: number;
  compassDir: string;
}

/**
 * Calculates whether the prevailing trade wind is blowing offshore (smoothing the water)
 * or onshore (generating rough chop) based on the beach coastal azimuth.
 */
export function analyzeWindSurfaceEffect(
  beach: BeachDefinition,
  windDirectionDeg: number,
  windSpeedKmh: number
): WindSurfaceAnalysis {
  const inlandAngle = (beach.coastalAzimuthDeg + 180) % 360;
  const offshoreDiff = angularDifferenceDeg(windDirectionDeg, inlandAngle);
  const compassDir = degreesToCompass(windDirectionDeg);

  if (offshoreDiff <= 45) {
    return {
      type: "Offshore",
      label: `Offshore Wind · ${compassDir} ${Math.round(windSpeedKmh)} km/h`,
      explanation: "Blowing from land out to sea. The island shelters the bay, grooming the water into flat, glassy conditions.",
      tone: "good",
      windSpeedKmh,
      windDirectionDeg,
      compassDir,
    };
  }
  if (offshoreDiff <= 75) {
    return {
      type: "Cross-Offshore",
      label: `Cross-Offshore · ${compassDir} ${Math.round(windSpeedKmh)} km/h`,
      explanation: "Angled slightly out to sea. Clean water with minimal surface chop.",
      tone: "good",
      windSpeedKmh,
      windDirectionDeg,
      compassDir,
    };
  }
  if (offshoreDiff <= 110) {
    return {
      type: "Cross-Shore",
      label: `Cross-Shore Breeze · ${compassDir} ${Math.round(windSpeedKmh)} km/h`,
      explanation: "Blowing parallel to the shoreline. Expect a light side-drift and minor ripple.",
      tone: "ok",
      windSpeedKmh,
      windDirectionDeg,
      compassDir,
    };
  }
  return {
    type: "Onshore",
    label: `Onshore Wind · ${compassDir} ${Math.round(windSpeedKmh)} km/h`,
    explanation: "Blowing directly in from the ocean onto the beach. Generates surface chop and active wave action.",
    tone: "bad",
    windSpeedKmh,
    windDirectionDeg,
    compassDir,
  };
}

/**
 * Predicts the inshore wave height in meters for a specific beach given offshore wave/wind data.
 */
export function predictInshoreWave(
  beach: BeachDefinition,
  point: {
    waveHeightM: number;
    swellPeriodSec: number;
    swellDirectionDeg: number;
    windSpeedKmh: number;
    windDirectionDeg: number;
  }
): number {
  const swellExp = computeVectorExposure(beach.coastalAzimuthDeg, point.swellDirectionDeg);
  const windExp = computeVectorExposure(beach.coastalAzimuthDeg, point.windDirectionDeg);
  const periodFactor = Math.min(1.35, Math.max(0.8, point.swellPeriodSec / 9.5));
  const effectiveReefShield = Math.max(0.08, beach.reefProtectionFactor * (1 / periodFactor));
  const rawInshoreWaveM = point.waveHeightM * swellExp * (1 - effectiveReefShield * 0.78);
  const windChopM = (point.windSpeedKmh / 45) * windExp * (1 - beach.reefProtectionFactor * 0.5) * 0.45;
  return Number(Math.max(0.05, rawInshoreWaveM + windChopM).toFixed(2));
}
