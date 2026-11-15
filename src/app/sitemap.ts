import type { MetadataRoute } from "next";
import { BARBADOS_BEACHES } from "@/lib/beaches";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.bimbeachtracker.com";
  const now = new Date();

  const homeEntry: MetadataRoute.Sitemap[number] = {
    url: baseUrl,
    lastModified: now,
    changeFrequency: "hourly",
    priority: 1.0,
  };

  const beachEntries: MetadataRoute.Sitemap = BARBADOS_BEACHES.map((beach) => ({
    url: `${baseUrl}/beach/${beach.slug}`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: 0.9,
  }));

  return [homeEntry, ...beachEntries];
}
