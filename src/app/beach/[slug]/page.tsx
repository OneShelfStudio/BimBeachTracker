import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  MessageCircle,
  Navigation,
  Wind,
} from "lucide-react";
import { BARBADOS_BEACHES, getBeachBySlug } from "@/lib/beaches";
import { getCamerasForBeach, getNearestCameraNeighbor } from "@/lib/cameras";
import { getIslandConditionsPayload } from "@/lib/openMeteo";
import { getPartnerForBeach } from "@/lib/sponsors";
import { analyzeWindSurfaceEffect, predictInshoreWave } from "@/lib/scoring";
import AdUnit from "@/components/AdUnit";

export const revalidate = 300;

export function generateStaticParams() {
  return BARBADOS_BEACHES.map((beach) => ({ slug: beach.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const beach = getBeachBySlug(params.slug);
  if (!beach) return {};

  const url = `https://www.digital-dads-llc.com/beach/${beach.slug}`;
  const title = `${beach.name} (${beach.parish}, Barbados) | Live Beach Cameras, Sargassum & Tide Report`;
  const description = `Check live water conditions, sargassum seaweed levels, daily high & low tide times, and live beach cameras at ${beach.name} on the ${beach.coast} Coast of Barbados. ${beach.description}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "BimBeachTracker by Digital Dads LLC",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BeachStationDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const beach = getBeachBySlug(slug);
  if (!beach) {
    notFound();
  }

  const payload = await getIslandConditionsPayload();
  const telemetry =
    payload.beaches.find((b) => b.beach.slug === slug) || payload.beaches[0];
  const cameras = getCamerasForBeach(slug);
  const nearestCam = cameras.length === 0 ? getNearestCameraNeighbor(slug) : null;
  const pivot = telemetry.pivotRecommendation;
  const partner = getPartnerForBeach(beach.slug, beach.name);

  const friendlyWater =
    telemetry.inshoreWaveM <= 0.25
      ? "Calm like a swimming pool today"
      : telemetry.inshoreWaveM <= 0.5
      ? "Gentle nearshore swimming waves"
      : "Wavy / surf conditions today";

  const friendlySeaweed =
    telemetry.effectiveSargassumScore <= 15
      ? "Shoreline and water are clear of seaweed"
      : telemetry.effectiveSargassumScore <= 35
      ? "Light seaweed patches along the sand"
      : "Noticeable seaweed today";

  const windAnalysis = analyzeWindSurfaceEffect(
    beach,
    telemetry.marine.windDirectionDeg,
    telemetry.marine.windSpeedKmh
  );

  return (
    <div className="relative z-10 min-h-screen bg-[#040a12] px-5 py-10 sm:px-6 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Back Link */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
          <Link
            href="/bim-beach-tracker"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-300 hover:text-amber-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Barbados Beach Guide</span>
          </Link>

          <span className="text-xs text-slate-400">
            {beach.parish} · {beach.coast} Coast · Updated {payload.astDisplayTime}
          </span>
        </div>

        {/* Hero Beach Guide Card */}
        <div className="rounded-sm border border-white/15 bg-[#06101b] p-6 sm:p-10 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                {beach.parish} · {beach.coast} Coast
              </p>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white">
                {beach.name}
              </h1>
              {beach.vibeTag && (
                <p className="text-sm font-medium text-amber-200">
                  {beach.vibeTag}
                </p>
              )}
              <p className="pt-2 max-w-2xl text-sm sm:text-base text-slate-200 font-light leading-relaxed">
                {beach.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${beach.lat},${beach.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-sm bg-amber-300 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-950 shadow-lg transition hover:bg-amber-200"
              >
                <Navigation className="h-4 w-4" />
                <span>Directions</span>
              </a>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Barbados Beach Update for ${beach.name}:\n\n` +
                  `* Status: ${friendlyWater} (${friendlySeaweed})\n` +
                  `* Coast: ${beach.coast} (${beach.parish})\n` +
                  `* Next Tide: ${payload.tideSchedule.nextTideSummary}\n\n` +
                  `Check live conditions and cameras:\nhttps://www.digital-dads-llc.com/beach/${beach.slug}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-sm border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-xs font-bold uppercase tracking-widest text-emerald-300 shadow-lg transition hover:bg-emerald-900/50 hover:border-emerald-400"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Conversational Water & Beach Check */}
          <div className="border-t border-b border-white/15 py-5 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-widest text-amber-300">
                Swimming &amp; Waves
              </span>
              <p className="mt-1 font-serif text-xl font-bold text-white">
                {friendlyWater}
              </p>
            </div>

            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-widest text-amber-300">
                Seaweed &amp; Sand
              </span>
              <p className="mt-1 font-serif text-xl font-bold text-emerald-300">
                {friendlySeaweed}
              </p>
            </div>

            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-widest text-amber-300">
                Next Tide Today
              </span>
              <p className="mt-1 font-serif text-lg font-bold text-white">
                {payload.tideSchedule.nextTideSummary}
              </p>
            </div>
          </div>

          {/* Wind Surface & Wave Groom Engine (Offshore vs Onshore) */}
          <div className="rounded-sm border border-white/10 bg-[#040e1b] p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-cyan-300" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                  Wind &amp; Water Surface
                </span>
              </div>
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-sm border ${
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
          {payload.hourlyForecast && payload.hourlyForecast.length > 0 && (
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
                {payload.hourlyForecast.slice(0, 16).map((pt, idx) => {
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

          {/* Today's Exact High & Low Tides Strip */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <span className="font-bold uppercase tracking-wider text-cyan-300">
                Today&apos;s High &amp; Low Tides ({payload.tideSchedule.dateLabel})
              </span>
              <span>
                Sunrise: {payload.tideSchedule.sunrise} · Sunset: {payload.tideSchedule.sunset}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-l border-white/15 bg-[#040c16]">
              {payload.tideSchedule.events.map((ev, idx) => (
                <div key={idx} className="border-r border-b border-white/15 p-3 text-center">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest block ${
                      ev.state === "High" ? "text-cyan-300" : "text-amber-300"
                    }`}
                  >
                    {ev.state} Tide
                  </span>
                  <span className="mt-1 block text-base font-bold text-white">{ev.time}</span>
                  <span className="mt-0.5 block text-[11px] text-slate-400">
                    {ev.heightM} ({ev.heightFt})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Known For & Amenities as Plain Editorial Text */}
          {(beach.bestFor?.length || beach.amenities?.length) && (
            <div className="space-y-1.5 text-xs sm:text-sm text-slate-300">
              {beach.bestFor && beach.bestFor.length > 0 && (
                <p>
                  <strong className="text-amber-300 uppercase tracking-wider text-xs">
                    Known For:{" "}
                  </strong>
                  {beach.bestFor.join(" · ")}
                </p>
              )}
              {beach.amenities && beach.amenities.length > 0 && (
                <p>
                  <strong className="text-slate-400 uppercase tracking-wider text-xs">
                    On the Beach:{" "}
                  </strong>
                  {beach.amenities.join(" · ")}
                </p>
              )}
            </div>
          )}

          {/* Nearby Alternative Beach Recommendation */}
          {pivot && (
            <div className="border-l-2 border-amber-300 bg-white/[0.03] pl-4 py-3 pr-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
                  Nearby Calm Option · {pivot.estimatedDriveMinutes} Min Drive
                </span>
                <p className="mt-0.5 text-sm font-bold text-white">
                  {pivot.target.beach.name} ({pivot.target.beach.coast} Coast)
                </p>
              </div>
              <Link
                href={`/beach/${pivot.target.beach.slug}`}
                className="text-xs font-bold uppercase tracking-wider text-amber-300 hover:text-amber-200 underline underline-offset-4"
              >
                View {pivot.target.beach.name} →
              </Link>
            </div>
          )}
        </div>

        <AdUnit
          slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BEACH_SLUG || process.env.NEXT_PUBLIC_ADSENSE_SLOT_BEACH_TOP || "4800798822"}
          variant="beach"
          label="Sponsored"
        />

        {/* Live Beach Cameras (or Nearest Neighboring Camera) */}
        {cameras.length > 0 ? (
          <div className="rounded-sm border border-white/15 bg-[#06101b] p-6 sm:p-8 space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                Real-Time View
              </p>
              <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-white">
                Live Beach Cameras at {beach.name} ({cameras.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {cameras.map((cam) => (
                <div
                  key={cam.id}
                  className="overflow-hidden rounded-sm border border-white/15 bg-black"
                >
                  <div className="aspect-video w-full bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cam.snapshotUrl}
                      alt={cam.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 text-xs">
                    <div>
                      <span className="font-bold text-white block">
                        {cam.viewAngleLabel || cam.name}
                      </span>
                      <span className="text-slate-400">
                        Live feed via {cam.provider}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                      ● Live Feed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : nearestCam ? (
          <div className="rounded-sm border border-white/15 bg-[#06101b] p-6 sm:p-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  Nearest Coast Camera · {nearestCam.driveMins} Min Drive ({nearestCam.distanceKm} km)
                </p>
                <h2 className="mt-1 font-serif text-2xl font-bold text-white">
                  Nearby Live View at {nearestCam.neighborBeach.name}
                </h2>
              </div>
              <Link
                href={`/beach/${nearestCam.neighborBeach.slug}`}
                className="text-xs font-bold uppercase tracking-wider text-amber-300 hover:text-amber-200 underline underline-offset-4"
              >
                View All Cameras at {nearestCam.neighborBeach.name} →
              </Link>
            </div>
            <div className="overflow-hidden rounded-sm border border-white/15 bg-black max-w-2xl">
              <div className="aspect-video w-full bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={nearestCam.primaryCamera.snapshotUrl}
                  alt={nearestCam.primaryCamera.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between p-4 text-xs">
                <div>
                  <span className="font-bold text-white block">
                    {nearestCam.primaryCamera.name}
                  </span>
                  <span className="text-slate-400">
                    Closest live camera along the {nearestCam.neighborBeach.coast} Coast
                  </span>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                  ● Live Feed
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Featured Local Beach Spot */}
        <div className="rounded-sm border border-white/15 bg-[#06101b] p-6 sm:p-8 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
            {partner.isSponsored
              ? `On the Sand · ${partner.category}`
              : "Local Beach Guide"}
          </span>
          <h3 className="font-serif text-2xl font-bold text-white">
            {partner.partnerName}
          </h3>
          <p className="text-sm text-slate-300 font-light leading-relaxed">
            {partner.perkOffer}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            {partner.priceHint && (
              <span className="text-xs font-medium text-amber-200">
                {partner.priceHint}
              </span>
            )}
            <a
              href={
                partner.isSponsored
                  ? partner.ctaUrl
                  : "mailto:ryanb@digital-dads-llc.com?subject=BimBeachTracker%20Local%20Listing"
              }
              target={partner.isSponsored ? "_blank" : undefined}
              rel={partner.isSponsored ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-1.5 rounded-sm bg-amber-300 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-950 transition hover:bg-amber-200"
            >
              <span>{partner.ctaLabel}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
