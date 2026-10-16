import { MediaItem, Episode, CastMember } from "@/types/movie";
import { getUserSettings } from "./storage";

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function getPosterUrl(
  path: string | null | undefined,
  size: "w342" | "w500" | "w780" | "original" = "w500",
  imdbId?: string
): string {
  if (path && (path.startsWith("http://") || path.startsWith("https://"))) return path;
  if (path) return `${TMDB_IMAGE_BASE}/${size}${path}`;
  if (imdbId && imdbId.startsWith("tt")) return `https://images.metahub.space/poster/small/${imdbId}/img`;
  return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80";
}

export function getBackdropUrl(
  path: string | null | undefined,
  size: "w780" | "w1280" | "original" = "original",
  imdbId?: string
): string {
  if (path && (path.startsWith("http://") || path.startsWith("https://"))) return path;
  if (path) return `${TMDB_IMAGE_BASE}/${size}${path}`;
  if (imdbId && imdbId.startsWith("tt")) return `https://images.metahub.space/background/medium/${imdbId}/img`;
  return "https://images.unsplash.com/photo-1574267432553-4b4628081c31?auto=format&fit=crop&w=1920&q=80";
}

export async function getTorboxItems(): Promise<MediaItem[]> {
  const baseUrl = process.env.AIOSTREAMS_BASE_URL?.trim();
  if (!baseUrl) return [];
  try {
    const catalogUrl = `${baseUrl.replace(/\/manifest\.json$/, "")}/catalog/library/ae7791b.aiostreams::library.torbox.json`;
    const res = await fetch(catalogUrl, { next: { revalidate: 600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.metas || []).map((m: any) => {
      let rawTitle = m.name || "Cloud Media";
      rawTitle = rawTitle.replace(/^www\.[a-z0-9.-]+\s*-\s*/i, "").trim();
      const yearMatch = rawTitle.match(/\b(19\d\d|20\d\d)\b/);
      const year = yearMatch ? yearMatch[1] : "2026";
      const is4k = /4k|2160p/i.test(rawTitle) || /4k/i.test(m.description || "");

      const cleanTitle = rawTitle
        .replace(/[._]/g, " ")
        .replace(/\b(1080p|720p|2160p|4k|uhd|bluray|brrip|webrip|web-dl|web|dvdrip|x264|x265|hevc|aac|dts|ddp|flac|atmos|repack|proper|etrg|yify|rarbg|galaxy)\b.*/gi, "")
        .trim() || rawTitle;

      return {
        id: m.id,
        title: cleanTitle,
        overview: `${m.description || "TorBox Cloud Stream"}. Direct debrid playback from your personal cloud library.`,
        poster_path: m.poster || null,
        backdrop_path: m.background || null,
        release_date: `${year}-01-01`,
        vote_average: is4k ? 9.5 : 8.8,
        media_type: "movie",
        imdb_id: m.id,
        tagline: m.description,
        genres: [{ id: 999, name: "Cloud Library" }, { id: 998, name: is4k ? "4K Debrid" : "HD" }],
      };
    });
  } catch (e) {
    console.warn("Could not load Torbox items", e);
    return [];
  }
}


function getApiKey(): string | null {
  if (typeof window !== "undefined") {
    const settings = getUserSettings();
    if (settings.tmdbApiKey && settings.tmdbApiKey.trim()) {
      return settings.tmdbApiKey.trim();
    }
  }
  return process.env.NEXT_PUBLIC_TMDB_API_KEY || null;
}

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const CINEMETA_BASE_URL = "https://v3-cinemeta.strem.io";

async function fetchFromTMDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const searchParams = new URLSearchParams({
      api_key: apiKey,
      ...params,
    });
    const url = `${TMDB_BASE_URL}${endpoint}?${searchParams.toString()}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err) {
    console.error("TMDB fetch error", err);
    return null;
  }
}

// Convert Cinemeta meta object to MediaItem
function mapCinemetaItem(m: any, type: "movie" | "tv" | "anime" = "movie"): MediaItem {
  const genres = Array.isArray(m.genres)
    ? m.genres.map((g: string, idx: number) => ({ id: idx + 1, name: g }))
    : Array.isArray(m.genre)
    ? m.genre.map((g: string, idx: number) => ({ id: idx + 1, name: g }))
    : [];

  const year = m.year ? String(m.year) : (m.released || "").slice(0, 4) || "2024";
  const imdbId = m.imdb_id || (typeof m.id === "string" && m.id.startsWith("tt") ? m.id : undefined);

  let numberOfSeasons: number | undefined = undefined;
  if (Array.isArray(m.videos) && m.videos.length > 0) {
    const seasons = m.videos
      .map((v: any) => Number(v.season))
      .filter((s: number) => !isNaN(s) && s > 0);
    if (seasons.length > 0) {
      numberOfSeasons = Math.max(...seasons);
    }
  }

  return {
    id: imdbId || m.id,
    title: m.name || m.title || "Untitled",
    overview: m.description || m.overview || "High-bitrate cinema title available to stream.",
    poster_path: m.poster || (imdbId ? `https://images.metahub.space/poster/small/${imdbId}/img` : null),
    backdrop_path: m.background || m.poster || (imdbId ? `https://images.metahub.space/background/medium/${imdbId}/img` : null),
    release_date: `${year}-01-01`,
    first_air_date: `${year}-01-01`,
    vote_average: m.imdbRating ? parseFloat(m.imdbRating) : 8.2,
    vote_count: 5000,
    media_type: type,
    imdb_id: imdbId,
    genres,
    number_of_seasons: numberOfSeasons || (type === "tv" ? 1 : undefined),
    runtime: typeof m.runtime === "string" ? parseInt(m.runtime, 10) : m.runtime || 120,
  };
}

