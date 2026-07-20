export interface MediaItem {
  id: number | string;
  title: string;
  name?: string; // TV series title in TMDB
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count?: number;
  media_type?: "movie" | "tv" | "series" | "anime";
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  imdb_id?: string;
  tagline?: string;
  status?: string;
}

export interface StreamItem {
  name: string;
  description: string;
  url: string;
  behaviorHints?: {
    videoHash?: string;
    videoSize?: number;
    filename?: string;
    folderSize?: number;
    bingeGroup?: string;
    cached?: boolean;
  };
  // Parsed convenience attributes
  parsed?: {
    resolution?: "4K" | "1080p" | "720p" | "SD" | string;
    quality?: "Remux" | "BluRay" | "WEB-DL" | "WEBRip" | "HDRip" | string;
    size?: string;
    codec?: string;
    hdr?: boolean;
    dv?: boolean;
    audio?: string;
    channels?: string;
    source?: string;
    isMp4?: boolean;
    languages?: string[];
  };
}

export interface StreamResponse {
  streams: StreamItem[];
  error?: string;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  air_date: string;
  vote_average: number;
}

export interface Season {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
  episodes?: Episode[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface WatchHistoryItem {
  id: string | number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type: "movie" | "tv" | "series" | "anime";
  imdb_id?: string;
  watchedAt: number;
  progressSeconds?: number;
  durationSeconds?: number;
  season?: number;
  episode?: number;
}
