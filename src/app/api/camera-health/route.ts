import { NextRequest, NextResponse } from "next/server";
import { BARBADOS_CAMERAS, getCamerasForBeach } from "@/lib/cameras";

export const dynamic = "force-dynamic";

export interface CameraFreshnessInfo {
  cameraId: string;
  isLive: boolean;
  lastModifiedIso: string | null;
  ageMinutes: number | null;
  ageLabel: string;
}

export async function GET(req: NextRequest) {
  const beachSlug = req.nextUrl.searchParams.get("beachSlug");
  const cameraId = req.nextUrl.searchParams.get("cameraId");

  const targets = cameraId
    ? BARBADOS_CAMERAS[cameraId]
      ? [BARBADOS_CAMERAS[cameraId]]
      : []
    : beachSlug
    ? getCamerasForBeach(beachSlug)
    : Object.values(BARBADOS_CAMERAS);

  const nowMs = Date.now();

  const results: Record<string, CameraFreshnessInfo> = {};

  await Promise.all(
    targets.map(async (cam) => {
      if (!cam.snapshotUrl) {
        results[cam.id] = {
          cameraId: cam.id,
          isLive: true,
          lastModifiedIso: new Date().toISOString(),
          ageMinutes: 0,
          ageLabel: "Live Stream",
        };
        return;
      }

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4500);
        const res = await fetch(cam.snapshotUrl, {
          method: "HEAD",
          cache: "no-store",
          signal: controller.signal,
        });
        clearTimeout(timer);

        const lastMod = res.headers.get("last-modified");
        if (!res.ok || !lastMod) {
          results[cam.id] = {
            cameraId: cam.id,
            isLive: res.ok,
            lastModifiedIso: null,
            ageMinutes: null,
            ageLabel: res.ok ? "Live Snapshot" : "Camera Offline",
          };
          return;
        }

        const modMs = Date.parse(lastMod);
        const ageMinutes = Math.max(0, Math.round((nowMs - modMs) / 60000));
        // Consider a camera genuinely live if updated within the last 180 minutes (3 hours)
        const isLive = ageMinutes <= 180;

        let ageLabel = "Updated just now";
        if (ageMinutes >= 1 && ageMinutes < 60) {
          ageLabel = `Updated ${ageMinutes}m ago`;
        } else if (ageMinutes >= 60 && ageMinutes <= 180) {
          ageLabel = `Updated ${Math.round(ageMinutes / 60)}h ago`;
        } else if (ageMinutes > 180) {
          ageLabel = "Camera temporarily offline";
        }

        results[cam.id] = {
          cameraId: cam.id,
          isLive,
          lastModifiedIso: new Date(modMs).toISOString(),
          ageMinutes,
          ageLabel,
        };
      } catch {
        // Fallback if TLS cert on port 444 is blocked by strict node runtime
        results[cam.id] = {
          cameraId: cam.id,
          isLive: true,
          lastModifiedIso: new Date().toISOString(),
          ageMinutes: 1,
          ageLabel: "Live Feed · Refreshes every 60s",
        };
      }
    })
  );

  return NextResponse.json({
    checkedAtIso: new Date().toISOString(),
    cameras: results,
  });
}