// Curated Indian Blockbusters with verified IMDb IDs and Metahub images
export const INDIAN_BLOCKBUSTERS: MediaItem[] = [
  {
    id: "tt8178634",
    imdb_id: "tt8178634",
    title: "RRR",
    overview: "A fearless warrior on a perilous mission comes face to face with a steely cop serving British forces in this epic multi-language Indian blockbuster of brotherhood and revolution.",
    poster_path: "https://images.metahub.space/poster/small/tt8178634/img",
    backdrop_path: "https://images.metahub.space/background/medium/tt8178634/img",
    release_date: "2022-03-24",
    vote_average: 8.8,
    media_type: "movie",
    tagline: "Rise. Roar. Revolt.",
    runtime: 187,
    genres: [{ id: 28, name: "Action" }, { id: 18, name: "Drama" }, { id: 100, name: "Indian / Telugu" }],
  },
  {
    id: "tt12735488",
    imdb_id: "tt12735488",
    title: "Kalki 2898 AD",
    overview: "A modern-day avatar of Vishnu, a Hindu god, who is believed to have descended to the earth to protect the world from evil forces in a dystopian future post-apocalyptic world.",
    poster_path: "https://images.metahub.space/poster/small/tt12735488/img",
    backdrop_path: "https://images.metahub.space/background/medium/tt12735488/img",
    release_date: "2024-06-27",
    vote_average: 8.0,
    media_type: "movie",
    tagline: "The future has a savior.",
    runtime: 181,
    genres: [{ id: 878, name: "Sci-Fi" }, { id: 28, name: "Action" }, { id: 100, name: "Indian" }],
  },
  {
    id: "tt15354916",
    imdb_id: "tt15354916",
    title: "Jawan",
    overview: "A high-octane action thriller which outlines the emotional journey of a man who is set to rectify the wrongs in the society, with an army of women taking on corrupt powers.",
    poster_path: "https://images.metahub.space/poster/small/tt15354916/img",
    backdrop_path: "https://images.metahub.space/background/medium/tt15354916/img",
    release_date: "2023-09-07",
    vote_average: 7.9,
    media_type: "movie",
    tagline: "Ready chief.",
    runtime: 169,
    genres: [{ id: 28, name: "Action" }, { id: 53, name: "Thriller" }, { id: 100, name: "Hindi / Bollywood" }],
  },
  {
    id: "tt1187043",
    imdb_id: "tt1187043",
    title: "3 Idiots",
    overview: "Two friends are searching for their long lost companion. They revisit their college days and recall the memories of their friend who inspired them to think differently, even as the rest of the world called them 'idiots'.",
    poster_path: "https://images.metahub.space/poster/small/tt1187043/img",
    backdrop_path: "https://images.metahub.space/background/medium/tt1187043/img",
    release_date: "2009-12-25",
    vote_average: 8.9,
    media_type: "movie",
    tagline: "All is well.",
    runtime: 170,
    genres: [{ id: 35, name: "Comedy" }, { id: 18, name: "Drama" }, { id: 100, name: "Bollywood" }],
  },
  {
    id: "tt5074352",
    imdb_id: "tt5074352",
    title: "Dangal",
    overview: "Former wrestler Mahavir Singh Phogat and his two wrestler daughters struggle towards glory at the Commonwealth Games in the face of societal oppression.",
    poster_path: "https://images.metahub.space/poster/small/tt5074352/img",
    backdrop_path: "https://images.metahub.space/background/medium/tt5074352/img",
    release_date: "2016-12-23",
    vote_average: 8.7,
    media_type: "movie",
    tagline: "Mhari chhoriyan chhoron se kam hain ke?",
    runtime: 161,
    genres: [{ id: 18, name: "Drama" }, { id: 36, name: "Biography" }, { id: 100, name: "Bollywood" }],
  },
  {
    id: "tt10698680",
    imdb_id: "tt10698680",
    title: "K.G.F: Chapter 2",
    overview: "In the blood-soaked Kolar Gold Fields, Rocky's name strikes fear into his foes. While his allies look up to him, the government sees him as a threat to law and order.",
    poster_path: "https://images.metahub.space/poster/small/tt10698680/img",
    backdrop_path: "https://images.metahub.space/background/medium/tt10698680/img",
    release_date: "2022-04-14",
    vote_average: 8.5,
    media_type: "movie",
    tagline: "Violence, violence, violence... I don't like it. I avoid. But violence likes me!",
    runtime: 168,
    genres: [{ id: 28, name: "Action" }, { id: 80, name: "Crime" }, { id: 100, name: "Indian / Kannada" }],
  },
  {
    id: "tt4849438",
    imdb_id: "tt4849438",
    title: "Baahubali 2: The Conclusion",
    overview: "When Shiva, the son of Bahubali, learns about his heritage, he begins to look for answers. His story is juxtaposed with past events that unfolded in the Mahishmati Kingdom.",
    poster_path: "https://images.metahub.space/poster/small/tt4849438/img",
    backdrop_path: "https://images.metahub.space/background/medium/tt4849438/img",
    release_date: "2017-04-28",
    vote_average: 8.6,
    media_type: "movie",
    tagline: "The boy becomes what he was born to be.",
    runtime: 167,
    genres: [{ id: 28, name: "Action" }, { id: 14, name: "Fantasy" }, { id: 100, name: "Indian" }],
  },
  {
    id: "tt16539454",
    imdb_id: "tt16539454",
    title: "Pushpa: The Rule - Part 2",
    overview: "The clash is on as Pushpa and Bhanwar Singh continue their rivalry in this epic conclusion to the two-part action drama.",
    poster_path: "https://images.metahub.space/poster/small/tt16539454/img",
    backdrop_path: "https://images.metahub.space/background/medium/tt16539454/img",
    release_date: "2024-12-05",
    vote_average: 8.2,
    media_type: "movie",
    tagline: "Wildfire is coming.",
    runtime: 175,
    genres: [{ id: 28, name: "Action" }, { id: 80, name: "Crime" }, { id: 100, name: "Indian" }],
  },
  {
    id: "tt13751694",
    imdb_id: "tt13751694",
    title: "Animal",
    overview: "The hardened son of a powerful industrialist returns home after years abroad and vows to exact ruthless vengeance on those who attempted to assassinate his father.",
    poster_path: "https://images.metahub.space/poster/small/tt13751694/img",
    backdrop_path: "https://images.metahub.space/background/medium/tt13751694/img",
    release_date: "2023-12-01",
    vote_average: 7.4,
    media_type: "movie",
    tagline: "A son's obsessive love.",
    runtime: 201,
    genres: [{ id: 28, name: "Action" }, { id: 80, name: "Crime" }, { id: 100, name: "Bollywood" }],
  },
  {
    id: "tt8239946",
    imdb_id: "tt8239946",
    title: "Tumbbad",
    overview: "A mythological story about a goddess who created the entire universe. The plot revolves around the consequences when humans build a temple for her first-born, greed and a horrific ancestral curse.",
    poster_path: "https://images.metahub.space/poster/small/tt8239946/img",
    backdrop_path: "https://images.metahub.space/background/medium/tt8239946/img",
    release_date: "2018-10-12",
    vote_average: 8.3,
    media_type: "movie",
    tagline: "Greed has no limits.",
    runtime: 104,
    genres: [{ id: 27, name: "Horror" }, { id: 14, name: "Fantasy" }, { id: 100, name: "Indian" }],
  },
];

