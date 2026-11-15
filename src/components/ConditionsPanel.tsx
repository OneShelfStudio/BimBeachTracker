"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  Clock,
  Compass,
  ExternalLink,
  MessageCircle,
  MessageSquarePlus,
  Navigation,
  Share2,
  Video,
  Wind,
} from "lucide-react";
import {
  BarbadosTideSchedule,
  BeachTelemetryBundle,
  HourlyForecastPoint,
} from "@/lib/openMeteo";
import { getCamerasForBeach, getNearestCameraNeighbor } from "@/lib/cameras";
import { getPartnerForBeach } from "@/lib/sponsors";
import {
  analyzeWindSurfaceEffect,
  plainStatusLabel,
  predictInshoreWave,
  statusToneClass,
} from "@/lib/scoring";
import type { VerifiedCheckInRecord } from "@/lib/supabase";
import PivotCard from "./PivotCard";
import type { CameraFreshnessInfo } from "@/app/api/camera-health/route";

interface ConditionsPanelProps {
  bundle: BeachTelemetryBundle;
  tideSchedule: BarbadosTideSchedule;
  hourlyForecast?: HourlyForecastPoint[];
  onSelectBeachSlug: (slug: string) => void;
  onOpenLiveCam: (slug: string) => void;
  onOpenSponsorModal: (slug: string) => void;
  onReportSubmitted?: () => void;
}

