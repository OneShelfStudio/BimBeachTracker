import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBeachBySlug } from "@/lib/beaches";
import { haversineDistanceKm } from "@/lib/pivot";
import {
  getServiceSupabase,
  getStoredCheckIns,
  prependStoredCheckIn,
  upsertStoredAiGrade,
  VerifiedCheckInRecord,
} from "@/lib/supabase";

export const dynamic = "force-dynamic";

const CreateCheckInSchema = z.object({
  beachSlug: z.string(),
  reporterHandle: z.string().min(1).max(40).optional().default("Beachgoer"),
  sargassumLevel: z.enum(["None (0%)", "Light Trace", "Moderate Wrack", "Heavy Blanket"]),
  waterChop: z.enum(["Glassy", "Light Ripple", "Moderate Chop", "Rough / Heavy"]),
  photoDataUrl: z.string().optional().default(""),
  lat: z.number().min(-90).max(90).optional(),
  lon: z.number().min(-180).max(180).optional(),
  sha256Digest: z.string().optional().default("community-report"),
  astTimestampLabel: z.string().optional(),
  notes: z.string().max(280).optional(),
});

export async function GET(req: NextRequest) {
  const beachSlug = req.nextUrl.searchParams.get("beachSlug") || undefined;
  const checkIns = getStoredCheckIns(beachSlug);
  return NextResponse.json({ checkIns });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateCheckInSchema.parse(body);

    const beach = getBeachBySlug(parsed.beachSlug);
    if (!beach) {
      return NextResponse.json({ error: "Invalid beachSlug" }, { status: 400 });
    }

    const repLat = parsed.lat ?? beach.lat;
    const repLon = parsed.lon ?? beach.lon;
    const distKm = haversineDistanceKm(beach.lat, beach.lon, repLat, repLon);
    const gpsDistanceMeters = Math.round(distKm * 1000);
    const gpsVerified = distKm <= 2.5;

    const astTime =
      parsed.astTimestampLabel ||
      `${new Intl.DateTimeFormat("en-BB", {
        timeZone: "America/Barbados",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date())} AST`;

    const cleanHandle = parsed.reporterHandle.trim() || "Beachgoer";

    const record: VerifiedCheckInRecord = {
      id: `chk-${Date.now().toString(36)}`,
      beachSlug: beach.slug,
      beachName: beach.name,
      reporterHandle: cleanHandle.startsWith("@") ? cleanHandle : cleanHandle,
      sargassumLevel: parsed.sargassumLevel,
      waterChop: parsed.waterChop,
      photoDataUrl: parsed.photoDataUrl || beach.coverPhoto,
      lat: repLat,
      lon: repLon,
      gpsDistanceMeters,
      gpsVerified,
      sha256Digest: parsed.sha256Digest,
      astTimestampLabel: astTime,
      createdAtIso: new Date().toISOString(),
      notes: parsed.notes,
    };

    prependStoredCheckIn(record);

    // Also update live beach grade from this recent on-the-sand report
    const sargScoreMap: Record<VerifiedCheckInRecord["sargassumLevel"], number> = {
      "None (0%)": 0,
      "Light Trace": 18,
      "Moderate Wrack": 42,
      "Heavy Blanket": 75,
    };
    upsertStoredAiGrade({
      beachSlug: beach.slug,
      sargassumScore: sargScoreMap[record.sargassumLevel],
      waterClarity:
        record.sargassumLevel === "Heavy Blanket"
          ? "Brown Tide"
          : record.waterChop === "Rough / Heavy" || record.waterChop === "Moderate Chop"
          ? "Choppy"
          : "Turquoise",
      tractorPresent: false,
      summary:
        record.notes ||
        `Community report at ${astTime}: ${record.waterChop} water, ${record.sargassumLevel} seaweed.`,
      gradedAtIso: record.createdAtIso,
      source: "heuristic-fallback",
    });

    const supabase = getServiceSupabase();
    if (supabase) {
      try {
        await supabase.from("crowd_checkins").insert({
          beach_slug: record.beachSlug,
          beach_name: record.beachName,
          reporter_handle: record.reporterHandle,
          sargassum_level: record.sargassumLevel,
          water_chop: record.waterChop,
          photo_url: record.photoDataUrl,
          lat: record.lat,
          lon: record.lon,
          gps_distance_meters: record.gpsDistanceMeters,
          gps_verified: record.gpsVerified,
          sha256_digest: record.sha256Digest,
          ast_timestamp_label: record.astTimestampLabel,
          notes: record.notes,
        });
      } catch {
        // Non-blocking if Supabase table is not yet migrated
      }
    }

    return NextResponse.json({
      ok: true,
      checkIn: record,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Invalid check-in submission",
        details: error instanceof Error ? error.message : "Validation error",
      },
      { status: 400 }
    );
  }
}
