import { BARBADOS_BEACHES, BeachDefinition, CoastSector } from "./beaches";
import { BARBADOS_CAMERAS, getCamerasForBeach, setStaleCameraIds } from "./cameras";
import { findBestPivotBeach, SafePivotRecommendation } from "./pivot";
import {
  AIVisionGrade,
  ComputedBeachTelemetry,
  RawMarineTelemetry,
  scoreBeachConditions,
} from "./scoring";
import { getServiceSupabase, getStoredAiGrades } from "./supabase";

export interface TideEventEntry {
  state: "High" | "Low";
  time: string;
  heightM: string;
  heightFt: string;
}

export interface BarbadosTideSchedule {
  dateLabel: string;
  events: TideEventEntry[];
  nextTideSummary: string;
  sunrise: string;
  sunset: string;
  sourceUrl: string;
}

export interface BeachTelemetryBundle extends ComputedBeachTelemetry {
  pivotRecommendation: SafePivotRecommendation | null;
}

export interface HourlyForecastPoint {
  timeIso: string;
  hourLabel: string;
  waveHeightM: number;
  swellPeriodSec: number;
  swellDirectionDeg: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
}

export interface IslandConditionsPayload {
  generatedAtIso: string;
  astDisplayTime: string;
  source: "open-meteo-live" | "open-meteo-fallback";
  tideSchedule: BarbadosTideSchedule;
  /** Camera ids whose snapshots have stopped updating (hidden everywhere in the UI) */
  staleCameraIds: string[];
  /** Minutes since each camera snapshot last updated (null when unknown) */
  cameraAgeMinutes: Record<string, number | null>;
  /** 24-hour hourly offshore marine and wind envelope for Barbados */
  hourlyForecast: HourlyForecastPoint[];
  /** Coast-specific 24-hour hourly offshore marine and wind envelopes */
  hourlyForecastByCoast?: Record<CoastSector, HourlyForecastPoint[]>;
  islandSummary: {
    totalBeaches: number;
    greenCount: number;
    amberCount: number;
    redCount: number;
    cameraBeachesCount: number;
    totalLiveCameras: number;
    bestSwimBeach: {
      slug: string;
      name: string;
      swimScore: number;
      inshoreChop: string;
    };
    dominantSwellLabel: string;
    dominantWindLabel: string;
  };
  beaches: BeachTelemetryBundle[];
}

export type IslandTelemetryPayload = IslandConditionsPayload;

/**
 * Parses a time string like "12:18pm" or "5:21am" into minutes since midnight (0-1439)
 */
function parseTimeToMinutes(timeStr: string): number {
  const m = timeStr.trim().toLowerCase().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
  if (!m) return -1;
  let hour = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const period = m[3];
  if (period === "pm" && hour < 12) hour += 12;
  if (period === "am" && hour === 12) hour = 0;
  return hour * 60 + min;
}

function extractTideEventsFromHtml(htmlFragment: string): TideEventEntry[] {
  const rowRegex =
    /<td class="tidal-state">\s*(High|Low)\s*<\/td>\s*<td class="tidal-time">\s*([^<]+?)\s*<\/td>\s*<td class="tidal-height[^"]*">\s*<span class="m">([^<]+)<\/span>\s*<span class="ft">([^<]+)<\/span>/gi;
  const events: TideEventEntry[] = [];
  let match: RegExpExecArray | null;
  while ((match = rowRegex.exec(htmlFragment)) !== null) {
    events.push({
      state: match[1] === "Low" ? "Low" : "High",
      time: match[2].trim(),
      heightM: match[3].trim(),
      heightFt: match[4].trim(),
    });
  }
  return events;
}

/**
 * Fetches today's (and tomorrow's overflow) High and Low Tide schedule for Barbados directly from TideTime.org
 */