// Curated Global Blockbusters with verified IMDb IDs and Metahub images
export const POPULAR_MOVIES_LIST: MediaItem[] = [
  {
    id: "tt0816692",
    imdb_id: "tt0816692",
    title: "Interstellar",
    overview: "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.",
    poster_path: "https://images.metahub.space/poster/small/tt0816692/img",
    backdrop_path: "https://images.metahub.space/background/medium/tt0816692/img",
    release_date: "2014-11-05",
    vote_average: 8.7,
    media_type: "movie",
    tagline: "Mankind was born on Earth. It was never meant to die here.",
    runtime: 169,
    genres: [{ id: 878, name: "Sci-Fi" }, { id: 18, name: "Drama" }, { id: 12, name: "Adventure" }],
  },
  {
    id: "tt15239678",
    imdb_id: "tt15239678",
    title: "Dune: Part Two",
    overview: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
    poster_path: "https://images.metahub.space/poster/small/tt15239678/img",
    backdrop_path: "https://images.metahub.space/background/medium/tt15239678/img",
    release_date: "2024-03-01",
    vote_average: 8.5,
    media_type: "movie",
    tagline: "Long live the fighters.",
    runtime: 166,
    genres: [{ id: 878, name: "Sci-Fi" }, { id: 12, name: "Adventure" }],
  },
  {
    id: "tt1375666",
    imdb_id: "tt1375666",
    title: "Inception",
    overview: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project.",
    poster_path: "https://images.metahub.space/poster/small/tt1375666/img",
    backdrop_path: "https://images.metahub.space/background/medium/tt1375666/img",
    release_date: "2010-07-16",
    vote_average: 8.8,
    media_type: "movie",
    tagline: "Your mind is the scene of the crime.",
    runtime: 148,
    genres: [{ id: 28, name: "Action" }, { id: 878, name: "Sci-Fi" }],
  },
  {
    id: "tt0468569",
    imdb_id: "tt0468569",
    title: "The Dark Knight",
    overview: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    poster_path: "https://images.metahub.space/poster/small/tt0468569/img",
    backdrop_path: "https://images.metahub.space/background/medium/tt0468569/img",
    release_date: "2008-07-18",
    vote_average: 9.0,
    media_type: "movie",
    tagline: "Why so serious?",
    runtime: 152,
    genres: [{ id: 28, name: "Action" }, { id: 80, name: "Crime" }],
  },
  {
    id: "tt15398776",
    imdb_id: "tt15398776",
    title: "Oppenheimer",
    overview: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.",
    poster_path: "https://images.metahub.space/poster/small/tt15398776/img",
    backdrop_path: "https://images.metahub.space/background/medium/tt15398776/img",
    release_date: "2023-07-21",
    vote_average: 8.9,
    media_type: "movie",
    tagline: "The world forever changes.",
    runtime: 180,
    genres: [{ id: 18, name: "Drama" }, { id: 36, name: "History" }],
  },
  {
    id: "tt0137523",
    imdb_id: "tt0137523",
    title: "Fight Club",
    overview: "An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more.",
    poster_path: "https://images.metahub.space/poster/small/tt0137523/img",
    backdrop_path: "https://images.metahub.space/background/medium/tt0137523/img",
    release_date: "1999-10-15",
    vote_average: 8.8,
    media_type: "movie",
    tagline: "Mischief. Mayhem. Soap.",
    runtime: 139,
    genres: [{ id: 18, name: "Drama" }],
  },
  {
    id: "tt0133093",
    imdb_id: "tt0133093",
    title: "The Matrix",
    overview: "When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth--the life he knows is the elaborate deception of an evil cyber-intelligence.",
    poster_path: "https://images.metahub.space/poster/small/tt0133093/img",
    backdrop_path: "https://images.metahub.space/background/medium/tt0133093/img",
    release_date: "1999-03-31",
    vote_average: 8.7,
    media_type: "movie",
    tagline: "Welcome to the Real World.",
    runtime: 136,
    genres: [{ id: 28, name: "Action" }, { id: 878, name: "Sci-Fi" }],
  },
  {
    id: "tt0110912",
    imdb_id: "tt0110912",
    title: "Pulp Fiction",
    overview: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
    poster_path: "https://images.metahub.space/poster/small/tt0110912/img",
    backdrop_path: "https://images.metahub.space/background/medium/tt0110912/img",
    release_date: "1994-10-14",
    vote_average: 8.9,
    media_type: "movie",
    tagline: "Just because you are a character doesn't mean you have character.",
    runtime: 154,
    genres: [{ id: 80, name: "Crime" }, { id: 18, name: "Drama" }],
  },
  {
    id: "tt11097384",
    imdb_id: "tt11097384",
    title: "Gladiator II",
    overview: "Years after witnessing the death of the revered hero Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered by the tyrannical Emperors who now lead Rome with an iron fist.",
    poster_path: "https://images.metahub.space/poster/small/tt11097384/img",
    backdrop_path: "https://images.metahub.space/background/medium/tt11097384/img",
    release_date: "2024-11-22",
    vote_average: 7.8,
    media_type: "movie",
    tagline: "Claim your destiny.",
    runtime: 148,
    genres: [{ id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 18, name: "Drama" }],
  },
  {
    id: "tt6263850",
    imdb_id: "tt6263850",
    title: "Deadpool & Wolverine",
    overview: "A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit-up again with an even more reluctant Wolverine.",
    poster_path: "https://images.metahub.space/poster/small/tt6263850/img",
    backdrop_path: "https://images.metahub.space/background/medium/tt6263850/img",
    release_date: "2024-07-26",
    vote_average: 8.0,
    media_type: "movie",
    tagline: "Come together.",
    runtime: 128,
    genres: [{ id: 28, name: "Action" }, { id: 35, name: "Comedy" }, { id: 878, name: "Sci-Fi" }],
  },
];

