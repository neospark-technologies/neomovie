import { NextRequest, NextResponse } from "next/server";
import { getSeriesEpisodesAndMeta } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tvId = searchParams.get("tvId");
  const season = parseInt(searchParams.get("season") || "1", 10);

  if (!tvId) {
    return NextResponse.json({ error: "Missing tvId" }, { status: 400 });
  }

  try {
    const { episodes, totalSeasons } = await getSeriesEpisodesAndMeta(tvId, season);
    return NextResponse.json({ episodes, totalSeasons });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, episodes: [], totalSeasons: 1 }, { status: 500 });
  }
}
