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

export const BEACH_PARTNERS: Record<string, BeachPartnerConfig> = {
  "pebbles-beach": {
    beachSlug: "pebbles-beach",
    beachLabel: "Pebbles Beach · Carlisle Bay",
    partnerName: "Cuzz's Fish Stand & Savvy on the Bay",
    category: "Local Fish Cutter Legend",
    headline: "Famous Marlin Cheese Cutters & Shaded Beach Loungers",
    perkOffer:
      "Grab Barbados' most famous marlin and egg cheese cutter right off the sand at Cuzz's, or rent padded loungers and umbrellas with food truck service at Savvy on the Bay.",
    priceHint: "Cutters ~$15 BDS · Loungers & food trucks on the sand",
    ctaLabel: "Get Directions to Pebbles",
    ctaUrl:
      "https://www.google.com/maps/search/?api=1&query=Cuzzs+Fish+Stand+Pebbles+Beach+Barbados",
    isSponsored: true,
    monthlyRateUsd: 250,
  },
  "brownes-beach": {
    beachSlug: "brownes-beach",
    beachLabel: "Browne's Beach · Carlisle Bay",
    partnerName: "Carlisle Bay Shipwreck & Turtle Snorkel Boats",
    category: "Catamaran & Snorkel",
    headline: "Shipwreck & Sea Turtle Snorkel Right Off Carlisle Bay",
    perkOffer:
      "Swim over 6 sunken shipwrecks in Carlisle Bay Marine Park and spot resident sea turtles in calm, clear water.",
    priceHint: "Departures daily from Carlisle Bay",
    ctaLabel: "View Carlisle Bay Location",
    ctaUrl:
      "https://www.google.com/maps/search/?api=1&query=Brownes+Beach+Carlisle+Bay+Barbados",
    isSponsored: true,
    monthlyRateUsd: 250,
  },
  "accra-beach": {
    beachSlug: "accra-beach",
    beachLabel: "Accra / Rockley Beach",
    partnerName: "De Rock Beach Bar & Accra Food Kiosks",
    category: "Beach Club & Dining",
    headline: "Fish Cutters, Grilled Lunch, Rum Punch & Lounger Rentals",
    perkOffer:
      "Steps from the central lifeguard tower and the calm southern rock-groyne pool. Grab cold Banks beer, rum punch, Bajan lunch plates, and shaded beach chairs.",
    priceHint: "Right on Accra beachfront by the Boardwalk start",
    ctaLabel: "Directions to Accra Beach",
    ctaUrl:
      "https://www.google.com/maps/search/?api=1&query=Accra+Beach+Rockley+Barbados",
    isSponsored: true,
    monthlyRateUsd: 250,
  },
  "hastings-rocks": {
    beachSlug: "hastings-rocks",
    beachLabel: "Hastings & South Coast Boardwalk",
    partnerName: "Blakey's on the Boardwalk",
    category: "Beach Club & Dining",
    headline: "Waterfront Dining, Cold Drinks & Live Music on the Boardwalk",
    perkOffer:
      "Casual open-air deck right on the Richard Haynes Boardwalk overlooking the calm Hastings breakwater pools.",
    priceHint: "Open for lunch, sunset drinks & dinner",
    ctaLabel: "Directions to Blakey's",
    ctaUrl:
      "https://www.google.com/maps/search/?api=1&query=Blakeys+on+the+Boardwalk+Barbados",
    isSponsored: true,
    monthlyRateUsd: 250,
  },
  "miami-beach": {
    beachSlug: "miami-beach",
    beachLabel: "Miami Beach (Enterprise) · Oistins",
    partnerName: "Mr. Delicious Snack Bar & Enterprise Chairs",
    category: "Local Fish Cutter Legend",
    headline: "Ice-Cold Banks Beer, Bajan Fish Cakes & Shaded Casuarina Trees",
    perkOffer:
      "Parked under the shady casuarina trees by the calm West (Oistins breakwater) swimming side. Grab fish cakes, flying-fish cutters, and beach chairs.",
    priceHint: "West cove by Oistins breakwater",
    ctaLabel: "Directions to Miami Beach",
    ctaUrl:
      "https://www.google.com/maps/search/?api=1&query=Miami+Beach+Oistins+Barbados",
    isSponsored: true,
    monthlyRateUsd: 250,
  },
  "brandons-beach": {
    beachSlug: "brandons-beach",
    beachLabel: "Brandons Beach · Spring Garden",
    partnerName: "Rascals & The Seafood Shack at Brandons",
    category: "Beach Club & Dining",
    headline: "Calm West Coast Swimming, Seafood & Inflatable Waterpark",
    perkOffer:
      "Spend the day on the calm West Coast along Spring Garden Highway with fresh local seafood, beach loungers, and family water activities.",
    priceHint: "Mighty Grynner Highway (Spring Garden), St. Michael",
    ctaLabel: "Directions to Brandons Beach",
    ctaUrl:
      "https://www.google.com/maps/search/?api=1&query=Rascals+Brandons+Beach+Barbados",
    isSponsored: true,
    monthlyRateUsd: 250,
  },
  "batts-rock": {
    beachSlug: "batts-rock",
    beachLabel: "Batts Rock · West Coast",
    partnerName: "La Cabane Barbados",
    category: "Beach Club & Dining",
    headline: "Toes-in-the-Sand West Coast Lunch & Sunset Cocktails",
    perkOffer:
      "Grilled catch of the day, cocktails, and beachfront tables shaded by coastal trees overlooking calm West Coast snorkeling reefs.",
    priceHint: "Open daily for lunch & sunset drinks",
    ctaLabel: "Directions to La Cabane",
    ctaUrl:
      "https://www.google.com/maps/search/?api=1&query=La+Cabane+Batts+Rock+Barbados",
    isSponsored: true,
    monthlyRateUsd: 250,
  },
  "freights-bay": {
    beachSlug: "freights-bay",
    beachLabel: "Freights Bay & Dover · South Coast",
    partnerName: "Barry's Surf Barbados & Dread or Dead Surf Shop",
    category: "Surf & Kite School",
    headline: "Learn to Surf on Barbados' Classic South Coast Rollers",
    perkOffer:
      "Beginner and intermediate surf lessons plus longboard and soft-top rentals for Freights Bay and Dover.",
    priceHint: "All ages & first-timers welcome",
    ctaLabel: "View South Coast Surf Map",
    ctaUrl:
      "https://www.google.com/maps/search/?api=1&query=Barrys+Surf+Barbados+Dover",
    isSponsored: true,
    monthlyRateUsd: 200,
  },
  bathsheba: {
    beachSlug: "bathsheba",
    beachLabel: "Bathsheba · Soup Bowl (East Coast)",
    partnerName: "The Round House & Dina's Bar at Bathsheba",
    category: "East Coast Dining",
    headline: "Cliffside Bajan Lunch & Rum Punch Overlooking Soup Bowl",
    perkOffer:
      "Watch surfers at Soup Bowl over a traditional Bajan lunch, fish cakes, and cold drinks right on the St. Joseph coast.",
    priceHint: "Overlooking Bathsheba park & Soup Bowl",
    ctaLabel: "Directions to Bathsheba",
    ctaUrl:
      "https://www.google.com/maps/search/?api=1&query=Round+House+Bathsheba+Barbados",
    isSponsored: true,
    monthlyRateUsd: 200,
  },
  "oistins-bay": {
    beachSlug: "oistins-bay",
    beachLabel: "Oistins Bay · South Coast",
    partnerName: "Oistins Bay Gardens Fish Fry (Pat's Place & Uncle George's)",
    category: "Local Fish Cutter Legend",
    headline: "Fresh Grilled Marlin, Mahi, Tuna & Lobster Right off the Boats",
    perkOffer:
      "Walk straight off Oistins Bay Beach into Bay Gardens for freshly grilled catch of the day, macaroni pie, and cold Banks beer.",
    priceHint: "Open daily for lunch & nightly Fish Fry",
    ctaLabel: "Directions to Oistins Bay Gardens",
    ctaUrl:
      "https://www.google.com/maps/search/?api=1&query=Oistins+Bay+Gardens+Barbados",
    isSponsored: true,
    monthlyRateUsd: 250,
  },
  "alleynes-bay": {
    beachSlug: "alleynes-bay",
    beachLabel: "Alleyne's Bay · Mount Standfast (West)",
    partnerName: "JuJu's Beach Bar & The Lone Star",
    category: "Beach Club & Dining",
    headline: "Laid-Back West Coast Rum Punch, Grilled Catch & Beach Loungers",
    perkOffer:
      "Grab a table under the palms right on the sand at JuJu's for flying fish, rum punch, and beach chair rentals overlooking calm turtle-swimming waters.",
    priceHint: "Mount Standfast, St. James",
    ctaLabel: "Directions to JuJu's at Alleyne's Bay",
    ctaUrl:
      "https://www.google.com/maps/search/?api=1&query=JuJus+Beach+Bar+Alleynes+Bay+Barbados",
    isSponsored: true,
    monthlyRateUsd: 250,
  },
  "mullins-beach": {
    beachSlug: "mullins-beach",
    beachLabel: "Mullins Beach · St. Peter",
    partnerName: "Mullins Beach Bar & Chair Rentals",
    category: "Beach Club & Dining",
    headline: "Over-Water Sunset Deck, Lounger Rentals & St. Peter Watersports",
    perkOffer:
      "Spend the afternoon on padded loungers at Mullins Bay with beachfront cocktail service, jet skis, and sunset dining.",
    priceHint: "Highway 1B, Mullins, St. Peter",
    ctaLabel: "Directions to Mullins Beach",
    ctaUrl:
      "https://www.google.com/maps/search/?api=1&query=Mullins+Beach+Barbados",
    isSponsored: true,
    monthlyRateUsd: 250,
  },
  "speightstown-beach": {
    beachSlug: "speightstown-beach",
    beachLabel: "Speightstown Esplanade · St. Peter",
    partnerName: "Fisherman's Pub & Orange Street Grocer",
    category: "Beach Club & Dining",
    headline: "Authentic Bajan Steam Pudding, Cou-Cou & Waterfront Wood-Fired Pizza",
    perkOffer:
      "Enjoy traditional Bajan buffet lunches over the water at Fisherman's Pub or wood-fired café dining on the deck at Orange Street Grocer.",
    priceHint: "Queen Street, Historic Speightstown",
    ctaLabel: "Directions to Speightstown Beachfront",
    ctaUrl:
      "https://www.google.com/maps/search/?api=1&query=Fishermans+Pub+Speightstown+Barbados",
    isSponsored: true,
    monthlyRateUsd: 200,
  },
  "silver-sands": {
    beachSlug: "silver-sands",
    beachLabel: "Silver Sands & Silver Rock · South Point",
    partnerName: "De Action Beach Shop (Brian Talma) & Surfer's Bay",
    category: "Surf & Kite School",
    headline: "Windsurfing, Kitesurfing, Wing-Foiling & SUP Lessons at Silver Rock",
    perkOffer:
      "Rent gear or book a lesson at Brian Talma's iconic action-sports beach shop where the Atlantic trade winds meet the South Coast reefs.",
    priceHint: "Silver Sands, Christ Church",
    ctaLabel: "Directions to Silver Sands",
    ctaUrl:
      "https://www.google.com/maps/search/?api=1&query=Silver+Sands+Beach+Barbados",
    isSponsored: true,
    monthlyRateUsd: 200,
  },
  "martins-bay": {
    beachSlug: "martins-bay",
    beachLabel: "Martin's Bay · St. John (East Coast)",
    partnerName: "The Bay Tavern at Martin's Bay",
    category: "East Coast Dining",
    headline: "Legendary East Coast Fried Fish, Grilled Lobster & Bajan Sides",
    perkOffer:
      "A beloved Bajan institution: pull up to Martin's Bay for fresh seafood, plantains, and cold drinks by the breezy St. John shoreline.",
    priceHint: "Famous Thursday & weekend East Coast lime",
    ctaLabel: "Directions to Martin's Bay",
    ctaUrl:
      "https://www.google.com/maps/search/?api=1&query=Bay+Tavern+Martins+Bay+Barbados",
    isSponsored: true,
    monthlyRateUsd: 200,
  },
};

export function getPartnerForBeach(
  beachSlug: string,
  beachName: string
): BeachPartnerConfig {
  return (
    BEACH_PARTNERS[beachSlug] || {
      beachSlug,
      beachLabel: beachName,
      partnerName: `Local Business Spotlight Open · ${beachName}`,
      category: "Available Slot",
      headline: `Do you run a beach bar, chair rental, food truck, or tour near ${beachName}?`,
      perkOffer:
        "Put your spot, daily food/drink specials, or WhatsApp booking button right here for locals and visitors checking this beach today.",
      priceHint: "1-business-per-beach spotlight",
      ctaLabel: `List Your Business on ${beachName}`,
      ctaUrl: "mailto:ryanb@digital-dads-llc.com?subject=BimBeachTracker%20Local%20Listing",
      isSponsored: false,
      monthlyRateUsd: 200,
    }
  );
}

export function getFeaturedPartnersList(): BeachPartnerConfig[] {
  return Object.values(BEACH_PARTNERS);
}
