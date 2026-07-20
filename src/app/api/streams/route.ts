import { NextRequest, NextResponse } from "next/server";
import { StreamItem } from "@/types/movie";
import { encryptStreamToken } from "@/lib/security";

function detectLanguages(text: string): string[] {
  const languages: string[] = [];
  const lower = text.toLowerCase();

  if (/hindi|hin\b|bolly/i.test(text)) languages.push("Hindi");
  if (/telugu|tel\b/i.test(text)) languages.push("Telugu");
  if (/tamil|tam\b/i.test(text)) languages.push("Tamil");
  if (/malayalam|mal\b/i.test(text)) languages.push("Malayalam");
  if (/kannada|kan\b/i.test(text)) languages.push("Kannada");
  if (/english|eng\b|ᴇɴ\b/i.test(text)) languages.push("English");
  if (/spanish|spa\b|latino|castellano/i.test(text)) languages.push("Spanish");
  if (/french|fre\b|fra\b|fr\b/i.test(text)) languages.push("French");
  if (/italian|ita\b/i.test(text)) languages.push("Italian");
  if (/german|ger\b|deu\b/i.test(text)) languages.push("German");
  if (/japanese|jap\b|jpn\b/i.test(text)) languages.push("Japanese");
  if (/korean|kor\b/i.test(text)) languages.push("Korean");
  if (/multi|multilang|multiaudio/i.test(text)) languages.push("Multi-Audio");
  if (/dual|duo\b|ᴅᴜᴏ/i.test(text)) languages.push("Dual-Audio");

  if (languages.length === 0) languages.push("English");
  return Array.from(new Set(languages));
}

function parseStreamMetadata(stream: StreamItem): StreamItem {
  const name = stream.name || "";
  const desc = stream.description || "";
  const fullText = `${name} ${desc} ${stream.behaviorHints?.filename || ""} ${stream.url || ""}`;

  // Resolution detection
  let resolution: "4K" | "1080p" | "720p" | "SD" = "1080p";
  if (/4k|2160p|uhd/i.test(fullText)) {
    resolution = "4K";
  } else if (/1080p|fhd/i.test(fullText)) {
    resolution = "1080p";
  } else if (/720p|hd/i.test(fullText)) {
    resolution = "720p";
  } else {
    resolution = "SD";
  }

  // Quality detection
  let quality: "Remux" | "BluRay" | "WEB-DL" | "WEBRip" | "HDRip" | string = "WEB-DL";
  if (/remux/i.test(fullText)) {
    quality = "Remux";
  } else if (/bluray|bdrip/i.test(fullText)) {
    quality = "BluRay";
  } else if (/web-dl|webdl/i.test(fullText)) {
    quality = "WEB-DL";
  } else if (/webrip/i.test(fullText)) {
    quality = "WEBRip";
  } else if (/hdrip/i.test(fullText)) {
    quality = "HDRip";
  }

  // Size parsing
  let size = "";
  const sizeMatch = desc.match(/◈\s*([\d.]+\s*(?:GB|MB|TB))/i) || desc.match(/([\d.]+\s*(?:GB|MB|TB))/i);
  if (sizeMatch) {
    size = sizeMatch[1];
  } else if (stream.behaviorHints?.videoSize) {
    const bytes = stream.behaviorHints.videoSize;
    if (bytes > 1024 * 1024 * 1024) {
      size = `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    } else {
      size = `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
    }
  }

  // Codecs & Visual
  const hdr = /hdr|hdr10/i.test(fullText);
  const dv = /dv|dolby\s*vision/i.test(fullText);

  // Audio format
  let audio = "";
  if (/dts-hd|dts\s*hd/i.test(fullText)) {
    audio = "DTS-HD";
  } else if (/atmos/i.test(fullText)) {
    audio = "Dolby Atmos";
  } else if (/dd\+|ddp|eac3/i.test(fullText)) {
    audio = "DD+";
  } else if (/truehd/i.test(fullText)) {
    audio = "TrueHD";
  } else if (/aac/i.test(fullText)) {
    audio = "AAC";
  } else if (/ac3|dd/i.test(fullText)) {
    audio = "AC3";
  }

  // Audio Channels
  let channels = "";
  if (/7\.1/i.test(fullText)) {
    channels = "7.1";
  } else if (/5\.1/i.test(fullText)) {
    channels = "5.1";
  } else if (/2\.0|stereo/i.test(fullText)) {
    channels = "2.0";
  }

  // MP4 detection
  const isMp4 = fullText.toLowerCase().includes(".mp4");

  // Language detection
  const languages = detectLanguages(fullText);

  return {
    ...stream,
    parsed: {
      resolution,
      quality,
      size,
      hdr,
      dv,
      audio,
      channels,
      isMp4,
      languages,
    },
  };
}