export async function getTrending(type: "all" | "movie" | "tv" = "all"): Promise<MediaItem[]> {
  // Try TMDB first if API key configured
  const tmdb = await fetchFromTMDB<{ results: MediaItem[] }>(`/trending/${type}/week`);
  if (tmdb?.results && tmdb.results.length > 0) {
    return tmdb.results.map((item) => ({
      ...item,
      title: item.title || item.name || "Untitled",
      media_type: (item.media_type as any) || (type === "tv" ? "tv" : "movie"),
    }));
  }

  // Use Cinemeta Stremio Catalog
  try {
    const cinemetaType = type === "tv" ? "series" : "movie";
    const res = await fetch(`${CINEMETA_BASE_URL}/catalog/${cinemetaType}/top.json`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.metas && data.metas.length > 0) {
        return data.metas.slice(0, 30).map((m: any) => mapCinemetaItem(m, type === "tv" ? "tv" : "movie"));
      }
    }
  } catch (e) {
    console.warn("Cinemeta fetch error", e);
  }

  return type === "tv" ? POPULAR_SERIES_FALLBACK : POPULAR_MOVIES_LIST;
}

export async function getPopularMovies(): Promise<MediaItem[]> {
  const tmdb = await fetchFromTMDB<{ results: MediaItem[] }>("/movie/popular");
  if (tmdb?.results && tmdb.results.length > 0) {
    return tmdb.results.map((i) => ({ ...i, media_type: "movie" }));
  }

  try {
    const res = await fetch(`${CINEMETA_BASE_URL}/catalog/movie/top.json`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.metas && data.metas.length > 0) {
        return data.metas.map((m: any) => mapCinemetaItem(m, "movie"));
      }
    }
  } catch {}

  return POPULAR_MOVIES_LIST;
}

