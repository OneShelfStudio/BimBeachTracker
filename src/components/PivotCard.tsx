"use client";

import { ArrowRight } from "lucide-react";
import { SafePivotRecommendation } from "@/lib/pivot";
import { BeachStatusColor } from "@/lib/scoring";

interface PivotCardProps {
  currentStatus: BeachStatusColor;
  pivot: SafePivotRecommendation | null;
  onSelectBeachSlug: (slug: string) => void;
}

export default function PivotCard({
  currentStatus,
  pivot,
  onSelectBeachSlug,
}: PivotCardProps) {
  if (!pivot) return null;

  const isUrgentPivot = currentStatus === "red" || currentStatus === "amber";

  return (
    <div className="border-l-2 border-amber-300 bg-white/[0.03] pl-4 py-3 pr-4 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
        {isUrgentPivot
          ? `Calm Water Nearby · ${pivot.estimatedDriveMinutes} Min Drive`
          : `Another Great Option · ${pivot.estimatedDriveMinutes} Mins Away`}
      </p>
      <p className="text-sm text-slate-200 leading-relaxed">
        {isUrgentPivot
          ? `If the breeze or surf here feels too lively today, head ${pivot.estimatedDriveMinutes} minutes over to ${pivot.target.beach.name} on the ${pivot.target.beach.coast} Coast for calm, sheltered water.`
          : `${pivot.target.beach.name} is just ${pivot.estimatedDriveMinutes} minutes down the road and is also calm and clear right now.`}
      </p>
      <button
        type="button"
        onClick={() => onSelectBeachSlug(pivot.target.beach.slug)}
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 hover:text-amber-200 underline underline-offset-4 pt-1"
      >
        <span>Switch to {pivot.target.beach.name}</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
