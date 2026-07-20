"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Trash2, X, Film } from "lucide-react";
import {
  getWatchHistory,
  clearWatchHistory,
  removeFromWatchHistory,
  WatchHistoryItem,
} from "@/lib/storage";
import { getBackdropUrl, getPosterUrl } from "@/lib/tmdb";

function ContinueWatchingCard({ item }: { item: WatchHistoryItem }) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  const imdbId =
    item.imdb_id || (typeof item.id === "string" && item.id.startsWith("tt") ? item.id : undefined);

  // Build ordered list of candidate image URLs to try
  const candidates: string[] = [];
  if (item.backdrop_path) {
    candidates.push(getBackdropUrl(item.backdrop_path, "w780", imdbId));
  }
  if (item.poster_path) {
    candidates.push(getPosterUrl(item.poster_path, "w500", imdbId));
  }
  if (imdbId) {
    candidates.push(`https://images.metahub.space/background/medium/${imdbId}/img`);
    candidates.push(`https://images.metahub.space/poster/small/${imdbId}/img`);
  }

  // Deduplicate candidates
  const uniqueCandidates = Array.from(new Set(candidates.filter(Boolean)));
  const currentSrc = !hasError && uniqueCandidates.length > 0 ? uniqueCandidates[candidateIndex] : null;

  const handleImageError = () => {
    if (candidateIndex + 1 < uniqueCandidates.length) {
      setCandidateIndex((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  const progressPercent =
    item.durationSeconds && item.durationSeconds > 0
      ? Math.min(100, Math.round(((item.progressSeconds || 0) / item.durationSeconds) * 100))
      : 0;

  const isSeries = item.media_type === "tv" || item.media_type === "series" || item.media_type === "anime";
  const watchUrl = `/watch/${item.id}?type=${item.media_type}${
    item.season ? `&season=${item.season}&episode=${item.episode}` : ""
  }`;

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeFromWatchHistory(item.id, item.season, item.episode);
  };

  return (
    <div className="w-[210px] sm:w-[230px] shrink-0 group relative rounded-xl overflow-hidden bg-[#121216] border border-zinc-800/90 hover:border-zinc-600 transition-all block select-none">
      <Link href={watchUrl} className="block relative aspect-video w-full bg-[#181820] overflow-hidden">
        {currentSrc ? (
          <img
            src={currentSrc}
            alt={item.title}
            referrerPolicy="no-referrer"
            onError={handleImageError}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          /* High-end matte fallback card when no image exists or all fail */
          <div className="w-full h-full flex flex-col justify-between p-3 bg-gradient-to-br from-zinc-900 to-[#121218]">
            <div className="w-7 h-7 rounded-md bg-zinc-800/80 flex items-center justify-center text-zinc-400">
              <Film className="w-3.5 h-3.5" />
            </div>
            <div className="my-auto pr-6">
              <div className="text-xs font-semibold text-white line-clamp-1 leading-snug">
                {item.title}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                {isSeries && item.season ? `S${item.season} E${item.episode}` : "Movie"}
              </div>
            </div>
          </div>
        )}

        {/* Hover play icon overlay */}
        <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>

        {/* Individual dismiss button */}
        <button
          onClick={handleRemove}
          className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/70 hover:bg-black text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
          title="Remove from history"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Red cinema progress scrubber */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-zinc-800">
          <div
            className="h-full bg-red-600 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </Link>

      {/* Info footer */}
      <Link href={watchUrl} className="p-2.5 block bg-[#121216]">
        <h4 className="text-xs font-medium text-white truncate group-hover:text-zinc-200 transition-colors" title={item.title}>
          {item.title}
        </h4>
        <div className="flex items-center justify-between mt-1 text-[10px] text-zinc-400">
          <span>
            {isSeries && item.season ? `S${item.season} E${item.episode}` : "Movie"}
          </span>
          <span className="font-mono text-zinc-300">{progressPercent}%</span>
        </div>
      </Link>
    </div>
  );
}

export function ContinueWatchingRow() {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);

  useEffect(() => {
    const update = () => setHistory(getWatchHistory());
    update();
    window.addEventListener("neomovie-history-updated", update);
    return () => window.removeEventListener("neomovie-history-updated", update);
  }, []);

  if (!history || history.length === 0) return null;

  return (
    <section className="py-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Clean Header: No badge above heading, no paragraph under heading */}
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
          Continue Watching
        </h2>

        <button
          onClick={clearWatchHistory}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
          title="Clear all watch history"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {history.map((item) => (
          <ContinueWatchingCard
            key={`${item.id}-${item.season || 0}-${item.episode || 0}`}
            item={item}
          />
        ))}
      </div>
    </section>
  );
}
