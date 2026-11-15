"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  LocateFixed,
  Maximize2,
  Minus,
  Plus,
  Video,
  X,
} from "lucide-react";
import { BeachTelemetryBundle } from "@/lib/openMeteo";
import { getNearestCameraNeighbor } from "@/lib/cameras";
import { plainStatusLabel, statusToneClass } from "@/lib/scoring";

interface IslandMapProps {
  beaches: BeachTelemetryBundle[];
  filteredSlugs: Set<string>;
  selectedSlug: string;
  /** Slugs of the top beaches right now, in rank order (index 0 = best) */
  bestSlugs?: string[];
  onSelectBeach: (slug: string) => void;
  onOpenLiveCam: (slug: string) => void;
  dominantSwellLabel: string;
  dominantWindLabel: string;
}

const LAT_MIN = 13.032;
const LAT_MAX = 13.342;
const LON_MIN = -59.662;
const LON_MAX = -59.408;

const BARBADOS_CENTER_LAT = 13.1939;
const BARBADOS_CENTER_LON = -59.5432;

const SVG_WIDTH = 560;
const SVG_HEIGHT = 680;
const PAD_X = 68;
const PAD_Y = 58;

export function projectLatLonToSvg(lat: number, lon: number): { x: number; y: number } {
  const normX = (lon - LON_MIN) / (LON_MAX - LON_MIN);
  const normY = 1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN);
  return {
    x: Number((PAD_X + normX * (SVG_WIDTH - PAD_X * 2)).toFixed(1)),
    y: Number((PAD_Y + normY * (SVG_HEIGHT - PAD_Y * 2)).toFixed(1)),
  };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 45-point high-detail contour around Barbados coastlines
const BARBADOS_COAST_COORDS: [number, number][] = [
  [13.337, -59.615], // North Point
  [13.333, -59.601],
  [13.326, -59.589], // River Bay
  [13.314, -59.577],
  [13.301, -59.569], // Morgan Lewis
  [13.285, -59.561], // Cove Bay / Barclays
  [13.268, -59.553], // Cattlewash North
  [13.252, -59.544], // Cattlewash
  [13.234, -59.534], // Tent Bay / Bathsheba
  [13.215, -59.521], // Martins Bay
  [13.199, -59.503], // Conset Bay
  [13.186, -59.477], // Bath / Skeetes
  [13.173, -59.446], // East Point / Ragged Point approach
  [13.164, -59.430], // Ragged Point
  [13.149, -59.423], // Culpepper / Harrismith
  [13.133, -59.424], // Crane Beach
  [13.116, -59.434], // Foul Bay
  [13.100, -59.449], // Long Bay / Chancery
  [13.084, -59.468], // Inch Marlow
  [13.069, -59.487], // Silver Sands
  [13.056, -59.504], // South Point
  [13.046, -59.519], // Atlantic Shores
  [13.045, -59.532], // Enterprise / Miami Beach
  [13.058, -59.541], // Oistins Bay
  [13.064, -59.553], // Maxwell Coast
  [13.068, -59.569], // Dover / St. Lawrence Gap
  [13.073, -59.586], // Worthing / Accra
  [13.076, -59.602], // Hastings / Garrison
  [13.078, -59.612], // Needham's Point / Pebbles
  [13.089, -59.614], // Carlisle Bay crescent
  [13.098, -59.622], // Bridgetown Harbour
  [13.109, -59.627], // Deep Water Harbour
  [13.122, -59.631], // Brighton / Brandons
  [13.139, -59.637], // Batts Rock / Paradise
  [13.157, -59.640], // Fitts Village / Derricks
  [13.175, -59.641], // Paynes Bay
  [13.194, -59.642], // Holetown / Folkestone
  [13.213, -59.643], // Heron Bay / Reeds Bay
  [13.232, -59.643], // Weston / Gibbes
  [13.249, -59.644], // Mullins Bay
  [13.268, -59.646], // Speightstown
  [13.285, -59.648], // Heywoods / Almond
  [13.304, -59.652], // Six Mens / Checker Hall
  [13.318, -59.645], // Harrison Point
  [13.330, -59.631], // Cluffs / Archer's Bay
];

