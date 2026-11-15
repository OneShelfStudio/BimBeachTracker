"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, ExternalLink, RefreshCw, X } from "lucide-react";
import { BeachTelemetryBundle } from "@/lib/openMeteo";
import { getCamerasForBeach } from "@/lib/cameras";
import type { CameraFreshnessInfo } from "@/app/api/camera-health/route";

interface CamHUDModalProps {
  bundle: BeachTelemetryBundle | null;
  onClose: () => void;
}

export default function CamHUDModal({ bundle, onClose }: CamHUDModalProps) {
  const [refreshTick, setRefreshTick] = useState(0);
  const [activeCamIndex, setActiveCamIndex] = useState(0);
  const [freshnessMap, setFreshnessMap] = useState<Record<string, CameraFreshnessInfo>>({});

  useEffect(() => {
    if (!bundle) return;
    const timer = setInterval(() => {
      setRefreshTick((t) => t + 1);
    }, 15000);
    return () => clearInterval(timer);
  }, [bundle]);

  useEffect(() => {
    setActiveCamIndex(0);
    if (!bundle) return;

    let cancelled = false;
    fetch(`/api/camera-health?beachSlug=${encodeURIComponent(bundle.beach.slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.cameras) {
          setFreshnessMap(data.cameras);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [bundle, refreshTick]);

  useEffect(() => {
    if (!bundle) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [bundle, onClose]);

  if (!bundle) return null;

  const allCameras = getCamerasForBeach(bundle.beach.slug);
  const cameras = allCameras.filter((cam) => {
    const health = freshnessMap[cam.id];
    return health ? health.isLive : true;
  });

  const activeCamera = cameras[activeCamIndex] || cameras[0] || allCameras[0];
  const activeHealth = activeCamera ? freshnessMap[activeCamera.id] : undefined;

  const snapshotSrc = activeCamera?.snapshotUrl
    ? `${activeCamera.snapshotUrl}?t=${Math.floor(Date.now() / 30000)}-${refreshTick}`
    : null;

  const friendlySeaweed =
    bundle.effectiveSargassumScore <= 15
      ? "Clear of seaweed today"
      : bundle.effectiveSargassumScore <= 38
      ? "Light seaweed along the sand"
      : "Noticeable seaweed today";

  const friendlyWater =
    bundle.inshoreWaveM <= 0.25
      ? "Calm like a swimming pool"
      : bundle.inshoreWaveM <= 0.5
      ? "Gentle nearshore waves"
      : "Active surf and chop";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cam-modal-title"
    >
      <div className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-sm border border-white/15 bg-[#050c14] shadow-2xl">
        {/* Top Editorial Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#08121e] px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
              Live Beach Camera · {bundle.beach.parish} ({bundle.beach.coast} Coast)
            </p>
            <h2
              id="cam-modal-title"
              className="mt-0.5 font-serif text-xl sm:text-2xl font-bold text-white"
            >
              {bundle.beach.name}
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setRefreshTick((t) => t + 1)}
              className="inline-flex items-center gap-1.5 rounded-sm border border-white/20 bg-white/5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Refresh Frame</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close live camera"
              className="rounded-sm border border-white/20 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Multi-Camera Angle Switcher */}
        {cameras.length > 1 && (
          <div className="flex flex-wrap items-center gap-4 border-b border-white/10 bg-[#060e18] px-5 py-3">
            <span className="text-xs uppercase tracking-wider text-slate-400">
              Camera Angles ({cameras.length}):
            </span>
            {cameras.map((cam, idx) => (
              <button
                key={cam.id}
                type="button"
                onClick={() => setActiveCamIndex(idx)}
                className={`inline-flex items-center gap-1.5 pb-1 text-xs font-medium transition-colors border-b-2 ${
                  idx === activeCamIndex
                    ? "border-amber-300 text-white"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Camera className="h-3.5 w-3.5 text-amber-300" />
                <span>{cam.viewAngleLabel || cam.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Camera Viewport */}
        <div className="relative aspect-video w-full bg-black overflow-hidden">
          {snapshotSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={snapshotSrc}
              alt={`Live beach camera view of ${bundle.beach.name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-slate-400">
              <p className="text-sm font-semibold text-white">
                Camera Feed Currently Offline
              </p>
              <p className="mt-1 text-xs text-slate-400">
                We hide out-of-date camera snapshots so you only see current views.
              </p>
            </div>
          )}

          {/* Bottom Editorial Caption Over Photo */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-amber-300">
                {activeHealth?.ageLabel || "Live Feed · Updates every 60 seconds"}
              </p>
              <p className="font-serif text-lg sm:text-xl font-bold text-white">
                {activeCamera?.name || bundle.beach.name}
              </p>
            </div>

            <div className="text-right text-xs text-slate-200 space-y-0.5">
              <p>
                <span className="text-slate-400">Water right now:</span>{" "}
                <strong className="text-white">{friendlyWater}</strong>
              </p>
              <p>
                <span className="text-slate-400">Shoreline:</span>{" "}
                <strong className="text-emerald-300">{friendlySeaweed}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Info & Directions */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#08121e] px-5 py-3.5 text-xs text-slate-300">
          <span>
            Live coastal feed via {activeCamera?.provider || "IWCP Barbados"} · Auto-refreshes every 15s
          </span>
          <div className="flex items-center gap-4">
            <Link
              href={`/beach/${bundle.beach.slug}`}
              className="inline-flex items-center gap-1 font-semibold text-amber-300 hover:text-amber-200 underline underline-offset-4"
            >
              <span>Full {bundle.beach.name} Guide</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${bundle.beach.lat},${bundle.beach.lon}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-sm bg-amber-300 px-4 py-2 font-bold uppercase tracking-wider text-slate-950 transition hover:bg-amber-200"
            >
              <span>Google Maps Directions</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
