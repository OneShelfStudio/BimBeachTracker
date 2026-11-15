import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BimBeachTracker · Barbados Live Beach & Sargassum Guide",
    short_name: "BimBeaches",
    description:
      "Real-time Barbados beach cameras, live sargassum detection, high and low tides, and reef wave reports across 46 beaches.",
    start_url: "/bim-beach-tracker",
    display: "standalone",
    background_color: "#030d18",
    theme_color: "#030d18",
    icons: [
      {
        src: "/bimbeach-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