const TMDB_TO_IMDB: Record<string, string> = {
  "157336": "tt0816692", // Interstellar
  "278": "tt0111161",    // The Shawshank Redemption
  "693134": "tt15239678", // Dune: Part Two
  "438631": "tt1160419", // Dune: Part One
  "27205": "tt1375666",  // Inception
  "155": "tt0468569",    // The Dark Knight
  "15398776": "tt15398776", // Oppenheimer
  "550": "tt0137523",    // Fight Club
  "603": "tt0133093",    // The Matrix
  "680": "tt0110912",    // Pulp Fiction
  "558449": "tt11097384", // Gladiator II
  "533535": "tt6263850", // Deadpool & Wolverine
  "1399": "tt0944947",   // Game of Thrones
  "1396": "tt0903747",   // Breaking Bad
  "66732": "tt2575988",  // Stranger Things
  "94605": "tt8740790",  // Arcane
  "1429": "tt2560140",   // Attack on Titan
  "105248": "tt12590266", // Cyberpunk Edgerunners
  "573435": "tt8178634", // RRR
  "872585": "tt15354916", // Jawan
  "76600": "tt1187043",  // 3 Idiots
  "360814": "tt5074352", // Dangal
  "786892": "tt13751694", // Animal
  "945961": "tt12735488", // Kalki 2898 AD
  "580489": "tt10698680", // KGF 2
  "350312": "tt4849438", // Baahubali 2
  "866398": "tt12844910", // Pathaan
  "1003596": "tt16539454", // Pushpa 2
  "493922": "tt8239946", // Tumbbad
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawId = searchParams.get("imdbId");
  const title = searchParams.get("title");
  const type = searchParams.get("type") || "movie";
  const season = searchParams.get("season");
  const episode = searchParams.get("episode");

  if (!rawId) {
    return NextResponse.json({ error: "Missing imdbId parameter" }, { status: 400 });
  }

  let imdbId: string = rawId;

  // Resolve numeric TMDB IDs to IMDb IDs
  if (TMDB_TO_IMDB[imdbId]) {
    imdbId = TMDB_TO_IMDB[imdbId];
  } else if (!imdbId.startsWith("tt") && !imdbId.includes("library.torbox")) {
    if (title && title.trim()) {
      try {
        const cinemetaType = type === "series" || type === "tv" ? "series" : "movie";
        const searchRes = await fetch(
          `https://v3-cinemeta.strem.io/catalog/${cinemetaType}/top/search=${encodeURIComponent(title.trim())}.json`
        );
        if (searchRes.ok) {
          const sData = await searchRes.json();
          if (sData?.metas?.[0]?.id) {
            imdbId = sData.metas[0].id;
          }
        }
      } catch (err) {
        console.warn("Cinemeta title resolution failed", err);
      }
    }
  }

  const serverBaseUrl = process.env.AIOSTREAMS_BASE_URL?.trim();
  const customHeader = request.headers.get("x-custom-stream-url");
  const baseUrl = customHeader?.trim() || serverBaseUrl;

  if (!baseUrl) {
    return NextResponse.json(
      {
        error: "Streaming service endpoint not configured on server",
        streams: [],
      },
      { status: 500 }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    let streamEndpoint = "";

    // Handle TorBox Library items
    if (imdbId.includes("library.torbox")) {
      let videoId = imdbId;
      // If the ID doesn't have an episode/video suffix, inspect meta to get real videoId
      if (!/:\d+$/.test(videoId)) {
        try {
          const metaRes = await fetch(
            `${baseUrl.replace(/\/manifest\.json$/, "")}/meta/library/${imdbId}.json`
          );
          if (metaRes.ok) {
            const metaData = await metaRes.json();
            const defId = metaData?.meta?.behaviorHints?.defaultVideoId;
            const firstVideo = metaData?.meta?.videos?.[0]?.id;
            if (defId) {
              videoId = defId;
            } else if (firstVideo) {
              videoId = firstVideo;
            }
          }
        } catch (e) {
          console.warn("Could not fetch library meta", e);
        }
      }
      streamEndpoint = `${baseUrl.replace(/\/manifest\.json$/, "")}/stream/library/${videoId}.json`;
    } else if (type === "series" || type === "tv") {
      const s = season || "1";
      const e = episode || "1";
      streamEndpoint = `${baseUrl.replace(/\/manifest\.json$/, "")}/stream/series/${imdbId}:${s}:${e}.json`;
    } else {
      streamEndpoint = `${baseUrl.replace(/\/manifest\.json$/, "")}/stream/movie/${imdbId}.json`;
    }

    const res = await fetch(streamEndpoint, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "NeoMovie/1.0 Stremio/4.4",
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`Stream resolver returned status ${res.status} for ${streamEndpoint}`);
      return NextResponse.json({
        streams: [],
        error: `Streaming upstream error ${res.status}`,
      });
    }

    const data = await res.json();
    const rawStreams: StreamItem[] = data?.streams || [];
    const streams = rawStreams
      .filter((s) => Boolean(s.url))
      .map((s) => {
        const parsed = parseStreamMetadata(s);

        // Sanitize behaviorHints so no server URLs, proxy headers, or auth tokens are emitted
        const safeHints = s.behaviorHints
          ? {
              filename: s.behaviorHints.filename || undefined,
              videoSize: s.behaviorHints.videoSize || undefined,
              bingeGroup: s.behaviorHints.bingeGroup
                ? s.behaviorHints.bingeGroup.replace(/aiostreams\.[^|]+/gi, "cinema-stream")
                : undefined,
              cached: s.behaviorHints.cached ?? true,
            }
          : undefined;

        return {
          name: s.name || "HD Debrid Stream",
          description: s.description || "",
          behaviorHints: safeHints,
          parsed: parsed.parsed,
          url: `/api/stream-proxy?token=${encryptStreamToken(s.url)}`,
        };
      });

    // Priority sorting: Default priority to 1080p (high browser compatibility, no decoding limit)
    // while keeping 4K available in the list for manual selection or external player
    streams.sort((a, b) => {
      const getScore = (item: StreamItem) => {
        const p = item.parsed || {};
        let score = 0;
        if (p.resolution === "1080p") score += 1000;
        else if (p.resolution === "720p") score += 600;
        else if (p.resolution === "4K") score += 300;
        else score += 100;

        if (p.isMp4) score += 200;
        if (p.quality === "WEB-DL" || p.quality === "WEBRip") score += 150;
        if (p.quality === "BluRay") score += 100;
        if (/remux/i.test(p.quality || "")) score -= 80;
        if (p.audio === "TrueHD" || p.audio === "DTS-HD") score -= 100;
        if (p.audio === "AAC" || p.audio === "DD+" || p.audio === "AC3") score += 50;

        return score;
      };
      return getScore(b) - getScore(a);
    });

    return NextResponse.json({
      streams,
      total: streams.length,
    });
  } catch (error: any) {
    console.error("Failed to query streams", error);
    return NextResponse.json(
      {
        streams: [],
        error: error.name === "AbortError" ? "Stream resolver timed out" : error.message,
      },
      { status: 500 }
    );
  }
}