export async function getTopRatedMovies(): Promise<MediaItem[]> {
  const tmdb = await fetchFromTMDB<{ results: MediaItem[] }>("/movie/top_rated");
  if (tmdb?.results && tmdb.results.length > 0) {
    return tmdb.results.map((i) => ({ ...i, media_type: "movie" }));
  }

  return POPULAR_MOVIES_LIST;
}

export async function getIndianMovies(): Promise<MediaItem[]> {
  return INDIAN_BLOCKBUSTERS;
}

export const POPULAR_SERIES_FALLBACK: MediaItem[] = [
  {
    id: "tt0903747",
    name: "Breaking Bad",
    title: "Breaking Bad",
    overview: "Walter White, a New Mexico chemistry teacher, enters the world of drugs and crime to secure his family's future.",
    poster_path: "https://images.metahub.space/poster/small/tt0903747/img",
    backdrop_path: "https://images.metahub.space/background/medium/tt0903747/img",
    release_date: "2008-01-20",
    vote_average: 9.5,
    media_type: "tv",
    imdb_id: "tt0903747",
    number_of_seasons: 5,
  },
  {
    id: "tt0944947",
    name: "Game of Thrones",
    title: "Game of Thrones",
    overview: "Seven noble families fight for control of the mythical land of Westeros.",
    poster_path: "https://images.metahub.space/poster/small/tt0944947/img",
    backdrop_path: "https://images.metahub.space/background/medium/tt0944947/img",
    release_date: "2011-04-17",
    vote_average: 9.2,
    media_type: "tv",
    imdb_id: "tt0944947",
    number_of_seasons: 8,
  },
  {
    id: "tt2575988",
    name: "Stranger Things",
    title: "Stranger Things",
    overview: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.",
    poster_path: "https://images.metahub.space/poster/small/tt2575988/img",
    backdrop_path: "https://images.metahub.space/background/medium/tt2575988/img",
    release_date: "2016-07-15",
    vote_average: 8.7,
    media_type: "tv",
    imdb_id: "tt2575988",
    number_of_seasons: 4,
  },
  {
    id: "tt8740790",
    name: "Arcane",
    title: "Arcane",
    overview: "Set in the utopian region of Piltover and the oppressed underground of Zaun, the story follows the origins of two iconic League champions-and the power that will tear them apart.",
    poster_path: "https://images.metahub.space/poster/small/tt8740790/img",
    backdrop_path: "https://images.metahub.space/background/medium/tt8740790/img",
    release_date: "2021-11-06",
    vote_average: 9.0,
    media_type: "tv",
    imdb_id: "tt8740790",
    number_of_seasons: 2,
  },
];

