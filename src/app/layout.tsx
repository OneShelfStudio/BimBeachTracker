import type { Metadata } from "next";
import { Analytics } from '@vercel/analytics/next';
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.bimbeachtracker.com"),
  title: {
    default: "BimBeachTracker | Live Barbados Beach Conditions, Sargassum & 44 Cameras",
    template: "%s | BimBeachTracker",
  },
  description:
    "Real-time Barbados coastal guide tracking all 46 beaches across the island: live webcams, high and low tide times, inshore wave heights, sargassum seaweed detection, and safe swimming coves.",
  keywords: [
    "Barbados beach cameras",
    "Barbados sargassum report",
    "BimBeachTracker",
    "Barbados live tides",
    "Barbados beaches safe swimming",
    "Carlisle Bay webcam",
    "Bathsheba surf report",
    "Miami beach Barbados seaweed",
    "Paynes bay turtles",
  ],
  alternates: {
    canonical: "./",
  },
  verification: {
    google: "D5XfLK3OOCGFon_cxfj51r-nDDsslFa_J-C_ruN2Vi0",
  },
  openGraph: {
    title: "BimBeachTracker | Real-Time Barbados Coastal Guide",
    description:
      "All 46 Barbados beaches mapped with 40+ live webcams, real-time tides, wave heights, and sargassum seaweed tracking.",
    url: "https://www.bimbeachtracker.com",
    siteName: "BimBeachTracker",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BimBeachTracker | Real-Time Barbados Coastal Guide",
    description:
      "All 46 Barbados beaches mapped with 40+ live webcams, real-time tides, wave heights, and sargassum seaweed tracking.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content="ca-pub-7651037308656903" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7651037308656903"
          data-ad-client="ca-pub-7651037308656903"
          data-ad-frequency-hint="90s"
          crossOrigin="anonymous"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.adsbygoogle = window.adsbygoogle || []; window.adBreak = window.adConfig = function(o) { window.adsbygoogle.push(o); };`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#030d18] text-slate-100 antialiased selection:bg-amber-400 selection:text-black">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
