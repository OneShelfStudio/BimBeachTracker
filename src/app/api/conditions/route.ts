import { NextRequest, NextResponse } from "next/server";
import { getIslandConditionsPayload } from "@/lib/openMeteo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const forceFresh = request.nextUrl.searchParams.get("fresh") === "1";
    const payload = await getIslandConditionsPayload({ forceFresh });
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": forceFresh
          ? "no-store, max-age=0"
          : "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to compute Barbados coastal telemetry",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