const ISLAND_SVG_POINTS = BARBADOS_COAST_COORDS.map(([lat, lon]) =>
  projectLatLonToSvg(lat, lon)
);

const ISLAND_POLYGON_PATH =
  ISLAND_SVG_POINTS.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ") + " Z";

type SectorPreset = {
  id: string;
  label: string;
  zoom: number;
  centerX: number;
  centerY: number;
};

const SECTOR_PRESETS: SectorPreset[] = [
  { id: "island", label: "Full Island", zoom: 1, centerX: 280, centerY: 340 },
  { id: "platinum", label: "Platinum Coast", zoom: 3, centerX: 100, centerY: 300 },
  { id: "west", label: "West / Carlisle", zoom: 2.2, centerX: 130, centerY: 430 },
  { id: "south", label: "South Coast", zoom: 2.5, centerX: 215, centerY: 575 },
  { id: "east", label: "East Coast", zoom: 2.1, centerX: 390, centerY: 380 },
];

export default function IslandMap({
  beaches,
  filteredSlugs,
  selectedSlug,
  bestSlugs = [],
  onSelectBeach,
  onOpenLiveCam,
  dominantSwellLabel,
  dominantWindLabel,
}: IslandMapProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeSector, setActiveSector] = useState<string>("island");
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationBanner, setLocationBanner] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(
    null
  );

  const selectedBundle =
    beaches.find((b) => b.beach.slug === selectedSlug) || beaches[0];
  const hoveredBundle = hoveredSlug
    ? beaches.find((b) => b.beach.slug === hoveredSlug) || null
    : null;
  const hudBundle = hoveredBundle || selectedBundle;

  const nearestCam =
    selectedBundle && !selectedBundle.beach.hasLiveCam
      ? getNearestCameraNeighbor(selectedBundle.beach.slug)
      : null;
  const hudNearestCam =
    hudBundle && !hudBundle.beach.hasLiveCam
      ? getNearestCameraNeighbor(hudBundle.beach.slug)
      : null;

  const pivotTarget =
    selectedBundle &&
    (selectedBundle.statusColor === "red" || selectedBundle.statusColor === "amber")
      ? selectedBundle.pivotRecommendation?.target
      : null;

  const fromPt = selectedBundle
    ? projectLatLonToSvg(selectedBundle.beach.lat, selectedBundle.beach.lon)
    : null;
  const toPt = pivotTarget
    ? projectLatLonToSvg(pivotTarget.beach.lat, pivotTarget.beach.lon)
    : null;

  const clampPan = (nx: number, ny: number, z: number) => {
    if (z <= 1.02) return { x: 0, y: 0 };
    const maxOffsetX = ((z - 1) * SVG_WIDTH) / 1.75;
    const maxOffsetY = ((z - 1) * SVG_HEIGHT) / 1.75;
    return {
      x: Math.max(-maxOffsetX, Math.min(maxOffsetX, nx)),
      y: Math.max(-maxOffsetY, Math.min(maxOffsetY, ny)),
    };
  };

  const handleZoomBy = (delta: number) => {
    setZoom((prev) => {
      const next = Number(Math.min(4, Math.max(1, prev + delta)).toFixed(2));
      setPan((p) => clampPan(p.x, p.y, next));
      if (next === 1) setActiveSector("island");
      return next;
    });
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setActiveSector("island");
  };

  const handleSelectSector = (preset: SectorPreset) => {
    setActiveSector(preset.id);
    setZoom(preset.zoom);
    if (preset.zoom === 1) {
      setPan({ x: 0, y: 0 });
      return;
    }
    const targetPanX = (SVG_WIDTH / 2 - preset.centerX) * preset.zoom;
    const targetPanY = (SVG_HEIGHT / 2 - preset.centerY) * preset.zoom;
    setPan(clampPan(targetPanX, targetPanY, preset.zoom));
  };

  const handleFocusOnBeach = (slug: string, shouldZoomIn = false, minZoom = 2.3) => {
    onSelectBeach(slug);
    const target = beaches.find((b) => b.beach.slug === slug);
    if (!target) return;
    if (shouldZoomIn || zoom > 1.3) {
      const targetZoom = Math.max(zoom, minZoom);
      const pt = projectLatLonToSvg(target.beach.lat, target.beach.lon);
      const panX = (SVG_WIDTH / 2 - pt.x) * targetZoom;
      const panY = (SVG_HEIGHT / 2 - pt.y) * targetZoom;
      setZoom(targetZoom);
      setPan(clampPan(panX, panY, targetZoom));
    }
  };

  const fallbackToCalmestBeach = () => {
    const bestSlug = bestSlugs[0];
    const fallbackBundle =
      (bestSlug && beaches.find((b) => b.beach.slug === bestSlug)) ||
      beaches.find((b) => b.statusColor === "green") ||
      beaches[0];
    if (fallbackBundle) {
      handleFocusOnBeach(fallbackBundle.beach.slug, true, 2.2);
      setLocationBanner(
        `Showing #1 calmest beach in Barbados right now: ${fallbackBundle.beach.name}`
      );
    }
    setIsLocating(false);
  };

  const handleFindNearestCalmBeach = () => {
    if (isLocating) return;
    setIsLocating(true);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      fallbackToCalmestBeach();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const distToIslandKm = haversineKm(
          lat,
          lon,
          BARBADOS_CENTER_LAT,
          BARBADOS_CENTER_LON
        );

        if (distToIslandKm > 60) {
          setUserLocation(null);
          fallbackToCalmestBeach();
          return;
        }

        setUserLocation({ lat, lon });

        const greenCandidates = beaches.filter((b) => b.statusColor === "green");
        const pool = greenCandidates.length > 0 ? greenCandidates : beaches;

        let closestBundle = pool[0];
        let minDistanceKm = Infinity;
        for (const candidate of pool) {
          const d = haversineKm(lat, lon, candidate.beach.lat, candidate.beach.lon);
          if (d < minDistanceKm) {
            minDistanceKm = d;
            closestBundle = candidate;
          }
        }

        if (closestBundle) {
          handleFocusOnBeach(closestBundle.beach.slug, true, 2.4);
          setLocationBanner(
            `Closest calm beach: ${closestBundle.beach.name} (${minDistanceKm.toFixed(
              1
            )} km away)`
          );
        }
        setIsLocating(false);
      },
      () => {
        setUserLocation(null);
        fallbackToCalmestBeach();
      },
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 60000,
      }
    );
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Only intercept wheel when holding Ctrl/Cmd or already zoomed in so normal page scroll never gets hijacked
    if (!e.ctrlKey && !e.metaKey && zoom <= 1.02) {
      return;
    }
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.35 : -0.35;
    handleZoomBy(delta);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (zoom <= 1.02) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan(clampPan(dragStartRef.current.panX + dx, dragStartRef.current.panY + dy, zoom));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Scale-compensate pins and labels when zoomed in so they stay crisp and separate cleanly
  const invScale = 1 / Math.pow(zoom, 0.65);

  const hudPlain = hudBundle ? plainStatusLabel(hudBundle) : null;
  const hudSeaweedText = hudBundle
    ? hudBundle.effectiveSargassumScore <= 15
      ? "Clear water"
      : hudBundle.effectiveSargassumScore <= 35
      ? "Light seaweed"
      : "Seaweed alert"
    : "";
  const hudDotClass =
    hudBundle?.statusColor === "green"
      ? "bg-emerald-400"
      : hudBundle?.statusColor === "amber"
      ? "bg-amber-400"
      : "bg-rose-400";

  const userSvgPt = userLocation
    ? projectLatLonToSvg(userLocation.lat, userLocation.lon)
    : null;

  return (
    <div className="relative flex flex-col rounded-sm border border-cyan-400/20 bg-[#050d17]/90 backdrop-blur-md overflow-hidden shadow-2xl">
      {/* Top Editorial Map Header Bar + Near Me Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#071320]/95 px-5 py-3.5">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300 block">
            Interactive Barbados Coast Map
          </span>
          <span className="text-xs text-slate-300">
            Hover or tap any beach pin for live water clarity and cameras
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleFindNearestCalmBeach}
            disabled={isLocating}
            className="inline-flex items-center gap-1.5 rounded-sm border border-cyan-300/45 bg-cyan-500/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950 disabled:opacity-60"
          >
            <LocateFixed className={`h-3.5 w-3.5 ${isLocating ? "animate-spin" : ""}`} />
            <span>{isLocating ? "Locating..." : "Find Nearest Calm Beach"}</span>
          </button>

          <div className="hidden sm:flex items-center gap-2.5 text-[11px] text-slate-300 border-l border-white/15 pl-3">
            <span>Swell: {dominantSwellLabel}</span>
            <span className="text-slate-600">·</span>
            <span>Breeze: {dominantWindLabel}</span>
          </div>
        </div>
      </div>

      {/* Coast Quick-Zoom Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#060f1a]/95 px-5 py-2.5">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Coast View:
          </span>
          {SECTOR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectSector(preset)}
              className={`pb-0.5 text-xs transition-colors border-b-2 ${
                activeSector === preset.id
                  ? "border-amber-300 text-white font-semibold"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Tactile Zoom Controls */}
        <div className="flex items-center rounded-sm border border-white/15 bg-[#071320] overflow-hidden">
          <button
            type="button"
            onClick={() => handleZoomBy(-0.45)}
            disabled={zoom <= 1}
            title="Zoom Out"
            className="p-1.5 text-slate-300 hover:bg-white/5 hover:text-white disabled:opacity-35"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="border-x border-white/10 px-2.5 text-xs font-semibold tabular-nums text-amber-300">
            {zoom.toFixed(1)}x
          </span>
          <button
            type="button"
            onClick={() => handleZoomBy(0.45)}
            disabled={zoom >= 4}
            title="Zoom In"
            className="p-1.5 text-slate-300 hover:bg-white/5 hover:text-white disabled:opacity-35"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          {zoom > 1 && (
            <button
              type="button"
              onClick={handleResetView}
              title="Reset Full Island View"
              className="border-l border-white/10 px-2 py-1 text-xs text-slate-300 hover:bg-white/5 hover:text-white"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Zoomable & Pannable SVG Nautical Chart */}
      <div
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`relative flex h-[560px] sm:h-[620px] w-full items-center justify-center overflow-hidden select-none ${
          zoom > 1.02 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
        }`}
      >
        {/* Status Pill for Nearest Calm Beach Finder */}
        {locationBanner && (
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute top-3 left-3 right-3 sm:right-auto z-20 inline-flex items-center justify-between gap-3 rounded-sm border border-cyan-300/40 bg-[#041222]/90 px-3.5 py-2 text-xs text-cyan-100 backdrop-blur-md shadow-xl"
          >
            <span className="font-medium">{locationBanner}</span>
            <button
              type="button"
              onClick={() => setLocationBanner(null)}
              aria-label="Dismiss location notice"
              className="text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="h-full w-full max-w-[560px]"
          role="img"
          aria-label="Interactive Zoomable Barbados Nautical Telemetry Chart"
        >
          <defs>
            <linearGradient id="islandLandmass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#12283f" />
              <stop offset="55%" stopColor="#0c1c2e" />
              <stop offset="100%" stopColor="#081321" />
            </linearGradient>
            <linearGradient id="shallowShelfGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.06" />
            </linearGradient>
            <filter id="coastalSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Zoom & Pan Transform Group */}
          <g
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "280px 340px",
              transition: isDragging ? "none" : "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {/* Nautical Graticule Grid Lines */}
            <g stroke="rgba(148, 163, 184, 0.06)" strokeWidth={1 / zoom}>
              {[100, 200, 300, 400, 500, 600].map((y) => (
                <line key={`lat-${y}`} x1="0" y1={y} x2={SVG_WIDTH} y2={y} />
              ))}
              {[90, 190, 290, 390, 490].map((x) => (
                <line key={`lon-${x}`} x1={x} y1="0" x2={x} y2={SVG_HEIGHT} />
              ))}
            </g>

            {/* Animated Atlantic Trade-Swell Flow Indicators (East / Northeast Approach) */}
            <g stroke="rgba(56, 189, 248, 0.32)" fill="none" strokeWidth={1.4 / zoom}>
              <path
                d="M 485 165 Q 435 182 395 215"
                strokeDasharray="6 6"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="24"
                  to="0"
                  dur="2.8s"
                  repeatCount="indefinite"
                />
              </path>
              <path
                d="M 510 275 Q 465 292 430 322"
                strokeDasharray="6 6"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="24"
                  to="0"
                  dur="3.2s"
                  repeatCount="indefinite"
                />
              </path>
              <path
                d="M 435 555 Q 375 568 330 578"
                strokeDasharray="6 6"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="24"
                  to="0"
                  dur="3.4s"
                  repeatCount="indefinite"
                />
              </path>
              <text
                x="442"
                y="154"
                fill="rgba(125, 211, 252, 0.55)"
                stroke="none"
                fontFamily="ui-monospace, SFMono-Regular, monospace"
                fontSize={8 * invScale}
                letterSpacing="1.2"
              >
                TRADE SWELL
              </text>
            </g>

            {/* Outer Bathymetric Reef Contours (-100m and -20m Isobars) */}
            <path
              d={ISLAND_POLYGON_PATH}
              transform="translate(-18, -22) scale(1.065)"
              fill="none"
              stroke="rgba(45, 212, 191, 0.14)"
              strokeWidth={1 / zoom}
              strokeDasharray="4 4"
            />
            <path
              d={ISLAND_POLYGON_PATH}
              transform="translate(-9, -11) scale(1.032)"
              fill="url(#shallowShelfGlow)"
              stroke="rgba(45, 212, 191, 0.28)"
              strokeWidth={1 / zoom}
            />

            {/* Main Barbados Island Coastline with Warm Reef Glow */}
            <path
              d={ISLAND_POLYGON_PATH}
              fill="url(#islandLandmass)"
              stroke="#5eead4"
              strokeWidth={1.7 / Math.pow(zoom, 0.5)}
              filter="url(#coastalSoftGlow)"
            />

            {/* Parish Topography Labels */}
            <g
              fill="rgba(148, 163, 184, 0.36)"
              fontFamily="ui-monospace, SFMono-Regular, monospace"
              fontSize={9 * invScale}
              fontWeight="600"
              letterSpacing="1.5"
            >
              <text x="175" y="135">
                ST. LUCY
              </text>
              <text x="180" y="235">
                ST. PETER
              </text>
              <text x="265" y="265">
                ST. JOSEPH
              </text>
              <text x="165" y="345">
                ST. JAMES
              </text>
              <text x="335" y="395">
                ST. PHILIP
              </text>
              <text x="162" y="455">
                ST. MICHAEL
              </text>
              <text x="235" y="545">
                CHRIST CHURCH
              </text>
            </g>

            {/* Safe Pivot Route Line when an Amber/Red Beach is Selected */}
            {fromPt && toPt && pivotTarget && (
              <g>
                <path
                  d={`M ${fromPt.x} ${fromPt.y} Q ${
                    Math.min(fromPt.x, toPt.x) - 48
                  } ${(fromPt.y + toPt.y) / 2 + 22} ${toPt.x} ${toPt.y}`}
                  fill="none"
                  stroke="#2dd4bf"
                  strokeWidth={2 * invScale}
                  strokeDasharray={`${5 * invScale} ${4 * invScale}`}
                />
                <circle
                  cx={toPt.x}
                  cy={toPt.y}
                  r={13 * invScale}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={1.5 * invScale}
                />
              </g>
            )}

            {/* Pulsing User GPS Beacon when inside Barbados */}
            {userSvgPt && (
              <g transform={`translate(${userSvgPt.x}, ${userSvgPt.y})`}>
                <circle
                  r={14 * invScale}
                  fill="rgba(34, 211, 238, 0.18)"
                  stroke="#22d3ee"
                  strokeWidth={1.2 * invScale}
                >
                  <animate
                    attributeName="r"
                    values={`${9 * invScale};${18 * invScale};${9 * invScale}`}
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.85;0.2;0.85"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  r={4.5 * invScale}
                  fill="#22d3ee"
                  stroke="#04101e"
                  strokeWidth={1.5 * invScale}
                />
                <text
                  x={10 * invScale}
                  y={3 * invScale}
                  fontSize={9 * invScale}
                  fontWeight="700"
                  fill="#67e8f9"
                  stroke="#050b14"
                  strokeWidth={2.5 * invScale}
                  paintOrder="stroke"
                >
                  You
                </text>
              </g>
            )}

            {/* All 46 Barbados Beach Stations */}
            {beaches.map((item) => {
              const pt = projectLatLonToSvg(item.beach.lat, item.beach.lon);
              const isSelected = item.beach.slug === selectedSlug;
              const isHovered = item.beach.slug === hoveredSlug;
              const isPivotTarget = pivotTarget?.beach.slug === item.beach.slug;
              const isBestRightNow = bestSlugs.includes(item.beach.slug);
              const isInFilter = filteredSlugs.has(item.beach.slug);

              const pinFill =
                item.statusColor === "green"
                  ? "#10b981"
                  : item.statusColor === "amber"
                  ? "#f59e0b"
                  : "#f43f5e";

              const labelLeftSide = item.beach.coast === "West";
              // Anti-clutter rule: at 1x full-island view show selected, hovered, pivot target, and Top 3 Best beaches.
              // Progressively reveal filtered pins when zoomed in (>= 1.55x) or narrowed to <= 14 matches.
              const showLabel =
                isSelected ||
                isHovered ||
                isPivotTarget ||
                isBestRightNow ||
                zoom >= 1.55 ||
                (isInFilter && filteredSlugs.size <= 14);
              const shortName = item.beach.name.replace(/\s*\([^)]*\)/g, "");

              return (
                <g
                  key={item.beach.slug}
                  transform={`translate(${pt.x}, ${pt.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFocusOnBeach(item.beach.slug, false);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleFocusOnBeach(item.beach.slug, true);
                  }}
                  onMouseEnter={() => setHoveredSlug(item.beach.slug)}
                  onMouseLeave={() =>
                    setHoveredSlug((prev) => (prev === item.beach.slug ? null : prev))
                  }
                  className="cursor-pointer"
                  style={{ opacity: isInFilter || isSelected || isPivotTarget ? 1 : 0.22 }}
                >
                  <title>{`${item.beach.name} (${item.beach.parish} · ${item.beach.coast} Coast)`}</title>

                  {/* Selected Station Target Reticle */}
                  {isSelected && (
                    <circle
                      r={12 * invScale}
                      fill="rgba(20, 184, 166, 0.18)"
                      stroke="#2dd4bf"
                      strokeWidth={1.6 * invScale}
                    />
                  )}

                  {/* Larger invisible tap target so fingers can hit crowded pins */}
                  <circle r={11 * invScale} fill="transparent" />

                  {/* Best Right Now rank marker (gold square with rank number) */}
                  {isBestRightNow && (
                    <g transform={`translate(${-12 * invScale}, ${-14 * invScale})`}>
                      <rect
                        width={11 * invScale}
                        height={11 * invScale}
                        fill="#fcd34d"
                        stroke="#050b14"
                        strokeWidth={1 * invScale}
                      />
                      <text
                        x={5.5 * invScale}
                        y={8.6 * invScale}
                        textAnchor="middle"
                        fontSize={8 * invScale}
                        fontWeight="800"
                        fill="#050b14"
                      >
                        {bestSlugs.indexOf(item.beach.slug) + 1}
                      </text>
                    </g>
                  )}

                  {/* Station Marker Dot */}
                  <circle
                    r={(isSelected ? 7.8 : isHovered ? 7.2 : 6.0) * invScale}
                    fill={pinFill}
                    stroke="#050b14"
                    strokeWidth={1.5 * invScale}
                  />

                  {/* Camera Indicator Dot */}
                  {item.beach.hasLiveCam && (
                    <circle
                      cx={6 * invScale}
                      cy={-6 * invScale}
                      r={2.7 * invScale}
                      fill="#38bdf8"
                      stroke="#050b14"
                      strokeWidth={1 * invScale}
                    />
                  )}

                  {/* Station Label */}
                  {showLabel && (
                    <g
                      transform={`translate(${(labelLeftSide ? -11 : 11) * invScale}, ${
                        3.5 * invScale
                      })`}
                      textAnchor={labelLeftSide ? "end" : "start"}
                    >
                      <text
                        fontSize={(isSelected || isHovered ? 11.2 : 9.4) * invScale}
                        fontWeight={isSelected || isHovered ? "700" : "600"}
                        fill={isSelected || isHovered ? "#ffffff" : "#cbd5e1"}
                        stroke="#050b14"
                        strokeWidth={2.8 * invScale}
                        paintOrder="stroke"
                      >
                        {zoom >= 1.8 || isSelected || isHovered
                          ? item.beach.name
                          : shortName}
                        {(isSelected || isHovered) && ` · ${plainStatusLabel(item).text}`}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating Glass Interactive Preview HUD Overlay */}
        {hudBundle && hudPlain && (
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-80 z-20 rounded-sm border border-cyan-300/30 bg-[#04101e]/90 p-3.5 backdrop-blur-md shadow-2xl space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300 truncate">
                  {hudBundle.beach.parish} · {hudBundle.beach.coast} Coast
                </p>
                <h3 className="font-serif text-base font-bold text-white truncate">
                  {hudBundle.beach.name}
                </h3>
              </div>
              <span
                className={`mt-1 h-2.5 w-2.5 shrink-0 ${hudDotClass}`}
                title={hudPlain.text}
              />
            </div>

            <p className="text-xs text-slate-200 leading-snug">
              <span className={`font-bold ${statusToneClass(hudPlain.tone)}`}>
                {hudPlain.text}
              </span>
              <span className="text-slate-400">
                {" "}
                · {hudBundle.inshoreWaveM.toFixed(2)}m waves · {hudSeaweedText}
              </span>
            </p>

            <div className="flex items-center gap-2 pt-0.5">
              {hudBundle.beach.hasLiveCam ? (
                <button
                  type="button"
                  onClick={() => onOpenLiveCam(hudBundle.beach.slug)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-sm bg-amber-300 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-950 transition hover:bg-amber-200"
                >
                  <Video className="h-3.5 w-3.5" />
                  <span>Watch Live Cam</span>
                </button>
              ) : hudNearestCam ? (
                <button
                  type="button"
                  onClick={() => onOpenLiveCam(hudNearestCam.neighborBeach.slug)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-sm border border-cyan-300/40 bg-cyan-950/60 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-cyan-200 transition hover:bg-cyan-900/60"
                >
                  <Video className="h-3.5 w-3.5 text-amber-300" />
                  <span>Nearest Cam ({hudNearestCam.driveMins}m)</span>
                </button>
              ) : null}

              <Link
                href={`/beach/${hudBundle.beach.slug}`}
                className="rounded-sm border border-white/25 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white transition hover:border-amber-300 hover:text-amber-300 text-center"
              >
                Full Guide →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Key & Direct Camera Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#071320]/95 px-5 py-3.5 text-xs">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-200">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 bg-emerald-400" />
            <span>Calm &amp; clear</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 bg-amber-400" />
            <span>Gentle waves or light seaweed</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 bg-rose-400" />
            <span>Rough water or heavy seaweed</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-sky-300">
            <span className="h-2.5 w-2.5 bg-sky-400" />
            <span>Live camera</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-amber-200">
            <span className="h-3 w-3 bg-amber-300" />
            <span>Numbered = best right now</span>
          </span>
        </div>

        {selectedBundle?.beach.hasLiveCam ? (
          <button
            type="button"
            onClick={() => onOpenLiveCam(selectedBundle.beach.slug)}
            className="inline-flex items-center gap-1.5 rounded-sm bg-amber-300 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-950 transition hover:bg-amber-200"
          >
            <Video className="h-3.5 w-3.5" />
            <span>Watch Live Cam</span>
          </button>
        ) : nearestCam ? (
          <button
            type="button"
            onClick={() => onOpenLiveCam(nearestCam.neighborBeach.slug)}
            className="inline-flex items-center gap-1.5 rounded-sm border border-cyan-300/40 bg-cyan-950/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-200 transition hover:bg-cyan-900/60"
          >
            <Video className="h-3.5 w-3.5 text-amber-300" />
            <span>
              Nearest Cam: {nearestCam.neighborBeach.name.replace(/\s*\([^)]*\)/g, "")} (
              {nearestCam.driveMins}m)
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
