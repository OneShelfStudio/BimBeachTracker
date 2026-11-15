'use client'

import Link from 'next/link'
import BarbadosFlag from '@/components/BarbadosFlag'

interface AdUnitProps {
  slot?: string
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal'
  label?: string
  className?: string
  minHeight?: string
  variant?: 'default' | 'beach' | 'game' | 'evermark'
}

export default function AdUnit({
  label = 'Partner Spotlight',
  className = '',
  minHeight = 'min-h-[96px]',
  variant = 'default',
}: AdUnitProps) {
  return (
    <aside
      aria-label="Partner Spotlight"
      className={`w-full my-6 rounded-xl border border-white/15 bg-[#0a101d]/90 backdrop-blur-md overflow-hidden shadow-lg transition-all ${className}`}
    >
      <div className="px-4 py-1.5 border-b border-white/10 bg-black/30 flex items-center justify-between text-[11px] text-slate-400">
        <span className="font-semibold uppercase tracking-wider text-amber-300/90 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>{label}</span>
        </span>
        <span className="text-slate-400">
          {variant === 'beach'
            ? 'Barbados Coastal Partner Spotlight'
            : variant === 'game'
            ? 'One Shelf Studio • Creative Showcase'
            : variant === 'evermark'
            ? 'Client Spotlight • Evermark Prints'
            : 'Digital Dads Network'}
        </span>
      </div>

      <div className={`relative w-full flex flex-col items-center justify-center p-3 ${minHeight}`}>
        <div className="relative z-10 w-full px-3 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
          {variant === 'beach' ? (
            <>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-serif font-bold text-white flex items-center gap-1.5 flex-wrap">
                  <BarbadosFlag />
                  <span>Run a Beach Bar, Chair Rental, Catamaran Tour, or Restaurant in Barbados?</span>
                </p>
                <p className="text-xs text-slate-300">
                  Feature your business right on BimBeachTracker for locals &amp; visitors checking the water today.
                </p>
              </div>
              <a
                href="https://wa.me/12468508210?text=Hi%20Ryan!%20I'd%20like%20to%20feature%20my%20business%20on%20BimBeachTracker."
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-4 py-2 rounded-sm bg-amber-300 hover:bg-amber-200 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-md"
              >
                Sponsor a Beach Page →
              </a>
            </>
          ) : variant === 'game' ? (
            <>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-serif font-bold text-white">
                  ✨ Enjoying Orbital Drift? Explore Our Full Mobile &amp; Classroom Suites
                </p>
                <p className="text-xs text-slate-300">
                  Play on Android via Google Play or launch The EQ: 10-in-1 Interactive Music Studio in your browser.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <a
                  href="https://play.google.com/store/apps/dev?id=6988645757407817696"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition"
                >
                  Google Play Apps ↗
                </a>
                <Link
                  href="/apps"
                  className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs transition"
                >
                  Web Apps Hub →
                </Link>
              </div>
            </>
          ) : variant === 'evermark' ? (
            <>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-serif font-bold text-[#f7f4ef]">
                  🎨 Evermark Prints: Custom Merch, Bulk DTF Transfers &amp; Personalized Gifts
                </p>
                <p className="text-xs text-slate-300">
                  Explore our client storefront featuring interactive live product previews and wholesale custom printing.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <a
                  href="https://www.evermarkprints.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition shadow-md"
                >
                  Visit evermarkprints.com ↗
                </a>
                <Link
                  href="/#partners"
                  className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-[#f7f4ef] font-semibold text-xs transition"
                >
                  View Client Builds →
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-serif font-bold text-[#f7f4ef]">
                  🚀 Need a Custom Website, Booking System, or 5-Second Phone Controls?
                </p>
                <p className="text-xs text-slate-300">
                  100% code ownership, tailored project quotes, and optional hands-on monthly care, built between the US &amp; Barbados.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link
                  href="/demos"
                  className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition shadow-md"
                >
                  Try Live Storefronts →
                </Link>
                <Link
                  href="/forms"
                  className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-[#f7f4ef] font-semibold text-xs transition"
                >
                  Get a Quote
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
