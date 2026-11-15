import { Metadata } from "next";
import BimBeachDashboard from "@/components/BimBeachDashboard";
import { getIslandConditionsPayload } from "@/lib/openMeteo";
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

  return (
    <BimBeachDashboard
      initialData={initialData}
      initialCheckIns={initialCheckIns}
    />
  );
}