async function fetchBarbadosTideSchedule(forceFresh = false): Promise<BarbadosTideSchedule> {
  const sourceUrl = "https://www.tidetime.org/central-america/barbados/bathsheba.htm";

  // Get current Barbados (AST) time in minutes since midnight
  const nowAstParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Barbados",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const currHour = parseInt(nowAstParts.find((p) => p.type === "hour")?.value || "10", 10);
  const currMin = parseInt(nowAstParts.find((p) => p.type === "minute")?.value || "0", 10);
  const currTotalMinutes = (currHour % 24) * 60 + currMin;

  const computeNextSummary = (todayEvents: TideEventEntry[], tomorrowEvents: TideEventEntry[] = []) => {
    for (const ev of todayEvents) {
      const evMins = parseTimeToMinutes(ev.time);
      if (evMins >= currTotalMinutes) {
        return `Next ${ev.state} Tide at ${ev.time} (${ev.heightM} / ${ev.heightFt})`;
      }
    }
    const tmrwFirst = tomorrowEvents[0];
    if (tmrwFirst) {
      return `Next ${tmrwFirst.state} Tide tomorrow at ${tmrwFirst.time} (${tmrwFirst.heightM} / ${tmrwFirst.heightFt})`;
    }
    const first = todayEvents[0];
    return first
      ? `Next ${first.state} Tide at ${first.time} (${first.heightM} / ${first.heightFt})`
      : "Tide table updated daily";
  };

  try {
    const fetchOpts: RequestInit & { next?: { revalidate: number } } = forceFresh
      ? { cache: "no-store" }
      : { next: { revalidate: 300 } };

    const res = await fetch(sourceUrl, {
      ...fetchOpts,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BimBeachTracker/1.0)",
      },
    });
    if (!res.ok) throw new Error(`TideTime HTTP ${res.status}`);
    const html = await res.text();

    const blocks: string[] = [];
    const blockRegex = /<div class="tide-today-wrapper">([\s\S]*?)<\/table>/gi;
    let blockMatch: RegExpExecArray | null;
    while ((blockMatch = blockRegex.exec(html)) !== null) {
      blocks.push(blockMatch[1]);
    }
    const todayHtml = blocks[0] || html;
    const tomorrowHtml = blocks[1] || "";

    const dateMatch = todayHtml.match(/<h3>([^<]+)<\/h3>/);
    const dateLabel = dateMatch ? dateMatch[1].trim() : "Today";

    const todayEvents = extractTideEventsFromHtml(todayHtml);
    const tomorrowEvents = tomorrowHtml ? extractTideEventsFromHtml(tomorrowHtml) : [];

    // Pad mixed-diurnal days (<4 events today) with tomorrow's first tide(s) so all 4 tide slots stay informative
    const displayEvents: TideEventEntry[] = [...todayEvents];
    for (const ev of tomorrowEvents) {
      if (displayEvents.length >= 4) break;
      displayEvents.push({
        ...ev,
        time: `${ev.time} (Tmrw)`,
      });
    }

    const sunriseMatch = html.match(/Sunrise:\s*([0-9:apm\s]+)<\/p>/i);
    const sunsetMatch = html.match(/Sunset:\s*([0-9:apm\s]+)<\/p>/i);

    if (todayEvents.length >= 1) {
      return {
        dateLabel,
        events: displayEvents,
        nextTideSummary: computeNextSummary(todayEvents, tomorrowEvents),
        sunrise: sunriseMatch ? sunriseMatch[1].trim() : "5:49am",
        sunset: sunsetMatch ? sunsetMatch[1].trim() : "5:36pm",
        sourceUrl,
      };
    }
  } catch {
    // Fallback to verified Barbados tide table if offline
  }

  const fallbackEvents: TideEventEntry[] = [
    { state: "High", time: "1:42am", heightM: "0.38m", heightFt: "1.2ft" },
    { state: "Low", time: "5:21am", heightM: "0.35m", heightFt: "1.1ft" },
    { state: "High", time: "12:18pm", heightM: "0.72m", heightFt: "2.4ft" },
    { state: "Low", time: "8:15pm", heightM: "0.08m", heightFt: "0.3ft" },
  ];

  return {
    dateLabel: "Today",
    events: fallbackEvents,
    nextTideSummary: computeNextSummary(fallbackEvents, []),
    sunrise: "5:49am",
    sunset: "5:36pm",
    sourceUrl,
  };
}

