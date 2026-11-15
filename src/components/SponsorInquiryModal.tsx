"use client";

import { useEffect, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { BARBADOS_BEACHES } from "@/lib/beaches";

interface SponsorInquiryModalProps {
  isOpen: boolean;
  defaultBeachSlug: string;
  onClose: () => void;
}

export default function SponsorInquiryModal({
  isOpen,
  defaultBeachSlug,
  onClose,
}: SponsorInquiryModalProps) {
  const [selectedSlug, setSelectedSlug] = useState(defaultBeachSlug || "pebbles-beach");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("Beach Bar / Restaurant");
  const [offerText, setOfferText] = useState("");

  useEffect(() => {
    if (defaultBeachSlug) {
      setSelectedSlug(defaultBeachSlug);
    }
  }, [defaultBeachSlug, isOpen]);

  if (!isOpen) return null;

  const beach =
    BARBADOS_BEACHES.find((b) => b.slug === selectedSlug) || BARBADOS_BEACHES[0];

  const mailtoSubject = encodeURIComponent(
    `BimBeachTracker Local Business Listing: ${beach.name}`
  );
  const rawMessage = `Beach Location: ${beach.name} (${beach.coast} Coast)\nBusiness Name: ${
    businessName || "[Your Business Name]"
  }\nCategory: ${businessType}\nWhat Beachgoers Should Know: ${
    offerText || "[e.g. Chair & Umbrella Rentals, Fresh Fish Cutters, Happy Hour Rum Punch]"
  }\n\nPlease send details for featuring our business on the Barbados Beach Guide.`;
  const mailtoBody = encodeURIComponent(rawMessage);
  const whatsappUrl = `https://wa.me/12468508210?text=${encodeURIComponent(
    `Hi Ryan! I'd like to list my beach business on BimBeachTracker:\n\n${rawMessage}`
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-sm border border-white/15 bg-[#06101b] p-6 sm:p-8 shadow-2xl">
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
              Local Beach Guide Directory
            </p>
            <h3 className="mt-1 font-serif text-2xl font-bold text-white">
              List Your Spot Near {beach.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-xs text-slate-200">
          <p className="leading-relaxed text-slate-300 text-sm">
            Run a beach bar, fish cutter van, chair rental, or snorkel boat in Barbados? We feature one local spot on each beach guide so visitors know where to eat, drink, and rent loungers once they check the water.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Beach Location
              </label>
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="mt-1.5 w-full rounded-sm border border-white/15 bg-[#0a1828] px-3 py-2.5 text-xs font-medium text-white"
              >
                {BARBADOS_BEACHES.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.name} ({b.coast} Coast)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                What You Offer
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="mt-1.5 w-full rounded-sm border border-white/15 bg-[#0a1828] px-3 py-2.5 text-xs font-medium text-white"
              >
                <option>Beach Bar / Restaurant</option>
                <option>Chair &amp; Umbrella Rental</option>
                <option>Local Food Truck / Cutters</option>
                <option>Catamaran / Turtle Snorkel</option>
                <option>Surf / Watersports Lessons</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Your Business Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g., Cuzz's Fish Stand, Blakey's on the Boardwalk, Savvy on the Bay"
              className="mt-1.5 w-full rounded-sm border border-white/15 bg-[#0a1828] px-3 py-2.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              What Should Beachgoers Know About Your Spot?
            </label>
            <input
              type="text"
              value={offerText}
              onChange={(e) => setOfferText(e.target.value)}
              placeholder="e.g., 2 Beach Loungers + Umbrella for $20, or Fresh Marlin Cutters"
              className="mt-1.5 w-full rounded-sm border border-white/15 bg-[#0a1828] px-3 py-2.5 text-xs text-white"
            />
          </div>

          <div className="pt-3 flex flex-col sm:flex-row gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-sm bg-emerald-400 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-950 transition hover:bg-emerald-300"
            >
              <span>WhatsApp (246) 850-8210</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href={`mailto:ryanb@digital-dads-llc.com?subject=${mailtoSubject}&body=${mailtoBody}`}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-sm bg-amber-300 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-950 transition hover:bg-amber-200"
            >
              <span>Send via Email</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
