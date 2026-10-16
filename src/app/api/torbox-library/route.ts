import { NextRequest, NextResponse } from "next/server";
import { MediaItem } from "@/types/movie";
import { resolveLibraryMeta } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const serverBaseUrl = (process.env.STREAM_PROVIDER_URL || process.env.AIOSTREAMS_BASE_URL)?.trim();
  const customHeader = request.headers.get("x-custom-stream-url");
  const baseUrl = customHeader?.trim() || serverBaseUrl;

  if (!baseUrl) {
    return NextResponse.json({ items: [] });
  }

  try {
    const catalogUrl = `${baseUrl.replace(/\/manifest\.json$/, "")}/catalog/library/ae7791b.aiostreams::library.torbox.json`;
    const res = await fetch(catalogUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      return NextResponse.json({ items: [] });
    }

    const data = await res.json();
    const metas = data?.metas || [];

    const items: MediaItem[] = metas.map((m: any) => {
      const resolved = resolveLibraryMeta(m.name || "", m.description);
      return {
        id: m.id,
        title: resolved.title,
        overview: `${m.description || "TorBox Cloud Debrid Stream"}. Direct cached playback from your TorBox library.`,
        poster_path: m.poster || resolved.poster,
        backdrop_path: m.background || resolved.backdrop,
        release_date: `${resolved.year}-01-01`,
        vote_average: resolved.is4k ? 9.5 : 8.8,
        media_type: resolved.mediaType,
        imdb_id: resolved.imdbId || m.id,
        tagline: m.description,
        genres: [
          { id: 999, name: "TorBox Cloud" },
          { id: 998, name: resolved.is4k ? "4K Debrid" : "HD Debrid" },
        ],
      };
    });

    return NextResponse.json({ items });
  } catch (err: any) {
    console.error("Torbox catalog error:", err);
    return NextResponse.json({ items: [] });
  }
}
