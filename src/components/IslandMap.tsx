"use client";

import { useRef, useState } from "react";
import { Maximize2, Minus, Plus, Video } from "lucide-react";
import { BeachTelemetryBundle } from "@/lib/openMeteo";
import { getNearestCameraNeighbor } from "@/lib/cameras";
import { plainStatusLabel } from "@/lib/scoring";

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

const BARBADOS_COAST_COORDS: [number, number][] = [
  [13.335, -59.614],
  [13.329, -59.592],
  [13.311, -59.574],
  [13.285, -59.563],
  [13.255, -59.548],
  [13.227, -59.532],
  [13.213, -59.522],
  [13.195, -59.498],
  [13.164, -59.432],
  [13.137, -59.424],
  [13.105, -59.444],
  [13.078, -59.476],
  [13.054, -59.504],
  [13.044, -59.527],
  [13.059, -59.541],
  [13.066, -59.569],
  [13.073, -59.589],
  [13.077, -59.611],
  [13.088, -59.612],
  [13.098, -59.619],
  [13.116, -59.628],
  [13.137, -59.636],
  [13.168, -59.640],
  [13.192, -59.642],
  [13.229, -59.643],
  [13.251, -59.644],
  [13.282, -59.648],
  [13.308, -59.652],
  [13.326, -59.635],
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
  { id: "island", label: "Full Island (1x)", zoom: 1, centerX: 280, centerY: 340 },
  { id: "platinum", label: "Platinum Coast (3x)", zoom: 3, centerX: 100, centerY: 300 },
  { id: "west", label: "West / Carlisle (2.2x)", zoom: 2.2, centerX: 130, centerY: 430 },
  { id: "south", label: "South Coast (2.5x)", zoom: 2.5, centerX: 215, centerY: 575 },
  { id: "east", label: "East Coast (2.1x)", zoom: 2.1, centerX: 390, centerY: 380 },
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
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(
    null
  );

  const selectedBundle =
    beaches.find((b) => b.beach.slug === selectedSlug) || beaches[0];
  const nearestCam =
    selectedBundle && !selectedBundle.beach.hasLiveCam
      ? getNearestCameraNeighbor(selectedBundle.beach.slug)
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

  const handleFocusOnBeach = (slug: string, shouldZoomIn = false) => {
    onSelectBeach(slug);
    const target = beaches.find((b) => b.beach.slug === slug);
    if (!target) return;
    if (shouldZoomIn || zoom > 1.3) {
      const targetZoom = Math.max(zoom, 2.3);
      const pt = projectLatLonToSvg(target.beach.lat, target.beach.lon);
      const panX = (SVG_WIDTH / 2 - pt.x) * targetZoom;
      const panY = (SVG_HEIGHT / 2 - pt.y) * targetZoom;
      setZoom(targetZoom);
      setPan(clampPan(panX, panY, targetZoom));
    }
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

  return (
    <div className="relative flex flex-col rounded-sm border border-white/15 bg-[#050b14] overflow-hidden shadow-xl">
      {/* Top Editorial Map Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#071320] px-5 py-3.5">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300 block">
            Interactive Barbados Coast Map
          </span>
          <span className="text-xs text-slate-300">
            Select any beach pin to view its live camera and water report
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-300">
          <span>Swell: {dominantSwellLabel}</span>
          <span className="text-slate-600">·</span>
          <span>Breeze: {dominantWindLabel}</span>
        </div>
      </div>

      {/* Coast Quick-Zoom Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#060f1a] px-5 py-2.5">
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
              {preset.label.replace(/\s*\([^)]*\)/, "")}
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
        className={`relative flex h-[540px] sm:h-[600px] w-full items-center justify-center overflow-hidden select-none ${
          zoom > 1.02 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
        }`}
      >
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="h-full w-full max-w-[560px]"
          role="img"
          aria-label="Interactive Zoomable Barbados Nautical Telemetry Chart"
        >
          <defs>
            <linearGradient id="islandLandmass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f2136" />
              <stop offset="100%" stopColor="#081321" />
            </linearGradient>
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
            <g stroke="rgba(148, 163, 184, 0.07)" strokeWidth={1 / zoom}>
              {[100, 200, 300, 400, 500, 600].map((y) => (
                <line key={`lat-${y}`} x1="0" y1={y} x2={SVG_WIDTH} y2={y} />
              ))}
              {[90, 190, 290, 390, 490].map((x) => (
                <line key={`lon-${x}`} x1={x} y1="0" x2={x} y2={SVG_HEIGHT} />
              ))}
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
              fill="rgba(20, 184, 166, 0.03)"
              stroke="rgba(45, 212, 191, 0.24)"
              strokeWidth={1 / zoom}
            />

            {/* Main Barbados Island Coastline */}
            <path
              d={ISLAND_POLYGON_PATH}
              fill="url(#islandLandmass)"
              stroke="#2dd4bf"
              strokeWidth={1.6 / Math.pow(zoom, 0.5)}
            />

            {/* Parish Topography Labels */}
            <g
              fill="rgba(148, 163, 184, 0.38)"
              fontFamily="ui-monospace, SFMono-Regular, monospace"
              fontSize={9.5 * invScale}
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

            {/* All 46 Barbados Beach Stations */}
            {beaches.map((item) => {
              const pt = projectLatLonToSvg(item.beach.lat, item.beach.lon);
              const isSelected = item.beach.slug === selectedSlug;
              const isHovered = item.beach.slug === hoveredSlug;
              const isPivotTarget = pivotTarget?.beach.slug === item.beach.slug;
              const isInFilter = filteredSlugs.has(item.beach.slug);

              const pinFill =
                item.statusColor === "green"
                  ? "#10b981"
                  : item.statusColor === "amber"
                  ? "#f59e0b"
                  : "#f43f5e";

              const labelLeftSide = item.beach.coast === "West";
              const showLabel =
                isSelected ||
                isHovered ||
                isPivotTarget ||
                zoom >= 1.65 ||
                (isInFilter && filteredSlugs.size <= 16) ||
                (isInFilter && Boolean(item.beach.mapAnchorLabel));
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
                  style={{ opacity: isInFilter || isSelected || isPivotTarget ? 1 : 0.25 }}
                >
                  <title>{`${item.beach.name} (${item.beach.parish} · ${item.beach.coast} Coast)`}</title>

                  {/* Selected Station Target Reticle */}
                  {isSelected && (
                    <circle
                      r={12 * invScale}
                      fill="rgba(20, 184, 166, 0.16)"
                      stroke="#2dd4bf"
                      strokeWidth={1.6 * invScale}
                    />
                  )}

                  {/* Larger invisible tap target so fingers can hit crowded pins */}
                  <circle r={11 * invScale} fill="transparent" />

                  {/* Best Right Now rank marker (gold square with rank number) */}
                  {bestSlugs.includes(item.beach.slug) && (
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
                    r={(isSelected ? 7.8 : isHovered ? 7.2 : 6.2) * invScale}
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
                        fontSize={(isSelected || isHovered ? 11.5 : 9.6) * invScale}
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
      </div>

      {/* Bottom Key & Direct Camera Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#071320] px-5 py-3.5 text-xs">
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