export async function getPopularTV(): Promise<MediaItem[]> {
  const tmdb = await fetchFromTMDB<{ results: MediaItem[] }>("/tv/popular");
  if (tmdb?.results && tmdb.results.length > 0) {
    return tmdb.results.map((i) => ({
      ...i,
      title: i.name || i.title,
      media_type: "tv",
    }));
  }

  try {
    const res = await fetch(`${CINEMETA_BASE_URL}/catalog/series/top.json`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.metas && data.metas.length > 0) {
        return data.metas.map((m: any) => mapCinemetaItem(m, "tv"));
      }
    }
  } catch {}

  return POPULAR_SERIES_FALLBACK;
}

export async function getAnimeList(): Promise<MediaItem[]> {
  const tmdb = await fetchFromTMDB<{ results: MediaItem[] }>("/discover/tv", {
    with_genres: "16",
    with_original_language: "ja",
    sort_by: "popularity.desc",
  });
  if (tmdb?.results && tmdb.results.length > 0) {
    return tmdb.results.map((i) => ({
      ...i,
      title: i.name || i.title,
      media_type: "anime",
    }));
  }

  return [
    {
      id: "tt2560140",
      name: "Attack on Titan",
      title: "Attack on Titan",
      overview: "Humans are pushed to the brink of extinction by giant humanoids known as Titans.",
      poster_path: "https://images.metahub.space/poster/small/tt2560140/img",
      backdrop_path: "https://images.metahub.space/background/medium/tt2560140/img",
      release_date: "2013-04-07",
      vote_average: 9.1,
      media_type: "anime",
      imdb_id: "tt2560140",
    },
    {
      id: "tt12590266",
      name: "Cyberpunk: Edgerunners",
      title: "Cyberpunk: Edgerunners",
      overview: "A street kid survives in a technology-obsessed city of the future by becoming a cyberpunk mercenary outlaw.",
      poster_path: "https://images.metahub.space/poster/small/tt12590266/img",
      backdrop_path: "https://images.metahub.space/background/medium/tt12590266/img",
      release_date: "2022-09-13",
      vote_average: 8.6,
      media_type: "anime",
      imdb_id: "tt12590266",
    },
    {
      id: "tt12343534",
      name: "Jujutsu Kaisen",
      title: "Jujutsu Kaisen",
      overview: "A boy swallows a cursed talisman and becomes cursed himself to save his friends.",
      poster_path: "https://images.metahub.space/poster/small/tt12343534/img",
      backdrop_path: "https://images.metahub.space/background/medium/tt12343534/img",
      release_date: "2020-10-03",
      vote_average: 8.8,
      media_type: "anime",
      imdb_id: "tt12343534",
    },
    {
      id: "tt9335498",
      name: "Demon Slayer: Kimetsu no Yaiba",
      title: "Demon Slayer: Kimetsu no Yaiba",
      overview: "A youth begins a quest to avenge his slaughtered family and cure his cursed sister.",
      poster_path: "https://images.metahub.space/poster/small/tt9335498/img",
      backdrop_path: "https://images.metahub.space/background/medium/tt9335498/img",
      release_date: "2019-04-06",
      vote_average: 8.7,
      media_type: "anime",
      imdb_id: "tt9335498",
    },
  ];
}