/**
 * Fetches live wave height, wind wave height, swell, ocean current, SST, air temp, wind & UV
 * from Open-Meteo Marine & Forecast APIs for all 46 Barbados beaches.
 */
async function fetchRawMarineForBeaches(
  beaches: BeachDefinition[],
  forceFresh = false
): Promise<{ map: Record<string, RawMarineTelemetry>; isLive: boolean }> {
  const lats = beaches.map((b) => b.lat.toFixed(4)).join(",");
  const lons = beaches.map((b) => b.lon.toFixed(4)).join(",");
  const nowIso = new Date().toISOString();
  const fetchOpts: RequestInit & { next?: { revalidate: number } } = forceFresh
    ? { cache: "no-store" }
    : { next: { revalidate: 120 } };

  try {
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lats}&longitude=${lons}&current=wave_height,wind_wave_height,swell_wave_height,swell_wave_direction,swell_wave_period,ocean_current_velocity,sea_surface_temperature&cell_selection=sea&timezone=America%2FBarbados`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index&timezone=America%2FBarbados`;

    const [marineRes, weatherRes] = await Promise.all([
      fetch(marineUrl, fetchOpts),
      fetch(weatherUrl, fetchOpts),
    ]);

    if (!marineRes.ok || !weatherRes.ok) {
      throw new Error(`Open-Meteo HTTP status ${marineRes.status}/${weatherRes.status}`);
    }

    const marineJson = await marineRes.json();
    const weatherJson = await weatherRes.json();

    const marineList = Array.isArray(marineJson) ? marineJson : [marineJson];
    const weatherList = Array.isArray(weatherJson) ? weatherJson : [weatherJson];

    const result: Record<string, RawMarineTelemetry> = {};

    beaches.forEach((beach, idx) => {
      const mCurr = marineList[idx]?.current || marineList[0]?.current || {};
      const wCurr = weatherList[idx]?.current || weatherList[0]?.current || {};
      const rawTime = typeof mCurr.time === "string" ? mCurr.time : null;
      const isoTime = rawTime
        ? new Date(
            rawTime.includes("Z") || /[+-]\d{2}:\d{2}$/.test(rawTime)
              ? rawTime
              : `${rawTime}-04:00`
          ).toISOString()
        : nowIso;

      result[beach.slug] = {
        waveHeightM: Number(mCurr.wave_height ?? 1.35),
        windWaveHeightM:
          mCurr.wind_wave_height !== undefined && mCurr.wind_wave_height !== null
            ? Number(mCurr.wind_wave_height)
            : undefined,
        swellHeightM: Number(mCurr.swell_wave_height ?? 1.25),
        swellDirectionDeg: Number(mCurr.swell_wave_direction ?? 112),
        swellPeriodSec: Number(mCurr.swell_wave_period ?? 9.2),
        windSpeedKmh: Number(wCurr.wind_speed_10m ?? 24),
        windDirectionDeg: Number(wCurr.wind_direction_10m ?? 108),
        windGustsKmh:
          wCurr.wind_gusts_10m !== undefined && wCurr.wind_gusts_10m !== null
            ? Number(wCurr.wind_gusts_10m)
            : undefined,
        waterTempC: Number(mCurr.sea_surface_temperature ?? 28.4),
        airTempC:
          wCurr.temperature_2m !== undefined && wCurr.temperature_2m !== null
            ? Number(wCurr.temperature_2m)
            : undefined,
        uvIndex:
          wCurr.uv_index !== undefined && wCurr.uv_index !== null
            ? Number(wCurr.uv_index)
            : undefined,
        oceanCurrentKmh:
          mCurr.ocean_current_velocity !== undefined && mCurr.ocean_current_velocity !== null
            ? Number(mCurr.ocean_current_velocity)
            : undefined,
        timestampIso: isoTime,
      };
    });

    return { map: result, isLive: true };
  } catch {
    const fallbackMap: Record<string, RawMarineTelemetry> = {};
    beaches.forEach((beach) => {
      const isEast = beach.coast === "East/Southeast" || beach.coast === "North";
      fallbackMap[beach.slug] = {
        waveHeightM: isEast ? 1.85 : 1.35,
        swellHeightM: isEast ? 1.7 : 1.25,
        swellDirectionDeg: 114,
        swellPeriodSec: 9.4,
        windSpeedKmh: 25,
        windDirectionDeg: 108,
        waterTempC: 28.3,
        timestampIso: nowIso,
      };
    });
    return { map: fallbackMap, isLive: false };
  }
}

