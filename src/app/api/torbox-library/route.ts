import { NextRequest, NextResponse } from "next/server";
import { MediaItem } from "@/types/movie";

export async function GET(request: NextRequest) {
  const serverBaseUrl = process.env.AIOSTREAMS_BASE_URL?.trim();
  const customHeader = request.headers.get("x-custom-stream-url");
  const baseUrl = customHeader?.trim() || serverBaseUrl;

  if (!baseUrl) {
    return NextResponse.json({ items: [] });
  }

  try {
    const catalogUrl = `${baseUrl.replace(/\/manifest\.json$/, "")}/catalog/library/ae7791b.aiostreams::library.torbox.json`;
    const res = await fetch(catalogUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      return NextResponse.json({ items: [] });
    }

    const data = await res.json();
    const metas = data?.metas || [];

    const items: MediaItem[] = metas.map((m: any) => {
      // Clean up torrent filename to human readable title
      let cleanTitle = m.name || "TorBox Item";
      cleanTitle = cleanTitle.replace(/^www\.UIndex\.org\s*-\s*/i, "").trim();

      // Extract year if present
      const yearMatch = cleanTitle.match(/\b(19\d\d|20\d\d)\b/);
      const year = yearMatch ? yearMatch[1] : "2026";

      // Detect resolution
      const is4k = /4k|2160p/i.test(cleanTitle) || /4k/i.test(m.description || "");

      return {
        id: m.id,
        title: cleanTitle,
        overview: `${m.description || "TorBox Cloud Debrid Stream"}. Direct cached playback from your TorBox library.`,
        poster_path: m.poster || null,
        backdrop_path: m.background || null,
        release_date: `${year}-01-01`,
        vote_average: is4k ? 9.2 : 8.6,
        media_type: "movie",
        imdb_id: m.id,
        tagline: m.description,
        genres: [
          { id: 999, name: "TorBox Cloud" },
          { id: 998, name: is4k ? "4K Debrid" : "HD Debrid" },
        ],
      };
    });

    return NextResponse.json({ items });
  } catch (err: any) {
    console.error("Torbox catalog error:", err);
    return NextResponse.json({ items: [] });
  }
}
