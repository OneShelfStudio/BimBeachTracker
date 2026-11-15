"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Navigation,
  RefreshCw,
  Search,
  Video,
} from "lucide-react";
import { IslandTelemetryPayload } from "@/lib/openMeteo";
import { formatCameraAge, plainStatusLabel, rankBestRightNow, statusToneClass } from "@/lib/scoring";
import { getCamerasForBeach, getPrimaryCameraForBeach, setStaleCameraIds } from "@/lib/cameras";
import { getFeaturedPartnersList, getPartnerForBeach } from "@/lib/sponsors";
import IslandMap from "./IslandMap";
import FilterPills, { QuickFilterKey } from "./FilterPills";
import ConditionsPanel from "./ConditionsPanel";
import CamHUDModal from "./CamHUDModal";
import SponsorInquiryModal from "./SponsorInquiryModal";
import SafetyDirectoryModal from "./SafetyDirectoryModal";
import AdUnit from "./AdUnit";

interface BimBeachDashboardProps {
  initialData: IslandTelemetryPayload;
  initialCheckIns?: unknown[];
}

export default function BimBeachDashboard({ initialData }: BimBeachDashboardProps) {
  const [data, setData] = useState<IslandTelemetryPayload>(initialData);
  // Hide stale cameras everywhere before any child renders
  setStaleCameraIds(data.staleCameraIds);
  const [selectedSlug, setSelectedSlug] = useState<string>("pebbles-beach");
  const [activeFilter, setActiveFilter] = useState<QuickFilterKey>("all");
  const [coastFilter, setCoastFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [camModalSlug, setCamModalSlug] = useState<string | null>(null);
  const [sponsorModalSlug, setSponsorModalSlug] = useState<string | null>(null);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Progressive section switcher below the map so users aren't hit with a wall of content
  const [activeBottomTab, setActiveBottomTab] = useState<"cameras" | "beaches" | "spots">("cameras");

  const mapSectionRef = useRef<HTMLDivElement | null>(null);
  const panelSectionRef = useRef<HTMLDivElement | null>(null);

  const handleSelectBeachAndScroll = (
    slug: string,
    scrollTarget: "none" | "map" | "panel" = "none"
  ) => {
    setSelectedSlug(slug);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("beach", slug);
      window.history.replaceState({}, "", url.toString());

      if (scrollTarget === "map") {
        mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (scrollTarget === "panel") {
        panelSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleRefreshTelemetry = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/conditions", { cache: "no-store" });
      if (res.ok) {
        const json: IslandTelemetryPayload = await res.json();
        setData(json);
      }
    } catch {
      // Keep existing snapshot on transient offline error
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const beachParam = params.get("beach");
      if (beachParam && data.beaches.some((b) => b.beach.slug === beachParam)) {
        setSelectedSlug(beachParam);
      }
    }
    handleRefreshTelemetry();
    const interval = setInterval(() => {
      handleRefreshTelemetry();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filterCounts = useMemo<Record<QuickFilterKey, number>>(() => {
    const b = data.beaches;
    return {
      all: b.length,
      "best-swim": b.filter((x) => x.statusColor === "green" && x.swimScore >= 78).length,
      "zero-sargassum": b.filter((x) => x.effectiveSargassumScore <= 15).length,
      "turtle-snorkel": b.filter(
        (x) =>
          (x.beach.bestFor || []).some((t) => /turtle|snorkel/i.test(t)) ||
          /turtle|snorkel|reef/i.test(x.beach.description)
      ).length,
      "kid-friendly": b.filter((x) => x.beach.kidFriendly && x.statusColor !== "red").length,
      "sunset-bars": b.filter(
        (x) =>
          (x.beach.bestFor || []).some((t) => /sunset|bar|cocktail|dining/i.test(t)) ||
          /sunset|boardwalk|bar/i.test(x.beach.description)
      ).length,
      "surf-east": b.filter((x) => x.beach.surfSpot).length,
      "live-cam": b.filter((x) => x.beach.hasLiveCam).length,
    };
  }, [data.beaches]);

  const filteredBeaches = useMemo(() => {
    return data.beaches.filter((item) => {
      if (coastFilter !== "All" && item.beach.coast !== coastFilter) {
        return false;
      }
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchName = item.beach.name.toLowerCase().includes(q);
        const matchParish = item.beach.parish.toLowerCase().includes(q);
        const matchDesc = item.beach.description.toLowerCase().includes(q);
        const matchBest = (item.beach.bestFor || []).some((t) =>
          t.toLowerCase().includes(q)
        );
        if (!matchName && !matchParish && !matchDesc && !matchBest) return false;
      }
      switch (activeFilter) {
        case "best-swim":
          return item.statusColor === "green" && item.swimScore >= 78;
        case "zero-sargassum":
          return item.effectiveSargassumScore <= 15;
        case "turtle-snorkel":
          return (
            (item.beach.bestFor || []).some((t) => /turtle|snorkel/i.test(t)) ||
            /turtle|snorkel|reef/i.test(item.beach.description)
          );
        case "kid-friendly":
          return item.beach.kidFriendly && item.statusColor !== "red";
        case "sunset-bars":
          return (
            (item.beach.bestFor || []).some((t) => /sunset|bar|cocktail|dining/i.test(t)) ||
            /sunset|boardwalk|bar/i.test(item.beach.description)
          );
        case "surf-east":
          return item.beach.surfSpot;
        case "live-cam":
          return item.beach.hasLiveCam;
        default:
          return true;
      }
    });
  }, [data.beaches, activeFilter, coastFilter, searchQuery]);

  const filteredSlugs = useMemo(
    () => new Set(filteredBeaches.map((b) => b.beach.slug)),
    [filteredBeaches]
  );

  const selectedBundle = useMemo(() => {
    return (
      data.beaches.find((b) => b.beach.slug === selectedSlug) ||
      filteredBeaches[0] ||
      data.beaches[0]
    );
  }, [data.beaches, filteredBeaches, selectedSlug]);

  const camModalBundle = useMemo(() => {
    if (!camModalSlug) return null;
    return data.beaches.find((b) => b.beach.slug === camModalSlug) || null;
  }, [camModalSlug, data.beaches]);

  const liveCamBeaches = useMemo(() => {
    return data.beaches.filter((b) => b.beach.hasLiveCam);
  }, [data.beaches]);

  const featuredPartners = useMemo(() => getFeaturedPartnersList(), []);
  const cacheBust = Math.floor(Date.now() / 60000);

  // Top 3 beaches right now (green only, best swim score, least seaweed)
  const bestRightNow = useMemo(() => rankBestRightNow(data.beaches, 3), [data.beaches]);
  const bestSlugs = useMemo(() => bestRightNow.map((b) => b.beach.slug), [bestRightNow]);

  // Freshest camera age for a beach, for the "Updated X min ago" label
  const freshestCamAge = (slug: string): number | null | undefined => {
    const ages = getCamerasForBeach(slug)
      .map((c) => data.cameraAgeMinutes?.[c.id])
      .filter((a): a is number => typeof a === "number");
    return ages.length > 0 ? Math.min(...ages) : null;
  };

  return (
    <div className="relative min-h-screen bg-[#030d18] text-slate-100 overflow-x-hidden">
      {/* FLOWY CARIBBEAN OCEANIC AMBIENT BACKDROP (No Mountain Video) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 55% at 50% -10%, rgba(6, 182, 212, 0.22), transparent 65%), radial-gradient(ellipse 75% 50% at 85% 25%, rgba(14, 116, 144, 0.18), transparent 65%), radial-gradient(ellipse 80% 60% at 15% 65%, rgba(3, 105, 161, 0.16), transparent 70%), linear-gradient(180deg, #041322 0%, #030d18 55%, #020810 100%)",
          }}
        />
        {/* Gentle SVG Oceanic Current Lines */}
        <svg
          className="absolute inset-x-0 top-0 h-[560px] w-full opacity-25"
          viewBox="0 0 1440 400"
          preserveAspectRatio="none"
        >
          <path
            fill="url(#oceanWaveGrad1)"
            d="M0,128L80,144C160,160,320,192,480,181.3C640,171,800,117,960,112C1120,107,1280,149,1360,170.7L1440,192L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"
          />
          <path
            fill="url(#oceanWaveGrad2)"
            d="M0,256L80,240C160,224,320,192,480,197.3C640,203,800,245,960,250.7C1120,256,1280,224,1360,208L1440,192L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"
          />
          <defs>
            <linearGradient id="oceanWaveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#0284c7" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="oceanWaveGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.22" />
              <stop offset="60%" stopColor="#0369a1" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#030d18" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* TOP BAR */}
      <header className="relative z-20 border-b border-white/10 bg-[#030d18]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="h-2 w-2 bg-cyan-400 inline-block" />
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">
              BimBeachTracker · Barbados Coastal Guide
            </span>
            <span className="text-white/20 hidden md:inline">|</span>
            <Link
              href="/"
              className="text-[11px] font-medium text-slate-300 hover:text-amber-300 transition underline underline-offset-4"
            >
              Free Public Tool by Digital Dads LLC →
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="text-slate-300 hidden sm:inline">
              {data.tideSchedule.nextTideSummary}
            </span>
            <span className="text-white/20 hidden sm:inline">|</span>
            <button
              type="button"
              onClick={handleRefreshTelemetry}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 text-slate-200 hover:text-amber-300 transition uppercase tracking-wider font-semibold"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-amber-300 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
              <span>Refresh Live Data</span>
            </button>
            <span className="text-white/20">|</span>
            <button
              type="button"
              onClick={() => setSponsorModalSlug(selectedBundle.beach.slug)}
              className="text-amber-300 hover:text-amber-200 font-semibold uppercase tracking-wider underline underline-offset-4"
            >
              List a Local Beach Spot
            </button>
            <span className="text-white/20 hidden sm:inline">|</span>
            <button
              type="button"
              onClick={() => setShowSafetyModal(true)}
              className="text-rose-300 hover:text-rose-200 font-semibold uppercase tracking-wider underline underline-offset-4"
            >
              Safety &amp; Lifeguards
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="relative z-10 mx-auto max-w-7xl px-5 pt-8 pb-16 sm:px-6 space-y-12">
        {/* ========================================================================= */}
        {/* 1. TOP SECTION: "WHERE DO YOU WANT TO GO TODAY?" + INTERACTIVE MAP & PANEL */}
        {/* ========================================================================= */}
        <section ref={mapSectionRef} className="scroll-mt-16 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 border-b border-white/15 pb-5">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                {(selectedBundle.marine.waterTempC ?? 28.4).toFixed(1)}°C (
                {Math.round(((selectedBundle.marine.waterTempC ?? 28.4) * 9) / 5 + 32)}°F) Water ·{" "}
                {data.tideSchedule.nextTideSummary}
              </p>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white">
                Where Do You Want to Go <span className="italic font-normal text-amber-200">Today?</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 font-light">
                Tap any beach on the Barbados map or filter by what you feel like doing today. Open the sections on the right only when you want deeper tide, wind, or food details.
              </p>
            </div>

            {/* Coast & Search Filter Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center border-b border-white/20 pb-1">
                {["All", "West", "South", "East/Southeast", "North"].map((coast) => (
                  <button
                    key={coast}
                    type="button"
                    onClick={() => setCoastFilter(coast)}
                    className={`px-2.5 py-1 text-xs font-semibold transition-colors ${
                      coastFilter === coast
                        ? "text-amber-300"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {coast === "All"
                      ? "All Coasts"
                      : coast === "East/Southeast"
                      ? "East"
                      : coast}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-56">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search beach, turtles, shade..."
                  className="w-full rounded-sm border border-white/15 bg-[#061526] pl-8 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:border-amber-300 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Mood Filter Tabs */}
          <FilterPills
            activeFilter={activeFilter}
            onSelectFilter={setActiveFilter}
            counts={filterCounts}
          />

          {/* Best Right Now: top 3 beaches, one tap to jump */}
          {bestRightNow.length > 0 && (
            <div className="border border-amber-300/30 bg-[#071628]/90 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">
                Best right now
              </p>
              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {bestRightNow.map((item, idx) => {
                  const plain = plainStatusLabel(item);
                  const isSel = item.beach.slug === selectedBundle.beach.slug;
                  return (
                    <button
                      key={item.beach.slug}
                      type="button"
                      onClick={() => handleSelectBeachAndScroll(item.beach.slug, "none")}
                      className={`flex items-center gap-3 border px-3.5 py-3 text-left transition ${
                        isSel
                          ? "border-amber-300 bg-amber-300/10"
                          : "border-white/15 bg-white/5 hover:border-amber-300/60"
                      }`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-amber-300 text-sm font-extrabold text-slate-950">
                        {idx + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-white">
                          {item.beach.name.replace(/\s*\([^)]*\)/g, "")}
                        </span>
                        <span className={`block text-xs font-medium ${statusToneClass(plain.tone)}`}>
                          {plain.text} · {item.inshoreWaveM.toFixed(2)}m waves
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Thumb-Friendly Quick Beach Selector Strip (1-Tap Jump on Mobile & Desktop) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
            <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
              Quick Jump:
            </span>
            {filteredBeaches.map((item) => {
              const isSel = item.beach.slug === selectedBundle.beach.slug;
              const dotColor =
                item.statusColor === "green"
                  ? "bg-emerald-400"
                  : item.statusColor === "amber"
                  ? "bg-amber-400"
                  : "bg-rose-400";
              const shortName = item.beach.name.replace(/\s*\([^)]*\)/g, "");
              const plain = plainStatusLabel(item);
              return (
                <button
                  key={item.beach.slug}
                  type="button"
                  onClick={() => handleSelectBeachAndScroll(item.beach.slug, "none")}
                  className={`shrink-0 inline-flex items-center gap-2 rounded-sm border px-3.5 py-2.5 text-xs font-semibold transition ${
                    isSel
                      ? "border-amber-300 bg-amber-300 text-slate-950 shadow-md"
                      : "border-white/15 bg-[#061526]/90 text-slate-200 hover:border-white/40 hover:text-white"
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 ${
                      isSel ? "bg-slate-950" : dotColor
                    }`}
                  />
                  <span>{shortName}</span>
                  <span className={`font-medium ${isSel ? "text-slate-800" : statusToneClass(plain.tone)}`}>
                    {plain.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Interactive Map (Left) + Selected Beach Drill-Down Panel (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 space-y-3">
              <IslandMap
                beaches={data.beaches}
                filteredSlugs={filteredSlugs}
                selectedSlug={selectedBundle.beach.slug}
                bestSlugs={bestSlugs}
                onSelectBeach={(slug) => handleSelectBeachAndScroll(slug, "none")}
                onOpenLiveCam={(slug) => setCamModalSlug(slug)}
                dominantSwellLabel={data.islandSummary.dominantSwellLabel}
                dominantWindLabel={data.islandSummary.dominantWindLabel}
              />

              {/* Mobile Quick-Jump Bar Under Map so Phone Users See Selected Beach Immediately */}
              <div className="lg:hidden flex items-center justify-between gap-3 rounded-sm border border-amber-300/40 bg-[#071628] px-4 py-3 shadow-lg">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 block">
                    Selected on Map · {selectedBundle.beach.coast} Coast
                  </span>
                  <span className="font-serif text-base font-bold text-white">
                    {selectedBundle.beach.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectBeachAndScroll(selectedBundle.beach.slug, "panel")}
                  className="shrink-0 rounded-sm bg-amber-300 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-950"
                >
                  View Tides &amp; Cam ↓
                </button>
              </div>
            </div>

            <div ref={panelSectionRef} className="lg:col-span-6 scroll-mt-16">
              <ConditionsPanel
                bundle={selectedBundle}
                tideSchedule={data.tideSchedule}
                hourlyForecast={data.hourlyForecast}
                onSelectBeachSlug={(slug) => handleSelectBeachAndScroll(slug, "none")}
                onOpenLiveCam={(slug) => setCamModalSlug(slug)}
                onOpenSponsorModal={(slug) => setSponsorModalSlug(slug)}
                onReportSubmitted={handleRefreshTelemetry}
              />
            </div>
          </div>

          <AdUnit
            slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BEACH_TOP || "4800798822"}
            variant="beach"
            label="Sponsored"
          />
        </section>

        {/* ========================================================================= */}
        {/* 2. PROGRESSIVE BROWSE TABS: CAMERAS / ALL BEACHES / LOCAL FOOD & CHAIRS */}
        {/* ========================================================================= */}
        <section className="border-t border-white/15 pt-10 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/15 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Explore More When You Need It
              </p>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white mt-0.5">
                Live Cameras, All {data.beaches.length} Beaches &amp; Local Spots
              </h2>
            </div>

            {/* 3 Clean Section Switcher Tabs */}
            <div className="flex flex-wrap items-center gap-6">
              <button
                type="button"
                onClick={() => setActiveBottomTab("cameras")}
                className={`pb-2 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition ${
                  activeBottomTab === "cameras"
                    ? "border-amber-300 text-amber-300"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                Live Cameras ({liveCamBeaches.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveBottomTab("beaches")}
                className={`pb-2 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition ${
                  activeBottomTab === "beaches"
                    ? "border-amber-300 text-amber-300"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                All Beaches ({filteredBeaches.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveBottomTab("spots")}
                className={`pb-2 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition ${
                  activeBottomTab === "spots"
                    ? "border-amber-300 text-amber-300"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                Fish Cutters, Bars &amp; Chairs ({featuredPartners.length})
              </button>
            </div>
          </div>

          {/* TAB A: LIVE CAMERAS GRID */}
          {activeBottomTab === "cameras" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {liveCamBeaches.map((item) => {
                const cam = getPrimaryCameraForBeach(item.beach.slug);
                const allCams = getCamerasForBeach(item.beach.slug);
                if (!cam) return null;

                const waterText =
                  item.inshoreWaveM <= 0.25
                    ? "Calm like a pool"
                    : item.inshoreWaveM <= 0.5
                    ? "Gentle waves"
                    : "Active surf";

                const seaweedText =
                  item.effectiveSargassumScore <= 15
                    ? "Clear of seaweed"
                    : "Light seaweed";

                return (
                  <div
                    key={item.beach.slug}
                    className="group relative h-[240px] w-full overflow-hidden rounded-sm border border-white/15 bg-black text-left shadow-xl transition hover:border-amber-300"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${cam.snapshotUrl}?t=${cacheBust}`}
                      alt={`Live camera at ${item.beach.name}`}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="bg-slate-950/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-300 border border-white/15">
                        ● {formatCameraAge(freshestCamAge(item.beach.slug))}
                      </span>
                      {allCams.length > 1 && (
                        <span className="bg-slate-950/85 px-2 py-1 text-[10px] font-semibold text-slate-200 border border-white/15">
                          {allCams.length} Angles
                        </span>
                      )}
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-4 space-y-2">
                      <div>
                        <h3 className="font-serif text-lg font-bold text-white">
                          {item.beach.name}
                        </h3>
                        <p className="text-xs text-slate-200">
                          <span className={`font-semibold ${statusToneClass(plainStatusLabel(item).tone)}`}>
                            {plainStatusLabel(item).text}
                          </span>{" "}
                          · {waterText} · {seaweedText} · {item.beach.coast} Coast
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setCamModalSlug(item.beach.slug)}
                          className="flex-1 bg-amber-300 hover:bg-amber-200 text-slate-950 py-1.5 px-2.5 text-[10px] font-bold uppercase tracking-wider text-center transition"
                        >
                          Watch Cam
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectBeachAndScroll(item.beach.slug, "map")}
                          className="flex-1 bg-slate-950/85 hover:bg-slate-900 text-white border border-white/25 py-1.5 px-2.5 text-[10px] font-bold uppercase tracking-wider text-center transition"
                        >
                          View on Map
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB B: ALL 20 BEACHES GRID */}
          {activeBottomTab === "beaches" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBeaches.map((item) => {
                const isSelected = item.beach.slug === selectedBundle.beach.slug;
                const primaryCam = getPrimaryCameraForBeach(item.beach.slug);
                const allCams = getCamerasForBeach(item.beach.slug);
                const partner = getPartnerForBeach(item.beach.slug, item.beach.name);

                const cardImageSrc =
                  item.beach.hasLiveCam && primaryCam?.snapshotUrl
                    ? `${primaryCam.snapshotUrl}?t=${cacheBust}`
                    : item.beach.coverPhoto;

                const waterLine =
                  item.inshoreWaveM <= 0.25
                    ? "Calm like a swimming pool today"
                    : item.inshoreWaveM <= 0.5
                    ? "Gentle swimming waves near shore"
                    : "Lively waves & coastal breeze";

                const seaweedLine =
                  item.effectiveSargassumScore <= 15
                    ? "Clear of seaweed"
                    : item.effectiveSargassumScore <= 35
                    ? "Light seaweed on tideline"
                    : "Seaweed present today";

                return (
                  <article
                    key={item.beach.slug}
                    className={`group relative flex h-[380px] flex-col justify-between overflow-hidden rounded-sm border bg-black transition-all ${
                      isSelected
                        ? "border-amber-300 shadow-2xl"
                        : "border-white/15 hover:border-white/40"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cardImageSrc}
                      alt={item.beach.name}
                      className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030d18] via-[#030d18]/75 to-black/20" />

                    <div className="relative z-10 flex items-start justify-between gap-2 p-4">
                      <span className="bg-slate-950/85 backdrop-blur-md border border-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-200">
                        {item.beach.parish} · {item.beach.coast} Coast
                      </span>

                      {item.beach.hasLiveCam && primaryCam && (
                        <button
                          type="button"
                          onClick={() => setCamModalSlug(item.beach.slug)}
                          className="inline-flex items-center gap-1.5 bg-amber-300 hover:bg-amber-200 text-slate-950 px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition shadow-md"
                        >
                          <Video className="h-3 w-3" />
                          <span>
                            Live Cam {allCams.length > 1 ? `(${allCams.length})` : ""}
                          </span>
                        </button>
                      )}
                    </div>

                    <div className="relative z-10 p-5 space-y-3">
                      <div>
                        {item.beach.vibeTag && (
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
                            {item.beach.vibeTag}
                          </p>
                        )}
                        <h3 className="mt-0.5 font-serif text-2xl font-bold text-white leading-snug">
                          {item.beach.name}
                        </h3>
                        <p className="mt-1 text-xs text-slate-200 font-light line-clamp-2">
                          {item.beach.tagline}
                        </p>
                      </div>

                      <div className="border-t border-white/15 pt-2.5 text-xs text-slate-200 space-y-1">
                        <p>
                          <strong className="text-white">Today:</strong>{" "}
                          <span className={`font-semibold ${statusToneClass(plainStatusLabel(item).tone)}`}>
                            {plainStatusLabel(item).text}
                          </span>{" "}
                          · {waterLine} ·{" "}
                          <span className="text-emerald-300">{seaweedLine}</span>
                        </p>
                        {partner.isSponsored && (
                          <p className="text-amber-200/90 truncate">
                            <strong className="text-amber-300">Spot:</strong>{" "}
                            {partner.partnerName}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSelectBeachAndScroll(item.beach.slug, "map")}
                          className="flex-1 rounded-sm bg-amber-300 py-2 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-950 transition hover:bg-amber-200 text-center"
                        >
                          Inspect on Map &amp; Tides
                        </button>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${item.beach.lat},${item.beach.lon}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Directions to ${item.beach.name}`}
                          className="rounded-sm border border-white/30 bg-slate-950/60 p-2 text-slate-200 transition hover:border-amber-300 hover:text-amber-300"
                        >
                          <Navigation className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* TAB C: VERIFIED LOCAL BEACH SPOTS (FISH CUTTERS, BARS & CHAIRS) */}
          {activeBottomTab === "spots" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-slate-300 max-w-2xl font-light">
                  Local fish cutter stands, beach bars, shaded lounger rentals, and surf schools right on the sand across Barbados.
                </p>
                <button
                  type="button"
                  onClick={() => setSponsorModalSlug(selectedBundle.beach.slug)}
                  className="rounded-sm border border-amber-300 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-300 transition hover:bg-amber-300 hover:text-slate-950"
                >
                  List Your Beach Business
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredPartners.map((partner) => (
                  <div
                    key={partner.beachSlug}
                    className="flex flex-col justify-between rounded-sm border border-white/15 bg-[#061220] p-6 space-y-4 transition hover:border-amber-300/60"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2 text-[11px] uppercase tracking-wider">
                        <span className="font-semibold text-amber-300">
                          {partner.beachLabel || partner.beachSlug}
                        </span>
                        <span className="text-slate-400">{partner.category}</span>
                      </div>

                      <h3 className="font-serif text-xl font-bold text-white">
                        {partner.partnerName}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
                        {partner.perkOffer}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-white/10">
                      {partner.priceHint && (
                        <p className="text-xs font-medium text-amber-200">
                          {partner.priceHint}
                        </p>
                      )}

                      <div className="flex items-center gap-2.5">
                        <a
                          href={partner.ctaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-sm bg-amber-300 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-slate-950 transition hover:bg-amber-200"
                        >
                          <span>{partner.ctaLabel}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleSelectBeachAndScroll(partner.beachSlug, "map")}
                          className="rounded-sm border border-white/25 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-200 hover:border-white hover:text-white transition"
                        >
                          View on Map
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <AdUnit
            slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BEACH_BOTTOM || "4800798822"}
            variant="beach"
            label="Sponsored"
          />
        </section>
      </main>

      {/* Live Camera Modal */}
      <CamHUDModal
        bundle={camModalBundle}
        onClose={() => setCamModalSlug(null)}
      />

      {/* Local Business Listing Modal */}
      <SponsorInquiryModal
        isOpen={Boolean(sponsorModalSlug)}
        defaultBeachSlug={sponsorModalSlug || selectedBundle.beach.slug}
        onClose={() => setSponsorModalSlug(null)}
      />

      {/* Coastal Safety & Emergency Directory Modal */}
      <SafetyDirectoryModal
        isOpen={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
      />
    </div>
  );
}
