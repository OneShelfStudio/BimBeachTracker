import { BARBADOS_BEACHES, BeachDefinition } from "./beaches";

export interface CameraFeedConfig {
  id: string;
  name: string;
  beachSlug: string;
  snapshotUrl: string;
  hlsStreamUrl?: string;
  provider: "IWCP Barbados" | "RTSP/HLS Worker";
  refreshIntervalSec: number;
  aspectRatio?: string;
  viewAngleLabel?: string;
}

/**
 * Verified Live Barbados Coastal Camera Registry (IWCP & NCC Live Snapshots)
 * Audited against live Last-Modified HTTP headers on snapshots.iwcpinc.com:444.
 * All stale/offline feeds (>2h old) have been pruned so beachgoers only see live, current views.
 */
export const BARBADOS_CAMERAS: Record<string, CameraFeedConfig> = {
  // Miami Beach / Enterprise / Oistins Bay (4 Verified Live Angles)
  ncc_miami_1: {
    id: "ncc_miami_1",
    name: "Miami Beach · West Swimming Cove",
    beachSlug: "miami-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/NCC_Miami_1.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Sheltered Casuarina Cove",
  },
  ncc_enterprise_1: {
    id: "ncc_enterprise_1",
    name: "Miami Beach · Enterprise Main Sandbar",
    beachSlug: "miami-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/NCC_Enterprise_1.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "South-East Atlantic Side",
  },
  // Oistins Bay (2 Verified Live Angles)
  oistins_1: {
    id: "oistins_1",
    name: "Oistins Bay & Fishing Jetty (Angle 1)",
    beachSlug: "oistins-bay",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/Oistins_1.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Oistins Bay Calm Water",
  },
  oistins_2: {
    id: "oistins_2",
    name: "Oistins Bay & Beachfront (Angle 2)",
    beachSlug: "oistins-bay",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/Oistins_2.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Oistins Bay Shoreline",
  },

  // Freights Bay (3 Verified Live Angles)
  freights_1: {
    id: "freights_1",
    name: "Freights Bay · Main Surf Point",
    beachSlug: "freights-bay",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/Freights_1.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 30,
    viewAngleLabel: "Longboard Point Break",
  },
  freights_2: {
    id: "freights_2",
    name: "Freights Bay · Inside Reef & Turtles",
    beachSlug: "freights-bay",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/Freights_2.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Inside Bay & Cliffs",
  },
  freights_3: {
    id: "freights_3",
    name: "Freights Bay · Cotton Tower Panorama",
    beachSlug: "freights-bay",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/Freights_3.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Wide South Point View",
  },

  // Worthing Beach (2 Verified Live Angles)
  ncc_worthing_1: {
    id: "ncc_worthing_1",
    name: "Worthing Beach · Sandy Beach Lagoon (West)",
    beachSlug: "worthing-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/NCC_Worthing_1.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Calm Turtle Lagoon",
  },
  ncc_worthing_2: {
    id: "ncc_worthing_2",
    name: "Worthing Beach · Reef & Sandbar (East)",
    beachSlug: "worthing-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/NCC_Worthing_2.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Shallow Reef Pool",
  },

  // Dover Beach (2 Verified Live Angles)
  ncc_dover_1: {
    id: "ncc_dover_1",
    name: "Dover Beach · Main Beachfront (West)",
    beachSlug: "dover-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/NCC_Dover_1.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Main Swimming Zone",
  },
  ncc_dover_2: {
    id: "ncc_dover_2",
    name: "Dover Beach · Watersports & East End",
    beachSlug: "dover-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/NCC_Dover_2.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "East Jetty & Surf",
  },

  // Accra / Rockley Beach (4 Verified Live Angles)
  beach_accra: {
    id: "beach_accra",
    name: "Accra Beach · Capri Panoramic View",
    beachSlug: "accra-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/Accra_Beach_Capri.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 30,
    viewAngleLabel: "Full Bay Panorama",
  },
  ncc_accra_1: {
    id: "ncc_accra_1",
    name: "Accra Beach · Main Lifeguard Tower",
    beachSlug: "accra-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/NCC_Accra_1.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Central Beachfront",
  },
  ncc_accra_2: {
    id: "ncc_accra_2",
    name: "Accra Beach · South Rock Pool",
    beachSlug: "accra-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/NCC_Accra_2.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Calm Southern Groyne",
  },
  ncc_accra_3: {
    id: "ncc_accra_3",
    name: "Accra Beach · Boardwalk West",
    beachSlug: "accra-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/NCC_Accra_3.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Boardwalk Entrance",
  },

  // Hastings / Boardwalk (4 Verified Live Angles)
  indigo_hastings_beach_1_facing_west: {
    id: "indigo_hastings_beach_1_facing_west",
    name: "Hastings Beach · Courtyard View West",
    beachSlug: "hastings-rocks",
    snapshotUrl:
      "https://snapshots.iwcpinc.com:444/snapshots/Indigo_Hastings_Beach_1_Facing_West.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Boardwalk Facing West",
  },
  indigo_hastings_beach_2_facing_east: {
    id: "indigo_hastings_beach_2_facing_east",
    name: "Hastings Beach · Courtyard View East",
    beachSlug: "hastings-rocks",
    snapshotUrl:
      "https://snapshots.iwcpinc.com:444/snapshots/Indigo_Hastings_Beach_2_Facing_East.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Boardwalk Facing East",
  },
  ncc_hastings_1: {
    id: "ncc_hastings_1",
    name: "Hastings Rocks · Tidal Pool West",
    beachSlug: "hastings-rocks",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/NCC_Hastings_1.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Calm Breakwater Pool",
  },
  ncc_hastings_2: {
    id: "ncc_hastings_2",
    name: "Hastings Rocks · Promenade East",
    beachSlug: "hastings-rocks",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/NCC_Hastings_2.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Richard Haynes Boardwalk",
  },

  // Pebbles Beach / Carlisle Bay South (5 Verified Live Angles)
  pebbles_radisson: {
    id: "pebbles_radisson",
    name: "Pebbles Beach · Radisson Aquatica Pier",
    beachSlug: "pebbles-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/Pebbles_Radisson.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 30,
    viewAngleLabel: "Crystal Clear Pier View",
  },
  savvy_1: {
    id: "savvy_1",
    name: "Carlisle Bay · Savvy on the Bay Beachfront",
    beachSlug: "pebbles-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/Savvy_On_The_Bay_1.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Savvy Beach Club",
  },
  savvy_2: {
    id: "savvy_2",
    name: "Carlisle Bay · Savvy Bay & Catamarans",
    beachSlug: "pebbles-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/Savvy_On_The_Bay_2.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Turquoise Anchor Zone",
  },
  ncc_pebbles_1: {
    id: "ncc_pebbles_1",
    name: "Pebbles Beach · Cuzz's Fish Stand Cove",
    beachSlug: "pebbles-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/NCC_Pebbles_1.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "South Cove & Paddleboards",
  },
  ncc_pebbles_2: {
    id: "ncc_pebbles_2",
    name: "Pebbles Beach · Yacht Club Shoreline",
    beachSlug: "pebbles-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/NCC_Pebbles_2.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Calm Swimming Bay",
  },

  // Browne's Beach / Carlisle Bay Central (3 Verified Live Angles)
  carlisle_radisson: {
    id: "carlisle_radisson",
    name: "Browne's Beach · Carlisle Bay North Panorama",
    beachSlug: "brownes-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/Carlisle_Bay_Radisson.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 30,
    viewAngleLabel: "Wide Turquoise Bay",
  },
  ncc_brownes_1: {
    id: "ncc_brownes_1",
    name: "Browne's Beach · Central White Sand",
    beachSlug: "brownes-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/NCC_Brownes_1.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Shipwreck Snorkel Access",
  },
  ncc_brownes_2: {
    id: "ncc_brownes_2",
    name: "Browne's Beach · Bay Street Shoreline",
    beachSlug: "brownes-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/NCC_Brownes_2.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Calm Leeward Water",
  },

  // Brighton Beach / Pile Bay (2 Verified Live Angles)
  brighton_1: {
    id: "brighton_1",
    name: "Brighton Beach · North View",
    beachSlug: "brighton-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/Brighton_1.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Brighton Calm Mile",
  },
  brighton_2: {
    id: "brighton_2",
    name: "Brighton Beach · South View",
    beachSlug: "brighton-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/Brighton_2.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Pile Bay Looking South",
  },
  ncc_brandons_1: {
    id: "ncc_brandons_1",
    name: "Brandons Beach · Rascal's & Main Sand",
    beachSlug: "brandons-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/NCC_Brandons_1.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Main Swimming Beach",
  },
  ncc_brandons_2: {
    id: "ncc_brandons_2",
    name: "Brandons Beach · Shaded Casuarina Trees",
    beachSlug: "brandons-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/NCC_Brandons_2.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Picnic & Shade Zone",
  },
  ncc_seafood_shack: {
    id: "ncc_seafood_shack",
    name: "Brandons · The Seafood Shack",
    beachSlug: "brandons-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/NCC_Seafood_Shack.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "South Brandons Cove",
  },

  // Batts Rock Beach (3 Verified Live Angles)
  ncc_batts_rock_1: {
    id: "ncc_batts_rock_1",
    name: "Batts Rock Beach · Main Cove & Reef",
    beachSlug: "batts-rock",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/NCC_Batts_Rock_1.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Main West Coast Cove",
  },
  ncc_batts_rock_2: {
    id: "ncc_batts_rock_2",
    name: "Batts Rock Beach · La Cabane Shoreline",
    beachSlug: "batts-rock",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/NCC_Batts_Rock_2.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Beach Club & Trees",
  },
  ncc_batts_rock_3: {
    id: "ncc_batts_rock_3",
    name: "Batts Rock Beach · North Snorkel Reef",
    beachSlug: "batts-rock",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/NCC_Batts_Rock_3.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "North Reef & Cliffs",
  },

  // Paynes Bay (2 Verified Live Angles)
  paynes_bay_1: {
    id: "paynes_bay_1",
    name: "Paynes Bay · Turtle Swimming Zone (North)",
    beachSlug: "paynes-bay",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/Paynes_Bay_1_Beachview.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "West Coast Platinum Calm",
  },
  paynes_bay_2: {
    id: "paynes_bay_2",
    name: "Paynes Bay · Beach Club & Jet Skis (South)",
    beachSlug: "paynes-bay",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/Paynes_Bay_2_Beachview.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Catamaran & Snorkel Bay",
  },

  // Holetown & Folkestone Marine Park (2 Verified Live Angles)
  ncc_folkstone_1: {
    id: "ncc_folkstone_1",
    name: "Folkestone Marine Park · Snorkel Reef (North)",
    beachSlug: "folkestone-park",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/NCC_Folkstone_1.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Protected Coral Reef",
  },
  ncc_folkstone_2: {
    id: "ncc_folkstone_2",
    name: "Holetown Boardwalk & Beach (South)",
    beachSlug: "holetown-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/NCC_Folkstone_2.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "West Coast Boardwalk",
  },

  // Gibbs Beach (2 Verified Live Angles)
  gibbs_jubilee: {
    id: "gibbs_jubilee",
    name: "Gibbs Bay · North Beachview",
    beachSlug: "gibbs-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/Gibbs_Jubille.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Glassy West Coast Cove",
  },
  gibbs_emerald: {
    id: "gibbs_emerald",
    name: "Gibbs Beach · Emerald Villas Shoreline",
    beachSlug: "gibbs-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/Gibbs_2_Emerald_Villas.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Quiet Tree-Lined Sand",
  },

  // Heywoods & Six Mens Bay (2 Verified Live Angles)
  pendry_cam_2: {
    id: "pendry_cam_2",
    name: "Heywoods Beach · Beachfront",
    beachSlug: "heywoods-beach",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/Pendry_Cam_2.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "North-West Calm Coast",
  },
  pendry_port_ferdinand: {
    id: "pendry_port_ferdinand",
    name: "Six Mens Bay & Port Ferdinand North PTZ",
    beachSlug: "six-mens-bay",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/Pendry_Port_Ferdinand_PTZ.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "Marina & Six Mens Reef",
  },

  // Bathsheba / Soup Bowl (1 Verified Live Angle)
  soup_bowl_1: {
    id: "soup_bowl_1",
    name: "Bathsheba · Soup Bowl Surf Break (Live)",
    beachSlug: "bathsheba",
    snapshotUrl: "https://snapshots.iwcpinc.com:444/snapshots/Soup_Bowl_1.jpg",
    provider: "IWCP Barbados",
    refreshIntervalSec: 60,
    viewAngleLabel: "World-Class Surf Rollers",
  },
};