export default function ConditionsPanel({
  bundle,
  tideSchedule,
  hourlyForecast,
  onSelectBeachSlug,
  onOpenLiveCam,
  onOpenSponsorModal,
  onReportSubmitted,
}: ConditionsPanelProps) {
  const { beach, marine } = bundle;
  const allCameras = getCamerasForBeach(beach.slug);
  const [freshnessMap, setFreshnessMap] = useState<Record<string, CameraFreshnessInfo>>({});
  const [openSection, setOpenSection] = useState<
    "tides" | "details" | "food" | "report" | null
  >("tides");
  const [copiedShare, setCopiedShare] = useState(false);

  // Simple 2-tap community report state
  const [recentReports, setRecentReports] = useState<VerifiedCheckInRecord[]>([]);
  const [reportWater, setReportWater] = useState<
    "Glassy" | "Light Ripple" | "Moderate Chop" | "Rough / Heavy"
  >("Glassy");
  const [reportSeaweed, setReportSeaweed] = useState<
    "None (0%)" | "Light Trace" | "Moderate Wrack" | "Heavy Blanket"
  >("None (0%)");
  const [reportName, setReportName] = useState("");
  const [reportNote, setReportNote] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    setReportSuccess(false);
    let cancelled = false;

    if (allCameras.length > 0) {
      fetch(`/api/camera-health?beachSlug=${encodeURIComponent(beach.slug)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!cancelled && data?.cameras) {
            setFreshnessMap(data.cameras);
          }
        })
        .catch(() => {});
    }

    fetch(`/api/checkins?beachSlug=${encodeURIComponent(beach.slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.checkIns)) {
          setRecentReports(data.checkIns.slice(0, 3));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [beach.slug, allCameras.length]);

  const liveCameras = allCameras.filter((cam) => {
    const h = freshnessMap[cam.id];
    return h ? h.isLive : true;
  });
  const primaryCam = liveCameras[0] || allCameras[0];
  const primaryHealth = primaryCam ? freshnessMap[primaryCam.id] : undefined;
  const nearestCam = !beach.hasLiveCam ? getNearestCameraNeighbor(beach.slug) : null;

  const partner = getPartnerForBeach(beach.slug, beach.name);

  const heroImageSrc =
    beach.hasLiveCam && primaryCam?.snapshotUrl
      ? `${primaryCam.snapshotUrl}?t=${Math.floor(Date.now() / 60000)}`
      : beach.coverPhoto;

  const waterSummary =
    bundle.inshoreWaveM <= 0.25
      ? "Calm and flat like a swimming pool."
      : bundle.inshoreWaveM <= 0.5
      ? "Gentle nearshore ripples with easy swimming."
      : "Lively waves and breeze today (better for surfing or boogie boarding).";

  const seaweedSummary =
    bundle.effectiveSargassumScore <= 18
      ? "Clear of seaweed today."
      : bundle.effectiveSargassumScore <= 38
      ? "Light seaweed possible along the tideline; swimming water is clear."
      : "Trade winds may push seaweed ashore here today; check live cam or try a West Coast bay.";

  const toggleSection = (sec: "tides" | "details" | "food" | "report") => {
    setOpenSection((prev) => (prev === sec ? null : sec));
  };

  const handleShareBeach = async () => {
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/?beach=${encodeURIComponent(beach.slug)}`
        : `https://www.bimbeachtracker.com/?beach=${encodeURIComponent(beach.slug)}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${beach.name} · BIM Beach Tracker`,
          text: `Check live cameras, tides, and water conditions at ${beach.name} in Barbados:`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard copy
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const handleWhatsAppShare = () => {
    const status = plainStatusLabel(bundle).text;
    const waves = `${bundle.inshoreWaveM.toFixed(2)}m waves`;
    const seaweed =
      bundle.effectiveSargassumScore <= 15
        ? "clean water (no seaweed)"
        : `${bundle.effectiveSargassumScore}% sargassum`;
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/beach/${beach.slug}`
        : `https://www.bimbeachtracker.com/beach/${beach.slug}`;

    const text = `Barbados Beach Update for ${beach.name}:\n\n` +
      `* Status: ${status} (${waves}, ${seaweed})\n` +
      `* Coast: ${beach.coast} (${beach.parish})\n` +
      `* Next Tide: ${tideSchedule.nextTideSummary}\n\n` +
      `Check live cameras and marine conditions:\n${shareUrl}`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
  };

  const windAnalysis = analyzeWindSurfaceEffect(
    beach,
    marine.windDirectionDeg,
    marine.windSpeedKmh
  );

  const handleSubmitCommunityReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beachSlug: beach.slug,
          reporterHandle: reportName.trim() || "Beachgoer",
          waterChop: reportWater,
          sargassumLevel: reportSeaweed,
          notes: reportNote.trim() || undefined,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.checkIn) {
          setRecentReports((prev) => [json.checkIn, ...prev].slice(0, 3));
        }
        setReportNote("");
        setReportSuccess(true);
        onReportSubmitted?.();
      }
    } catch {
      // Ignore transient offline error
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <aside className="flex flex-col rounded-sm border border-white/15 bg-[#061220]/95 backdrop-blur-md shadow-2xl overflow-hidden">
      {/* 1. Live Camera / Photo Header */}
      <div className="relative aspect-[16/9] w-full bg-black overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImageSrc}
          alt={beach.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#061220] via-[#061220]/40 to-transparent" />

        {beach.hasLiveCam && primaryCam ? (
          <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between gap-2">
            <span className="bg-slate-950/85 backdrop-blur-md border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">
              ● Live Cam · {primaryHealth?.ageLabel || "Real-Time View"}
            </span>
            <button
              type="button"
              onClick={() => onOpenLiveCam(beach.slug)}
              className="bg-amber-300 hover:bg-amber-200 text-slate-950 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition shadow-lg"
            >
              {liveCameras.length > 1
                ? `View All ${liveCameras.length} Angles`
                : "Expand Full Screen"}
            </button>
          </div>
        ) : nearestCam ? (
          <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between gap-2">
            <span className="bg-slate-950/85 backdrop-blur-md border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200">
              Live Marine Telemetry · {beach.coast} Coast
            </span>
            <button
              type="button"
              onClick={() => onOpenLiveCam(nearestCam.neighborBeach.slug)}
              className="bg-slate-950/90 hover:bg-amber-300 text-amber-300 hover:text-slate-950 border border-amber-300/40 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition shadow-lg"
            >
              Nearest Cam: {nearestCam.neighborBeach.name.replace(/\s*\([^)]*\)/g, "")} (
              {nearestCam.driveMins}m)
            </button>
          </div>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
            {beach.parish} · {beach.coast} Coast
          </p>
          <h2 className="mt-0.5 font-serif text-2xl sm:text-3xl font-bold text-white leading-tight">
            {beach.name}
          </h2>
          <p className="mt-1 text-sm font-bold">
            <span className={statusToneClass(plainStatusLabel(bundle).tone)}>
              {plainStatusLabel(bundle).text}
            </span>
            <span className="text-slate-300 font-medium">
              {" "}
              right now · {bundle.inshoreWaveM.toFixed(2)}m waves
            </span>
          </p>
          {beach.vibeTag && (
            <p className="mt-1 text-xs sm:text-sm text-cyan-200/90 font-light">
              {beach.vibeTag}
            </p>
          )}
        </div>
      </div>

      {/* 2. Clean 3-Second Snapshot + Drill-Down Accordions */}
      <div className="p-5 space-y-5">
        <p className="text-sm text-slate-200 leading-relaxed font-light">
          {beach.description}
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${beach.lat},${beach.lon}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-sm bg-amber-300 px-3.5 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-950 transition hover:bg-amber-200"
          >
            <Navigation className="h-3.5 w-3.5" />
            <span>Directions</span>
          </a>

          {beach.hasLiveCam && primaryCam ? (
            <button
              type="button"
              onClick={() => onOpenLiveCam(beach.slug)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-sm border border-cyan-300/40 bg-cyan-950/40 px-3.5 py-2.5 text-xs font-bold uppercase tracking-widest text-cyan-100 transition hover:bg-cyan-900/50"
            >
              <Video className="h-3.5 w-3.5 text-amber-300" />
              <span>Live Cam ({liveCameras.length})</span>
            </button>
          ) : nearestCam ? (
            <button
              type="button"
              onClick={() => onOpenLiveCam(nearestCam.neighborBeach.slug)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-sm border border-cyan-300/40 bg-cyan-950/40 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-cyan-100 transition hover:bg-cyan-900/50"
            >
              <Video className="h-3.5 w-3.5 text-amber-300" />
              <span>
                Nearest Cam ({nearestCam.driveMins}m)
              </span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleWhatsAppShare}
            title="Share live beach report via WhatsApp"
            className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-emerald-500/40 bg-emerald-950/40 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-900/50 hover:border-emerald-400"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleShareBeach}
            title="Share direct link to this beach"
            className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-white/20 bg-white/5 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-200 transition hover:border-amber-300 hover:text-amber-300"
          >
            {copiedShare ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>

        {/* At-a-Glance 3-Line Summary */}
        <div className="bg-[#040c16] border border-white/10 p-4 space-y-2 text-xs sm:text-sm">
          <div className="flex items-start justify-between gap-2">
            <span className="font-bold uppercase tracking-wider text-[11px] text-amber-300 shrink-0">
              Water Today:
            </span>
            <span className="text-right text-slate-100">{waterSummary}</span>
          </div>
          <div className="flex items-start justify-between gap-2 border-t border-white/5 pt-2">
            <span className="font-bold uppercase tracking-wider text-[11px] text-emerald-300 shrink-0">
              Seaweed Check:
            </span>
            <span className="text-right text-slate-200">{seaweedSummary}</span>
          </div>
          <div className="flex items-start justify-between gap-2 border-t border-white/5 pt-2">
            <span className="font-bold uppercase tracking-wider text-[11px] text-cyan-300 shrink-0">
              Next Tide:
            </span>
            <span className="text-right text-slate-200 font-medium">
              {tideSchedule.nextTideSummary}
            </span>
          </div>
        </div>

        {/* Wind Surface & Wave Groom Engine (Offshore vs Onshore) */}
        <div className="rounded-sm border border-white/10 bg-[#040e1b] p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-cyan-300" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                Wind &amp; Water Surface
              </span>
            </div>
            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border ${
                windAnalysis.tone === "good"
                  ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
                  : windAnalysis.tone === "ok"
                  ? "border-amber-500/30 bg-amber-950/40 text-amber-300"
                  : "border-rose-500/30 bg-rose-950/40 text-rose-300"
              }`}
            >
              {windAnalysis.label}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-light">
            {windAnalysis.explanation}
          </p>
        </div>

        {/* 24-HOUR SWELL & TIDE FORECAST TIMELINE */}
        {hourlyForecast && hourlyForecast.length > 0 && (
          <div className="rounded-sm border border-white/10 bg-[#040e1b] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-300" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  24-Hour Wave Forecast &amp; Tides
                </h3>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Hourly Planning
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-white/20">
              {hourlyForecast.slice(0, 16).map((pt, idx) => {
                const predM = predictInshoreWave(beach, pt);
                const tone =
                  predM <= 0.3
                    ? "text-emerald-300 border-emerald-500/30 bg-emerald-950/20"
                    : predM <= 0.65
                    ? "text-amber-300 border-amber-500/30 bg-amber-950/20"
                    : "text-rose-300 border-rose-500/30 bg-rose-950/20";
                return (
                  <div
                    key={idx}
                    className={`shrink-0 w-16 text-center rounded-sm border p-2 space-y-1.5 ${tone}`}
                  >
                    <div className="text-[11px] font-bold text-slate-300">
                      {pt.hourLabel}
                    </div>
                    <div className="text-xs font-bold">{predM.toFixed(2)}m</div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">
                      {Math.round(pt.windSpeedKmh)} km/h
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 font-light">
              Predicted inshore wave height adjusted for reef protection and trade wind angle.
            </p>
          </div>
        )}

        {/* Recent Community Reports Banner (if any submitted for this beach) */}
        {recentReports.length > 0 && (
          <div className="border-l-2 border-cyan-400 bg-cyan-950/20 pl-3.5 py-2.5 pr-3 space-y-1 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300 block">
              Latest Beachgoer Report ({recentReports[0].astTimestampLabel})
            </span>
            <p className="text-slate-200">
              <strong>{recentReports[0].reporterHandle}:</strong>{" "}
              {recentReports[0].waterChop} water · {recentReports[0].sargassumLevel} seaweed
              {recentReports[0].notes ? `: "${recentReports[0].notes}"` : ""}
            </p>
          </div>
        )}

        {/* Nearby Calm Alternative if Wavy */}
        <PivotCard
          currentStatus={bundle.statusColor}
          pivot={bundle.pivotRecommendation}
          onSelectBeachSlug={onSelectBeachSlug}
        />

        {/* PROGRESSIVE DRILL-DOWN ACCORDIONS (Click to open details) */}
        <div className="border-t border-white/15 divide-y divide-white/10">
          {/* DRILL-DOWN 1: TODAY'S HIGH & LOW TIDE TABLE */}
          <div>
            <button
              type="button"
              onClick={() => toggleSection("tides")}
              className="w-full py-3.5 flex items-center justify-between text-left group"
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-white group-hover:text-amber-300 transition">
                  1. Today&apos;s High &amp; Low Tides ({tideSchedule.dateLabel})
                </span>
                <span className="block text-[11px] text-slate-400">
                  Tap to view full Barbados tide times &amp; heights
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-amber-300 transition-transform ${
                  openSection === "tides" ? "rotate-180" : ""
                }`}
              />
            </button>

            {openSection === "tides" && (
              <div className="pb-4 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-l border-white/15 bg-[#040c16]">
                  {tideSchedule.events.map((ev, idx) => (
                    <div
                      key={idx}
                      className="border-r border-b border-white/15 p-3 text-center"
                    >
                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest block ${
                          ev.state === "High" ? "text-cyan-300" : "text-amber-300"
                        }`}
                      >
                        {ev.state} Tide
                      </span>
                      <span className="mt-1 block text-base font-bold text-white">
                        {ev.time}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-slate-400">
                        {ev.heightM} ({ev.heightFt})
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span>
                    Sunrise: <strong className="text-slate-200">{tideSchedule.sunrise}</strong> · Sunset:{" "}
                    <strong className="text-slate-200">{tideSchedule.sunset}</strong>
                  </span>
                  <a
                    href={tideSchedule.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-300 hover:text-amber-300 underline underline-offset-4"
                  >
                    Source: TideTime.org Barbados ↗
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* DRILL-DOWN 2: WIND, SWELL & BEACH AMENITIES */}
          <div>
            <button
              type="button"
              onClick={() => toggleSection("details")}
              className="w-full py-3.5 flex items-center justify-between text-left group"
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-white group-hover:text-amber-300 transition">
                  2. Wind, Waves &amp; Beach Facilities
                </span>
                <span className="block text-[11px] text-slate-400">
                  Parking, shade, restrooms, and marine conditions
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-amber-300 transition-transform ${
                  openSection === "details" ? "rotate-180" : ""
                }`}
              />
            </button>

            {openSection === "details" && (
              <div className="pb-4 space-y-3 text-xs text-slate-300">
                <div className="grid grid-cols-2 gap-2.5 bg-[#040c16] p-3 border border-white/10">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                      Nearshore Wave Height
                    </span>
                    <span className="text-sm font-bold text-white">
                      {bundle.inshoreWaveM.toFixed(2)}m ({bundle.inshoreChop})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                      Trade Breeze &amp; Water Temp
                    </span>
                    <span className="text-sm font-bold text-white">
                      {Math.round(marine.windSpeedKmh)} km/h {bundle.compassWindLabel} ·{" "}
                      {(marine.waterTempC ?? 28.4).toFixed(1)}°C (
                      {Math.round(((marine.waterTempC ?? 28.4) * 9) / 5 + 32)}°F)
                    </span>
                  </div>
                  {(marine.airTempC !== undefined ||
                    marine.windGustsKmh !== undefined ||
                    marine.uvIndex !== undefined) && (
                    <>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                          Air Temp &amp; UV Index
                        </span>
                        <span className="text-sm font-bold text-white">
                          {marine.airTempC !== undefined
                            ? `${marine.airTempC.toFixed(1)}°C (${Math.round(
                                (marine.airTempC * 9) / 5 + 32
                              )}°F)`
                            : "Warm Coastal"}
                          {marine.uvIndex !== undefined
                            ? ` · UV ${marine.uvIndex.toFixed(1)}`
                            : ""}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                          Wind Gusts &amp; Surface Flow
                        </span>
                        <span className="text-sm font-bold text-white">
                          {marine.windGustsKmh !== undefined
                            ? `Gusts ${Math.round(marine.windGustsKmh)} km/h`
                            : "Steady Trades"}
                          {marine.oceanCurrentKmh !== undefined
                            ? ` · Current ${marine.oceanCurrentKmh.toFixed(1)} km/h`
                            : ""}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {beach.bestFor && beach.bestFor.length > 0 && (
                  <p>
                    <strong className="text-amber-300 uppercase tracking-wider text-[11px]">
                      Best For:{" "}
                    </strong>
                    {beach.bestFor.join(" · ")}
                  </p>
                )}
                {beach.amenities && beach.amenities.length > 0 && (
                  <p>
                    <strong className="text-cyan-300 uppercase tracking-wider text-[11px]">
                      Facilities on Site:{" "}
                    </strong>
                    {beach.amenities.join(" · ")}
                  </p>
                )}

                <div className="pt-1">
                  <Link
                    href={`/beach/${beach.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-300 hover:text-amber-200 underline underline-offset-4"
                  >
                    <span>Open Standalone {beach.name} Page</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* DRILL-DOWN 3: WHERE TO EAT, RENT CHAIRS & LOCAL SPOTS */}
          <div>
            <button
              type="button"
              onClick={() => toggleSection("food")}
              className="w-full py-3.5 flex items-center justify-between text-left group"
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-white group-hover:text-amber-300 transition">
                  3. Food, Chairs &amp; Local Spots Here
                </span>
                <span className="block text-[11px] text-amber-200/80">
                  {partner.partnerName}
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-amber-300 transition-transform ${
                  openSection === "food" ? "rotate-180" : ""
                }`}
              />
            </button>

            {openSection === "food" && (
              <div className="pb-4 space-y-3">
                <div className="bg-[#040c16] border border-white/10 p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-amber-300">
                    <span>{partner.category}</span>
                    <button
                      type="button"
                      onClick={() => onOpenSponsorModal(beach.slug)}
                      className="text-slate-400 hover:text-white underline underline-offset-4"
                    >
                      List a business here
                    </button>
                  </div>
                  <h4 className="font-serif text-lg font-bold text-white">
                    {partner.partnerName}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-light">
                    {partner.perkOffer}
                  </p>
                  <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                    {partner.priceHint && (
                      <span className="text-[11px] text-amber-200">
                        {partner.priceHint}
                      </span>
                    )}
                    {partner.isSponsored ? (
                      <a
                        href={partner.ctaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-300 hover:text-amber-200 underline underline-offset-4"
                      >
                        <span>{partner.ctaLabel}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenSponsorModal(beach.slug)}
                        className="text-xs font-bold uppercase tracking-wider text-amber-300 hover:text-amber-200 underline underline-offset-4"
                      >
                        Feature Your Spot on {beach.name}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* DRILL-DOWN 4: QUICK 2-TAP "I'M AT THE BEACH" COMMUNITY REPORT */}
          <div>
            <button
              type="button"
              onClick={() => toggleSection("report")}
              className="w-full py-3.5 flex items-center justify-between text-left group"
            >
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300 group-hover:text-amber-300 transition">
                  <MessageSquarePlus className="h-3.5 w-3.5" />
                  <span>4. At {beach.name} Now? Post a Quick Update</span>
                </span>
                <span className="block text-[11px] text-slate-400">
                  Help fellow beachgoers with a 5-second water &amp; seaweed check
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-amber-300 transition-transform ${
                  openSection === "report" ? "rotate-180" : ""
                }`}
              />
            </button>

            {openSection === "report" && (
              <form
                onSubmit={handleSubmitCommunityReport}
                className="pb-4 space-y-3 text-xs"
              >
                <div className="bg-[#040c16] border border-white/10 p-4 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-1.5">
                      How is the water right now?
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { val: "Glassy", label: "Calm / Pool" },
                          { val: "Light Ripple", label: "Gentle Waves" },
                          { val: "Moderate Chop", label: "Wavy / Rough" },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setReportWater(opt.val)}
                          className={`py-2 px-2 text-[11px] font-semibold border transition ${
                            reportWater === opt.val
                              ? "border-amber-300 bg-amber-300/15 text-white"
                              : "border-white/15 bg-white/5 text-slate-300 hover:text-white"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
                      How is the seaweed (sargassum)?
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { val: "None (0%)", label: "Clear" },
                          { val: "Light Trace", label: "Light Patch" },
                          { val: "Heavy Blanket", label: "Lots of Seaweed" },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setReportSeaweed(opt.val)}
                          className={`py-2 px-2 text-[11px] font-semibold border transition ${
                            reportSeaweed === opt.val
                              ? "border-emerald-300 bg-emerald-400/15 text-white"
                              : "border-white/15 bg-white/5 text-slate-300 hover:text-white"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      placeholder="Your name (optional)"
                      className="rounded-sm border border-white/15 bg-[#071526] px-2.5 py-2 text-xs text-white placeholder-slate-400"
                    />
                    <input
                      type="text"
                      value={reportNote}
                      onChange={(e) => setReportNote(e.target.value)}
                      placeholder="Short note (e.g. Turtles out, Cuzz's open)"
                      className="sm:col-span-2 rounded-sm border border-white/15 bg-[#071526] px-2.5 py-2 text-xs text-white placeholder-slate-400"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    {reportSuccess ? (
                      <span className="text-emerald-300 font-semibold">
                        ✓ Thanks! Your live beach update is now posted.
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        Updates this beach immediately for everyone
                      </span>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmittingReport}
                      className="rounded-sm bg-amber-300 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-950 hover:bg-amber-200 transition disabled:opacity-50"
                    >
                      {isSubmittingReport ? "Posting..." : "Post Beach Update"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
