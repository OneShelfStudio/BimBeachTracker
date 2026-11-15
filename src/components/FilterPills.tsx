"use client";

export type QuickFilterKey =
  | "all"
  | "best-swim"
  | "zero-sargassum"
  | "turtle-snorkel"
  | "kid-friendly"
  | "sunset-bars"
  | "surf-east"
  | "live-cam";

interface FilterPillsProps {
  activeFilter: QuickFilterKey;
  onSelectFilter: (filter: QuickFilterKey) => void;
  counts: Record<QuickFilterKey, number>;
}

const FILTER_TABS: {
  key: QuickFilterKey;
  label: string;
}[] = [
  { key: "all", label: "All 46 Beaches" },
  { key: "best-swim", label: "Calm Like a Pool" },
  { key: "zero-sargassum", label: "Clean / No Weed" },
  { key: "turtle-snorkel", label: "Turtles & Snorkel" },
  { key: "kid-friendly", label: "Toddlers & Kids" },
  { key: "sunset-bars", label: "Sunset & Bars" },
  { key: "surf-east", label: "Surf Breaks" },
  { key: "live-cam", label: "Live Cameras" },
];

export default function FilterPills({
  activeFilter,
  onSelectFilter,
  counts,
}: FilterPillsProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter beaches by what you want today"
      className="flex items-center gap-6 overflow-x-auto border-b border-white/15 pb-px no-scrollbar"
    >
      {FILTER_TABS.map(({ key, label }) => {
        const isActive = activeFilter === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectFilter(key)}
            className={`group relative shrink-0 pb-3.5 text-left transition-colors ${
              isActive
                ? "border-b-2 border-amber-300 text-white"
                : "border-b-2 border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="text-xs sm:text-sm font-medium tracking-wide">
              {label}
            </span>
            <span
              className={`ml-2 text-xs tabular-nums ${
                isActive ? "text-amber-300 font-semibold" : "text-slate-500"
              }`}
            >
              ({counts[key] ?? 0})
            </span>
          </button>
        );
      })}
    </div>
  );
}