export async function searchCatalog(query: string): Promise<MediaItem[]> {
  if (!query.trim()) return [];
  const q = query.trim();

  // 1. Try TMDB search
  const tmdb = await fetchFromTMDB<{ results: MediaItem[] }>("/search/multi", { query: q });
  if (tmdb?.results && tmdb.results.length > 0) {
    return tmdb.results
      .filter((i) => i.media_type === "movie" || i.media_type === "tv")
      .map((i) => ({ ...i, title: i.title || i.name || "Untitled" }));
  }

  // 2. Query Cinemeta Stremio Catalog for movies and series
  try {
    const [movieRes, seriesRes] = await Promise.all([
      fetch(`${CINEMETA_BASE_URL}/catalog/movie/top/search=${encodeURIComponent(q)}.json`),
      fetch(`${CINEMETA_BASE_URL}/catalog/series/top/search=${encodeURIComponent(q)}.json`),
    ]);

    const items: MediaItem[] = [];

    if (movieRes.ok) {
      const data = await movieRes.json();
      if (data?.metas) {
        items.push(...data.metas.map((m: any) => mapCinemetaItem(m, "movie")));
      }
    }

    if (seriesRes.ok) {
      const data = await seriesRes.json();
      if (data?.metas) {
        items.push(...data.metas.map((m: any) => mapCinemetaItem(m, "tv")));
      }
    }

    if (items.length > 0) return items;
  } catch (err) {
    console.error("Cinemeta search failed", err);
  }

  // 3. Fallback filter
  const lowerQ = q.toLowerCase();
  return INDIAN_BLOCKBUSTERS.filter(
    (item) =>
      item.title.toLowerCase().includes(lowerQ) ||
      item.overview.toLowerCase().includes(lowerQ)
  );
}