async function loadAiGradesMap(): Promise<Record<string, AIVisionGrade>> {
  const memoryGrades = { ...getStoredAiGrades() };
  const supabase = getServiceSupabase();
  if (!supabase) return memoryGrades;

  try {
    const { data } = await supabase.from("beach_ai_grades").select("*");
    if (data && Array.isArray(data)) {
      for (const row of data) {
        memoryGrades[row.beach_slug] = {
          beachSlug: row.beach_slug,
          sargassumScore: row.sargassum_score,
          waterClarity: row.water_clarity,
          tractorPresent: row.tractor_present,
          summary: row.summary,
          gradedAtIso: row.graded_at,
          cameraId: row.camera_id,
          source: row.source,
        };
      }
    }
  } catch {
    // Fallback to in-memory store
  }
  return memoryGrades;
}

/**
 * Checks every camera snapshot's Last-Modified header and returns ids of feeds that
 * have not updated in over 3 hours. Unreachable/unknown cameras are treated as live
 * so a slow check never hides a working camera. Cached for 3 minutes per server instance.
 */
const STALE_CAMERA_MINUTES = 180;
let staleCache: {
  at: number;
  ids: string[];
  ages: Record<string, number | null>;
} | null = null;

async function detectStaleCameras(forceFresh = false): Promise<{
  ids: string[];
  ages: Record<string, number | null>;
}> {
  if (!forceFresh && staleCache && Date.now() - staleCache.at < 3 * 60 * 1000) {
    return { ids: staleCache.ids, ages: staleCache.ages };
  }

  const ages: Record<string, number | null> = {};
  const results = await Promise.all(
    Object.values(BARBADOS_CAMERAS).map(async (cam) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      try {
        const res = await fetch(cam.snapshotUrl, {
          method: "HEAD",
          cache: "no-store",
          signal: controller.signal,
        });
        const lastMod = res.headers.get("last-modified");
        if (!res.ok) return res.status >= 400 && res.status < 500 ? cam.id : null;
        if (!lastMod) {
          ages[cam.id] = null;
          return null;
        }
        const ageMin = Math.max(0, Math.round((Date.now() - Date.parse(lastMod)) / 60000));
        ages[cam.id] = ageMin;
        return ageMin > STALE_CAMERA_MINUTES ? cam.id : null;
      } catch {
        ages[cam.id] = null;
        return null;
      } finally {
        clearTimeout(timer);
      }
    })
  );

  const ids = results.filter((id): id is string => Boolean(id));
  staleCache = { at: Date.now(), ids, ages };
  return { ids, ages };
}

function getFallbackHourlyForecast(): HourlyForecastPoint[] {
  const points: HourlyForecastPoint[] = [];
  const hours = [6, 9, 12, 15, 18, 21];
  for (const h of hours) {
    const period = h >= 12 ? "pm" : "am";
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    points.push({
      timeIso: new Date().toISOString(),
      hourLabel: `${displayHour}${period}`,
      waveHeightM: 1.15,
      swellPeriodSec: 8.8,
      swellDirectionDeg: 110,
      windSpeedKmh: 22,
      windDirectionDeg: 100,
    });
  }
  return points;
}