/**
 * Cameras confirmed stale (not updating) by the server-side freshness check.
 * Set from the live conditions payload so every component hides dead feeds consistently.
 */
let staleCameraIds: Set<string> = new Set();

export function setStaleCameraIds(ids: string[] | undefined | null): void {
  staleCameraIds = new Set(ids || []);
}

export function getCamerasForBeach(beachSlug: string): CameraFeedConfig[] {
  return Object.values(BARBADOS_CAMERAS).filter(
    (cam) => cam.beachSlug === beachSlug && !staleCameraIds.has(cam.id)
  );
}

export function getPrimaryCameraForBeach(beachSlug: string): CameraFeedConfig | undefined {
  return getCamerasForBeach(beachSlug)[0];
}

/**
 * For beaches without a physical camera pole on the sand, finds the closest
 * neighboring beach with a live camera so users can still visually inspect that coast.
 */
export function getNearestCameraNeighbor(beachSlug: string): {
  neighborBeach: BeachDefinition;
  primaryCamera: CameraFeedConfig;
  distanceKm: number;
  driveMins: number;
} | null {
  const target = BARBADOS_BEACHES.find((b) => b.slug === beachSlug);
  if (!target) return null;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const distKm = (a: BeachDefinition, b: BeachDefinition) => {
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(h));
  };

  let bestNeighbor: BeachDefinition | null = null;
  let bestDist = Infinity;

  for (const candidate of BARBADOS_BEACHES) {
    if (candidate.slug === beachSlug || getCamerasForBeach(candidate.slug).length === 0) continue;
    const d = distKm(target, candidate);
    // Prefer a camera on the same coast sector when close
    const penalty = candidate.coast === target.coast ? d : d * 1.35;
    if (penalty < bestDist) {
      bestDist = penalty;
      bestNeighbor = candidate;
    }
  }

  if (!bestNeighbor) return null;
  const primaryCamera = getPrimaryCameraForBeach(bestNeighbor.slug);
  if (!primaryCamera) return null;

  const rawKm = distKm(target, bestNeighbor);
  const distanceKm = Number(rawKm.toFixed(1));
  const driveMins = Math.max(2, Math.round(((rawKm * 1.35) / 36) * 60));

  return {
    neighborBeach: bestNeighbor,
    primaryCamera,
    distanceKm,
    driveMins,
  };
}
