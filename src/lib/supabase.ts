import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AIVisionGrade, InshoreChopLevel } from "./scoring";

export interface VerifiedCheckInRecord {
  id: string;
  beachSlug: string;
  beachName: string;
  reporterHandle: string;
  sargassumLevel: "None (0%)" | "Light Trace" | "Moderate Wrack" | "Heavy Blanket";
  waterChop: InshoreChopLevel;
  photoDataUrl: string;
  lat: number;
  lon: number;
  gpsDistanceMeters: number;
  gpsVerified: boolean;
  sha256Digest: string;
  astTimestampLabel: string;
  createdAtIso: string;
  notes?: string;
}

let browserSupabase: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || url.includes("your-project-id")) return null;
  if (!browserSupabase) {
    browserSupabase = createClient(url, anonKey);
  }
  return browserSupabase;
}

export function getServiceSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !serviceKey || url.includes("your-project-id")) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

/**
 * In-memory runtime store for recent grades, pushed snapshots, and check-ins
 * when running without external Supabase credentials or as hot edge cache.
 */
const globalStore = globalThis as unknown as {
  __bimAiGrades?: Record<string, AIVisionGrade>;
  __bimSnapshots?: Record<string, { base64Jpeg: string; mimeType: string; capturedAtIso: string }>;
  __bimCheckIns?: VerifiedCheckInRecord[];
};

if (!globalStore.__bimAiGrades) {
  globalStore.__bimAiGrades = {};
}

if (!globalStore.__bimSnapshots) {
  globalStore.__bimSnapshots = {};
}

if (!globalStore.__bimCheckIns) {
  globalStore.__bimCheckIns = [];
}

export function getStoredAiGrades(): Record<string, AIVisionGrade> {
  return globalStore.__bimAiGrades!;
}

export function upsertStoredAiGrade(grade: AIVisionGrade): void {
  globalStore.__bimAiGrades![grade.beachSlug] = grade;
}

export function getStoredSnapshot(beachSlug: string) {
  return globalStore.__bimSnapshots![beachSlug];
}

export function upsertStoredSnapshot(
  beachSlug: string,
  base64Jpeg: string,
  mimeType: string = "image/jpeg"
) {
  globalStore.__bimSnapshots![beachSlug] = {
    base64Jpeg,
    mimeType,
    capturedAtIso: new Date().toISOString(),
  };
}

export function getStoredCheckIns(beachSlug?: string): VerifiedCheckInRecord[] {
  const all = globalStore.__bimCheckIns!;
  if (!beachSlug) return all;
  return all.filter((c) => c.beachSlug === beachSlug);
}

export function prependStoredCheckIn(record: VerifiedCheckInRecord): void {
  globalStore.__bimCheckIns = [record, ...globalStore.__bimCheckIns!].slice(0, 60);
}