const COAST_HOURLY_COORDS: { coast: CoastSector; lat: number; lon: number }[] = [
  { coast: "South", lat: 13.045, lon: -59.565 },
  { coast: "West", lat: 13.175, lon: -59.655 },
  { coast: "East/Southeast", lat: 13.185, lon: -59.435 },
  { coast: "North", lat: 13.345, lon: -59.615 },
];

function parseHourlySeries(mHourly: any, wHourly: any, currentHourIso: string): HourlyForecastPoint[] {
  if (!mHourly?.time || !wHourly?.time) return getFallbackHourlyForecast();

  let startIdx = mHourly.time.findIndex((t: string) => t >= currentHourIso);
  if (startIdx < 0) startIdx = 0;

  const points: HourlyForecastPoint[] = [];
  const endIdx = Math.min(mHourly.time.length, startIdx + 24);

  for (let i = startIdx; i < endIdx; i++) {
    const timeStr = mHourly.time[i];
    const match = timeStr.match(/T(\d{2}):/);
    const hours = match ? parseInt(match[1], 10) : 12;
    const period = hours >= 12 ? "pm" : "am";
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    const hourLabel = `${displayHour}${period}`;

    points.push({
      timeIso: timeStr,
      hourLabel,
      waveHeightM: Number(mHourly.wave_height?.[i] ?? 1.1),
      swellPeriodSec: Number(mHourly.swell_wave_period?.[i] ?? 8.5),
      swellDirectionDeg: Number(mHourly.swell_wave_direction?.[i] ?? 105),
      windSpeedKmh: Number(wHourly.wind_speed_10m?.[i] ?? 20),
      windDirectionDeg: Number(wHourly.wind_direction_10m?.[i] ?? 95),
    });
  }

  return points.length > 0 ? points : getFallbackHourlyForecast();
}

