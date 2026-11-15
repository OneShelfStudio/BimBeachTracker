"use client";

import { useEffect } from "react";
import { AlertTriangle, Phone, Shield, X } from "lucide-react";

interface SafetyDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMERGENCY_CONTACTS = [
  {
    role: "Barbados Coast Guard (Marine Rescue)",
    phone: "+1-246-536-2500",
    altPhone: "+1-246-427-8819",
    radio: "VHF Marine Channel 16",
    badge: "24/7 Marine Search & Rescue",
    tone: "border-cyan-500/40 bg-cyan-950/30 text-cyan-200",
  },
  {
    role: "Police Emergency",
    phone: "211",
    altPhone: "+1-246-430-7100",
    radio: "Toll-Free Islandwide",
    badge: "Emergency Dispatch",
    tone: "border-blue-500/40 bg-blue-950/30 text-blue-200",
  },
  {
    role: "Ambulance / Emergency Medical",
    phone: "511",
    altPhone: "+1-246-436-6450",
    radio: "QEH Emergency Department",
    badge: "Medical Emergency",
    tone: "border-rose-500/40 bg-rose-950/30 text-rose-200",
  },
  {
    role: "NCC Lifeguard Headquarters",
    phone: "+1-246-425-1200",
    altPhone: null,
    radio: "Daily 9:00 AM - 5:00 PM AST",
    badge: "Public Beach Lifeguards",
    tone: "border-amber-500/40 bg-amber-950/30 text-amber-200",
  },
];

export default function SafetyDirectoryModal({
  isOpen,
  onClose,
}: SafetyDirectoryModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Barbados Coastal Safety and Emergency Directory"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
    >
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-sm border border-white/20 bg-[#05111f] p-6 text-slate-100 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 rounded-sm border border-white/15 bg-white/5 p-1.5 text-slate-300 hover:border-white hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-rose-400">
          <Shield className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-[0.2em]">
            Safety &amp; Emergency Guide
          </span>
        </div>

        <h2 className="mt-1 font-serif text-2xl font-bold text-white">
          Barbados Coastal Emergency Directory
        </h2>
        <p className="mt-1.5 text-xs text-slate-300 font-light leading-relaxed">
          Keep these official Barbados emergency contacts handy while on the water. Tap any number below to call directly.
        </p>

        {/* Contacts Grid */}
        <div className="mt-5 space-y-3">
          {EMERGENCY_CONTACTS.map((item, idx) => (
            <div
              key={idx}
              className={`rounded-sm border p-3.5 space-y-2 ${item.tone}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  {item.role}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-sm bg-black/40 border border-white/10 text-slate-300">
                  {item.badge}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={`tel:${item.phone.replace(/[^0-9+]/g, "")}`}
                  className="inline-flex items-center gap-1.5 rounded-sm bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-950 hover:bg-amber-300 transition shadow"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Call {item.phone}</span>
                </a>

                {item.altPhone && (
                  <a
                    href={`tel:${item.altPhone.replace(/[^0-9+]/g, "")}`}
                    className="inline-flex items-center gap-1 rounded-sm border border-white/20 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-white hover:text-white transition"
                  >
                    <span>Alt: {item.altPhone}</span>
                  </a>
                )}

                <span className="text-[11px] text-slate-400 italic ml-auto">
                  {item.radio}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Official Coastal Flag Legend */}
        <div className="mt-6 rounded-sm border border-white/10 bg-[#030a13] p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              NCC Beach Warning Flag System
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-start gap-2 border-l-2 border-emerald-400 pl-2 py-0.5">
              <div>
                <strong className="text-emerald-300 block">Green Flag</strong>
                <span className="text-slate-300">Calm water. Safe for swimming and wading.</span>
              </div>
            </div>

            <div className="flex items-start gap-2 border-l-2 border-amber-400 pl-2 py-0.5">
              <div>
                <strong className="text-amber-300 block">Yellow Flag</strong>
                <span className="text-slate-300">Caution. Light chop, currents, or undertow.</span>
              </div>
            </div>

            <div className="flex items-start gap-2 border-l-2 border-rose-500 pl-2 py-0.5">
              <div>
                <strong className="text-rose-300 block">Red Flag</strong>
                <span className="text-slate-300">Hazardous. No swimming. Strong rip currents.</span>
              </div>
            </div>

            <div className="flex items-start gap-2 border-l-2 border-purple-400 pl-2 py-0.5">
              <div>
                <strong className="text-purple-300 block">Purple Flag</strong>
                <span className="text-slate-300">Marine pests present (jellyfish or heavy sargassum).</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-white/20 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-200 hover:border-white hover:text-white transition"
          >
            Close Directory
          </button>
        </div>
      </div>
    </div>
  );
}
