import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imdbId = searchParams.get("imdbId");
  const type = searchParams.get("type") || "movie";
  const season = searchParams.get("season");
  const episode = searchParams.get("episode");

  if (!imdbId) {
    return NextResponse.json({ subtitles: [] });
  }

  const serverBaseUrl = process.env.AIOSTREAMS_BASE_URL?.trim();
  const customHeader = request.headers.get("x-custom-stream-url");
  const baseUrl = customHeader?.trim() || serverBaseUrl;

  if (!baseUrl) {
    return NextResponse.json({ subtitles: [] });
  }

  try {
    let subUrl = "";
    if (type === "series" || type === "tv") {
      const s = season || "1";
      const e = episode || "1";
      subUrl = `${baseUrl.replace(/\/manifest\.json$/, "")}/subtitles/series/${imdbId}:${s}:${e}.json`;
    } else {
      subUrl = `${baseUrl.replace(/\/manifest\.json$/, "")}/subtitles/movie/${imdbId}.json`;
    }

    const res = await fetch(subUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ subtitles: [] });
    }

    const data = await res.json();
    const rawSubs = data?.subtitles || [];

    // Map and deduplicate by language
    const languageNames: Record<string, string> = {
      eng: "English",
      en: "English",
      hin: "Hindi",
      hi: "Hindi",
      spa: "Spanish",
      es: "Spanish",
      fre: "French",
      fr: "French",
      ger: "German",
      de: "German",
      ita: "Italian",
      it: "Italian",
      por: "Portuguese",
      pt: "Portuguese",
      rus: "Russian",
      ru: "Russian",
      ara: "Arabic",
      ar: "Arabic",
      chi: "Chinese",
      zh: "Chinese",
      jpn: "Japanese",
      ja: "Japanese",
      kor: "Korean",
      ko: "Korean",
    };

    const formatted = rawSubs.map((s: any, idx: number) => {
      const langCode = s.lang_code || s.lang || "en";
      const label = languageNames[langCode.toLowerCase()] || langCode.toUpperCase();
      return {
        id: s.id || `${langCode}-${idx}`,
        url: s.url,
        lang: langCode,
        label: `${label} (${s.title?.slice(0, 25) || "Default"})`,
      };
    });

    return NextResponse.json({ subtitles: formatted });
  } catch (err: any) {
    console.error("Subtitles fetch error:", err);
    return NextResponse.json({ subtitles: [] });
  }
}