async function fetchHourlyCoastForecasts(forceFresh = false): Promise<{
  defaultForecast: HourlyForecastPoint[];
  byCoast: Record<CoastSector, HourlyForecastPoint[]>;
}> {
  const fallback = getFallbackHourlyForecast();
  const fallbackByCoast: Record<CoastSector, HourlyForecastPoint[]> = {
    South: fallback,
    West: fallback,
    "East/Southeast": fallback,
    North: fallback,
  };

  try {
    const lats = COAST_HOURLY_COORDS.map((c) => c.lat.toFixed(3)).join(",");
    const lons = COAST_HOURLY_COORDS.map((c) => c.lon.toFixed(3)).join(",");
    const fetchOpts: RequestInit & { next?: { revalidate: number } } = forceFresh
      ? { cache: "no-store" }
      : { next: { revalidate: 120 } };

    const [mRes, wRes] = await Promise.all([
      fetch(
        `https://marine-api.open-meteo.com/v1/marine?latitude=${lats}&longitude=${lons}&hourly=wave_height,swell_wave_height,swell_wave_direction,swell_wave_period&cell_selection=sea&forecast_days=2&timezone=America%2FBarbados`,
        fetchOpts
      ),
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&hourly=wind_speed_10m,wind_direction_10m&forecast_days=2&timezone=America%2FBarbados`,
        fetchOpts
      ),
    ]);

    if (!mRes.ok || !wRes.ok) {
      return { defaultForecast: fallback, byCoast: fallbackByCoast };
    }

    const mJson = await mRes.json();
    const wJson = await wRes.json();
    const mList = Array.isArray(mJson) ? mJson : [mJson];
    const wList = Array.isArray(wJson) ? wJson : [wJson];

    const bbNowStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Barbados",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date());
    const currentHourIso = bbNowStr.replace(/,\s*/, "T").slice(0, 13);

    const byCoast = { ...fallbackByCoast };
    COAST_HOURLY_COORDS.forEach((coord, idx) => {
      const mHourly = mList[idx]?.hourly || mList[0]?.hourly;
      const wHourly = wList[idx]?.hourly || wList[0]?.hourly;
      byCoast[coord.coast] = parseHourlySeries(mHourly, wHourly, currentHourIso);
    });

    return {
      defaultForecast: byCoast.South,
      byCoast,
    };
  } catch {
    return { defaultForecast: fallback, byCoast: fallbackByCoast };
  }
}

export async function getIslandConditionsPayload(options?: {
  forceFresh?: boolean;
}): Promise<IslandConditionsPayload> {
  const forceFresh = Boolean(options?.forceFresh);
  const [{ map: marineMap, isLive }, aiGradesMap, tideSchedule, cameraCheck, hourlyData] =
    await Promise.all([
      fetchRawMarineForBeaches(BARBADOS_BEACHES, forceFresh),
      loadAiGradesMap(),
      fetchBarbadosTideSchedule(forceFresh),
      detectStaleCameras(forceFresh),
      fetchHourlyCoastForecasts(forceFresh),
    ]);
  const staleCameraIds = cameraCheck.ids;
  const cameraAgeMinutes = cameraCheck.ages;
  const hourlyForecast = hourlyData.defaultForecast;
  const hourlyForecastByCoast = hourlyData.byCoast;

  // Apply stale-camera filtering immediately so getCamerasForBeach() hides dead feeds everywhere
  setStaleCameraIds(staleCameraIds);
  const liveBeaches: BeachDefinition[] = BARBADOS_BEACHES.map((beach) => {
    const liveCams = getCamerasForBeach(beach.slug);
    return {
      ...beach,
      cameraIds: liveCams.map((c) => c.id),
      hasLiveCam: liveCams.length > 0,
    };
  });

  const computedList: ComputedBeachTelemetry[] = liveBeaches.map((beach) => {
    const marine = marineMap[beach.slug];
    const aiGrade = aiGradesMap[beach.slug];
    return scoreBeachConditions(beach, marine, aiGrade);
  });

  const bundled: BeachTelemetryBundle[] = computedList.map((telemetry) => ({
    ...telemetry,
    pivotRecommendation: findBestPivotBeach(telemetry, computedList),
  }));

  const sortedBySwim = [...bundled].sort((a, b) => b.swimScore - a.swimScore);
  const topSwim = sortedBySwim[0];
  const sample = bundled[0];

  const astFormatter = new Intl.DateTimeFormat("en-BB", {
    timeZone: "America/Barbados",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return {
    generatedAtIso: new Date().toISOString(),
    astDisplayTime: `${astFormatter.format(new Date())} AST`,
    source: isLive ? "open-meteo-live" : "open-meteo-fallback",
    tideSchedule,
    staleCameraIds,
    cameraAgeMinutes,
    hourlyForecast,
    hourlyForecastByCoast,
    islandSummary: {
      totalBeaches: bundled.length,
      greenCount: bundled.filter((b) => b.statusColor === "green").length,
      amberCount: bundled.filter((b) => b.statusColor === "amber").length,
      redCount: bundled.filter((b) => b.statusColor === "red").length,
      cameraBeachesCount: bundled.filter((b) => b.beach.hasLiveCam).length,
      totalLiveCameras: Object.keys(BARBADOS_CAMERAS).length - staleCameraIds.length,
      bestSwimBeach: {
        slug: topSwim.beach.slug,
        name: topSwim.beach.name,
        swimScore: topSwim.swimScore,
        inshoreChop: topSwim.inshoreChop,
      },
      dominantSwellLabel: `${sample.marine.swellHeightM.toFixed(1)}m @ ${Math.round(
        sample.marine.swellPeriodSec
      )}s ${sample.compassSwellLabel} (${Math.round(sample.marine.swellDirectionDeg)}°)`,
      dominantWindLabel: `${Math.round(sample.marine.windSpeedKmh)} km/h ${
        sample.compassWindLabel
      } (${Math.round(sample.marine.windDirectionDeg)}°)`,
    },
    beaches: bundled,
  };
}
