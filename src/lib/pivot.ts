import { ComputedBeachTelemetry } from "./scoring";

export interface SafePivotRecommendation {
  fromBeachSlug: string;
  fromBeachName: string;
  target: ComputedBeachTelemetry;
  straightLineKm: number;
  roadDistanceKm: number;
  estimatedDriveMinutes: number;
  reasonHeadline: string;
  comparisonSummary: string;
}

const EARTH_RADIUS_KM = 6371;
const BARBADOS_ROAD_WINDING_FACTOR = 1.35;
const BARBADOS_AVG_DRIVE_KMH = 36;

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/**
 * Given a selected beach and all computed beach telemetries, finds the optimal
 * green "Safe Pivot" beach ranked by drive proximity and swim quality.
 */
export function findBestPivotBeach(
  current: ComputedBeachTelemetry,
  allBeaches: ComputedBeachTelemetry[]
): SafePivotRecommendation | null {
  const candidates = allBeaches.filter(
    (item) =>
      item.beach.slug !== current.beach.slug &&
      item.statusColor === "green" &&
      item.effectiveSargassumScore <= 20 &&
      item.swimScore >= 76
  );

  if (candidates.length === 0) {
    // Fallback to highest swimScore on the island if no strict green candidate exists
    const fallbackPool = allBeaches
      .filter((item) => item.beach.slug !== current.beach.slug)
      .sort((a, b) => b.swimScore - a.swimScore);
    if (fallbackPool.length === 0) return null;
    candidates.push(fallbackPool[0]);
  }

  let bestCandidate = candidates[0];
  let bestScore = Infinity;

  for (const candidate of candidates) {
    const straightKm = haversineDistanceKm(
      current.beach.lat,
      current.beach.lon,
      candidate.beach.lat,
      candidate.beach.lon
    );
    const roadKm = straightKm * BARBADOS_ROAD_WINDING_FACTOR;
    const driveMins = Math.max(4, Math.round((roadKm / BARBADOS_AVG_DRIVE_KMH) * 60));

    // Weighted rank: prioritize short drive time while rewarding higher swimScore & zero sargassum
    const compositePenalty =
      driveMins * 1.4 - (candidate.swimScore - 75) * 0.45 + candidate.effectiveSargassumScore * 0.5;

    if (compositePenalty < bestScore) {
      bestScore = compositePenalty;
      bestCandidate = candidate;
    }
  }

  const straightLineKm = Number(
    haversineDistanceKm(
      current.beach.lat,
      current.beach.lon,
      bestCandidate.beach.lat,
      bestCandidate.beach.lon
    ).toFixed(1)
  );
  const roadDistanceKm = Number((straightLineKm * BARBADOS_ROAD_WINDING_FACTOR).toFixed(1));
  const estimatedDriveMinutes = Math.max(
    4,
    Math.round((roadDistanceKm / BARBADOS_AVG_DRIVE_KMH) * 60)
  );

  const sargassumLabel =
    bestCandidate.effectiveSargassumScore <= 10
      ? "0% Sargassum"
      : `${bestCandidate.effectiveSargassumScore}% Low Sargassum`;

  const reasonHeadline = `Pivot to ${bestCandidate.beach.name}: ${estimatedDriveMinutes} mins away (est.), ${sargassumLabel}, ${bestCandidate.inshoreChop}`;
  const comparisonSummary = `Save your beach day: while ${current.beach.name} is showing ${current.effectiveSargassumScore}% sargassum risk and ${current.inshoreChop.toLowerCase()} conditions, ${bestCandidate.beach.name} (${bestCandidate.beach.coast} Coast) is sheltered at ${bestCandidate.inshoreWaveM}m inshore with a ${bestCandidate.swimScore}/100 Swim Score.`;

  return {
    fromBeachSlug: current.beach.slug,
    fromBeachName: current.beach.name,
    target: bestCandidate,
    straightLineKm,
    roadDistanceKm,
    estimatedDriveMinutes,
    reasonHeadline,
    comparisonSummary,
  };
}
