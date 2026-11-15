import { Metadata } from "next";
import BimBeachDashboard from "@/components/BimBeachDashboard";
import { BARBADOS_BEACHES } from "@/lib/beaches";
import { getIslandConditionsPayload } from "@/lib/openMeteo";
import { rankBestRightNow } from "@/lib/scoring";
import { getStoredCheckIns } from "@/lib/supabase";

export const revalidate = 300; // 5-minute server refresh

export const metadata: Metadata = {
  title: "BimBeachTracker | Live Barbados Beach Conditions, Sargassum & 44 Cameras",
  description:
    "Real-time Barbados coastal guide tracking all 46 beaches across the island: live webcams, high and low tide times, inshore wave heights, sargassum seaweed detection, and safe swimming coves.",
  alternates: {
    canonical: "https://www.bimbeachtracker.com",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BimBeachTracker",
  },
};

export default async function BimBeachTrackerPage() {
  const [initialData, initialCheckIns] = await Promise.all([
    getIslandConditionsPayload(),
    Promise.resolve(getStoredCheckIns()),
  ]);

  const topThree = rankBestRightNow(initialData.beaches, 3);
  const topNames = topThree.map((b) => b.beach.name).join(", ");

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "BimBeachTracker",
        url: "https://www.bimbeachtracker.com",
        description:
          "Free real-time Barbados beach tracker covering 46 beaches, 44 live webcams, tides, wave heights, and sargassum conditions.",
      },
      {
        "@type": "WebApplication",
        name: "BimBeachTracker Barbados Beach Guide",
        url: "https://www.bimbeachtracker.com",
        applicationCategory: "TravelApplication",
        operatingSystem: "Any",
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        author: {
          "@type": "Organization",
          name: "Digital Dads LLC",
          url: "https://www.digital-dads-llc.com",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Which beaches in Barbados are calmest for swimming today?",
            acceptedAnswer: {
              "@type": "Answer",
              text: topNames
                ? `Today's calmest beaches in Barbados right now include ${topNames}. BimBeachTracker updates live nearshore wave heights, offshore vs onshore wind grooming, and sargassum visibility across ${BARBADOS_BEACHES.length} beaches every 5 minutes.`
                : `West Coast and sheltered South Coast bays such as Pebbles Beach, Browne's Beach in Carlisle Bay, and Paynes Bay typically offer the calmest swimming conditions in Barbados. Check live wave heights across ${BARBADOS_BEACHES.length} beaches on BimBeachTracker.com.`,
            },
          },
          {
            "@type": "Question",
            name: "Where can I check live Barbados beach webcams and sargassum seaweed reports?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "BimBeachTracker.com connects 44 live Barbados coastal webcams with real-time sargassum risk estimates, tidal schedules, and 24-hour wave forecasts on one free interactive map with zero signup required.",
            },
          },
          {
            "@type": "Question",
            name: "Which Barbados beaches are best for swimming with sea turtles and kids?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Pebbles Beach, Browne's Beach in Carlisle Bay, Paynes Bay, Mullins Beach, Folkestone Marine Park, and Miami Beach in Oistins are popular family-friendly and turtle-swimming bays. Filter directly by Toddlers & Kids or Turtles & Snorkel on BimBeachTracker.com to see today's live water safety.",
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <BimBeachDashboard
        initialData={initialData}
        initialCheckIns={initialCheckIns}
      />
    </>
  );
}