export const TMDB_TO_IMDB: Record<string, string> = {
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

export async function getMediaDetails(id: string | number, type: "movie" | "tv" | "anime" = "movie"): Promise<MediaItem | null> {
  let strId = decodeURIComponent(String(id));

  // Map known TMDB ID to IMDb ID
  if (TMDB_TO_IMDB[strId]) {
    strId = TMDB_TO_IMDB[strId];
  }

  // 1. If it's an IMDb ID (`tt...`)
  if (strId.startsWith("tt")) {
    try {
      const cinemetaType = type === "tv" || type === "anime" ? "series" : "movie";
      const res = await fetch(`${CINEMETA_BASE_URL}/meta/${cinemetaType}/${strId}.json`, {
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.meta) {
          const item = mapCinemetaItem(data.meta, type);
          item.id = strId;
          return item;
        }
      }
    } catch (e) {
      console.warn("Cinemeta meta fetch error", e);
    }
  }

  // 2. If it's a TorBox library item
  if (strId.includes("library.torbox")) {
    const baseUrl = process.env.AIOSTREAMS_BASE_URL?.trim();
    if (baseUrl) {
      try {
        const res = await fetch(`${baseUrl.replace(/\/manifest\.json$/, "")}/meta/library/${strId}.json`);
        if (res.ok) {
          const data = await res.json();
          if (data?.meta) {
            let rawTitle = data.meta.name || "Cloud Media";
            rawTitle = rawTitle.replace(/^www\.[a-z0-9.-]+\s*-\s*/i, "").trim();
            const cleanTitle = rawTitle
              .replace(/[._]/g, " ")
              .replace(/\b(1080p|720p|2160p|4k|uhd|bluray|brrip|webrip|web-dl|web|dvdrip|x264|x265|hevc|aac|dts|ddp|flac|atmos|repack|proper|etrg|yify|rarbg|galaxy)\b.*/gi, "")
              .trim() || rawTitle;

            return {
              id: data.meta.id,
              title: cleanTitle,
              overview: data.meta.description || "Direct cached stream from your personal cloud library.",
              poster_path: data.meta.poster || null,
              backdrop_path: data.meta.background || null,
              vote_average: 9.0,
              media_type: type,
              imdb_id: data.meta.id,
              tagline: data.meta.description,
            };
          }
        }
      } catch (e) {
        console.warn("Torbox library meta error", e);
      }
    }
  }

  // 3. Try TMDB by numeric ID
  const cleanType = type === "anime" ? "tv" : type;
  const tmdbItem = await fetchFromTMDB<MediaItem>(`/${cleanType}/${id}`);
  if (tmdbItem) {
    const external = await fetchFromTMDB<{ imdb_id?: string }>(`/${cleanType}/${id}/external_ids`);
    let finalImdbId = external?.imdb_id || tmdbItem.imdb_id;

    if (!finalImdbId && tmdbItem.title) {
      try {
        const cinemetaType = cleanType === "tv" ? "series" : "movie";
        const cRes = await fetch(`${CINEMETA_BASE_URL}/catalog/${cinemetaType}/top/search=${encodeURIComponent(tmdbItem.title)}.json`);
        if (cRes.ok) {
          const cData = await cRes.json();
          if (cData?.metas?.[0]?.id) {
            finalImdbId = cData.metas[0].id;
          }
        }
      } catch {}
    }

    return {
      ...tmdbItem,
      title: tmdbItem.title || tmdbItem.name || "Untitled",
      media_type: type,
      imdb_id: finalImdbId || (typeof id === "string" && id.startsWith("tt") ? id : undefined),
    };
  }

  // 4. Check curated collections
  const found =
    INDIAN_BLOCKBUSTERS.find((i) => String(i.id) === strId || i.imdb_id === strId) ||
    POPULAR_MOVIES_LIST.find((i) => String(i.id) === strId || i.imdb_id === strId) ||
    POPULAR_SERIES_FALLBACK.find((i) => String(i.id) === strId || i.imdb_id === strId);
  if (found) return found;

  return null;
}

export async function getCastAndCredits(id: string | number, type: "movie" | "tv" = "movie"): Promise<CastMember[]> {
  const strId = String(id);
  if (strId.startsWith("tt")) {
    try {
      const cinemetaType = type === "tv" ? "series" : "movie";
      const res = await fetch(`${CINEMETA_BASE_URL}/meta/${cinemetaType}/${strId}.json`);
      if (res.ok) {
        const data = await res.json();
        const castList = data?.meta?.cast || [];
        return castList.map((name: string, index: number) => ({
          id: index + 1,
          name,
          character: "Cast",
          profile_path: null,
        }));
      }
    } catch {}
  }

  const tmdbCast = await fetchFromTMDB<{ cast: CastMember[] }>(`/${type}/${id}/credits`);
  return tmdbCast?.cast?.slice(0, 10) || [];
}

export async function getSeriesEpisodesAndMeta(
  tvId: string | number,
  seasonNumber: number
): Promise<{ episodes: Episode[]; totalSeasons: number }> {
  const strId = String(tvId);
  let totalSeasons = 1;

  // If it's an IMDb ID, query Cinemeta for series episode list!
  if (strId.startsWith("tt")) {
    try {
      const res = await fetch(`${CINEMETA_BASE_URL}/meta/series/${strId}.json`, {
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const data = await res.json();
        const videos: any[] = data?.meta?.videos || [];
        if (videos.length > 0) {
          const seasonNums = videos
            .map((v) => Number(v.season))
            .filter((s) => !isNaN(s) && s > 0);
          if (seasonNums.length > 0) {
            totalSeasons = Math.max(...seasonNums);
          }

          let seasonVids = videos.filter((v) => Number(v.season) === Number(seasonNumber));
          if (seasonVids.length === 0 && seasonNumber === 1) {
            seasonVids = videos;
          }

          const episodes: Episode[] = seasonVids.map((v, idx) => ({
            id: v.number || v.episode || idx + 1,
            name: v.name || v.title || `Episode ${v.number || v.episode || idx + 1}`,
            overview: v.overview || v.description || "Episode playback available in full quality.",
            episode_number: v.number || v.episode || idx + 1,
            season_number: Number(v.season) || seasonNumber,
            still_path: v.thumbnail || null,
            air_date: (v.released || v.firstAired || "").slice(0, 10),
            vote_average: v.rating ? parseFloat(v.rating) : 8.5,
          }));

          return { episodes, totalSeasons };
        }
      }
    } catch (e) {
      console.warn("Cinemeta episode query error", e);
    }
  }

  // TMDB fallback
  const tmdbSeries = await fetchFromTMDB<{ number_of_seasons?: number }>(`/tv/${tvId}`);
  if (tmdbSeries?.number_of_seasons) {
    totalSeasons = tmdbSeries.number_of_seasons;
  }
  const tmdbData = await fetchFromTMDB<{ episodes: Episode[] }>(`/tv/${tvId}/season/${seasonNumber}`);
  if (tmdbData?.episodes && tmdbData.episodes.length > 0) {
    return { episodes: tmdbData.episodes, totalSeasons };
  }

  const fallbackEpisodes = Array.from({ length: 10 }).map((_, idx) => ({
    id: idx + 1,
    name: `Episode ${idx + 1}`,
    overview: `Episode ${idx + 1} synopsis. Watch in ultra-clear streaming quality.`,
    episode_number: idx + 1,
    season_number: seasonNumber,
    still_path: null,
    air_date: "2024",
    vote_average: 8.5,
  }));

  return { episodes: fallbackEpisodes, totalSeasons };
}

export async function getSeasonEpisodes(tvId: string | number, seasonNumber: number): Promise<Episode[]> {
  const result = await getSeriesEpisodesAndMeta(tvId, seasonNumber);
  return result.episodes;
}
