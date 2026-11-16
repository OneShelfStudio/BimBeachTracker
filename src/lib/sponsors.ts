export interface BeachPartnerConfig {
  beachSlug: string;
  beachLabel?: string;
  partnerName: string;
  category:
    | "Beach Club & Dining"
    | "Local Fish Cutter Legend"
    | "Catamaran & Snorkel"
    | "Surf & Kite School"
    | "Chair & Umbrella Rental"
    | "East Coast Dining"
    | "Available Slot";
  headline: string;
  perkOffer: string;
  priceHint?: string;
  ctaLabel: string;
  ctaUrl: string;
  isSponsored: boolean;
  monthlyRateUsd: number;
}

export const BEACH_PARTNERS: Record<string, BeachPartnerConfig> = {};

export function getPartnerForBeach(
  beachSlug: string,
  beachName: string
): BeachPartnerConfig {
  return (
    BEACH_PARTNERS[beachSlug] || {
      beachSlug,
      beachLabel: beachName,
      partnerName: `Feature Your Business on ${beachName}`,
      category: "Available Slot",
      headline: `Operate a beach bar, chair rental, watersports tour, or local spot near ${beachName}?`,
      perkOffer: `Put your business right here where locals and visitors check live conditions before heading out. Reach customers at the exact moment they plan their beach day.`,
      priceHint: "1-business-per-beach spotlight",
      ctaLabel: "List Your Business Here",
      ctaUrl: `https://wa.me/12468508210?text=Hi%20Ryan!%20I%20run%20a%20business%20near%20${encodeURIComponent(beachName)}%20and%20want%20to%20get%20featured%20on%20BimBeachTracker.com.`,
      isSponsored: false,
      monthlyRateUsd: 200,
    }
  );
}

export function getFeaturedPartnersList(): BeachPartnerConfig[] {
  return Object.values(BEACH_PARTNERS);
}
