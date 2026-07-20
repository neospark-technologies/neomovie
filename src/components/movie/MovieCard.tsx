"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Bookmark, Film, Check } from "lucide-react";
import { MediaItem } from "@/types/movie";
import { getPosterUrl } from "@/lib/tmdb";
import { isInWatchlist, addToWatchlist, removeFromWatchlist } from "@/lib/storage";

interface MovieCardProps {
  item: MediaItem;
  priority?: boolean;
}

export function MovieCard({ item, priority = false }: MovieCardProps) {
  const [inWatchlist, setInWatchlist] = useState(false);
  const [triedMetahub, setTriedMetahub] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setInWatchlist(isInWatchlist(item.id));
    const handleUpdate = () => setInWatchlist(isInWatchlist(item.id));
    window.addEventListener("neomovie-watchlist-updated", handleUpdate);
    return () => window.removeEventListener("neomovie-watchlist-updated", handleUpdate);
  }, [item.id]);

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWatchlist) {
      removeFromWatchlist(item.id);
    } else {
      addToWatchlist(item);
    }
  };

  const title = item.title || item.name || "Untitled";
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const isSeries = item.media_type === "tv" || item.media_type === "series" || item.media_type === "anime";
  const detailUrl = isSeries ? `/series/${item.id}` : `/movie/${item.id}`;

  const imdbId = item.imdb_id || (typeof item.id === "string" && item.id.startsWith("tt") ? item.id : undefined);

  let currentPosterUrl: string | null = null;
  if (!imgError) {
    if (triedMetahub && imdbId) {
      currentPosterUrl = `https://images.metahub.space/poster/small/${imdbId}/img`;
    } else if (item.poster_path) {
      currentPosterUrl = getPosterUrl(item.poster_path, "w500");
    } else if (imdbId) {
      currentPosterUrl = `https://images.metahub.space/poster/small/${imdbId}/img`;
    }
  }

  const handleImageError = () => {
    if (!triedMetahub && imdbId && currentPosterUrl !== `https://images.metahub.space/poster/small/${imdbId}/img`) {
      setTriedMetahub(true);
    } else {
      setImgError(true);
    }
  };

  return (
    <div className="group relative flex flex-col rounded-xl overflow-hidden bg-[#121216] border border-zinc-800/80 hover:border-zinc-600 transition-all duration-200 select-none">
      <Link href={detailUrl} className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-900 block">
        {currentPosterUrl ? (
          <img
            src={currentPosterUrl}
            alt={title}
            loading={priority ? "eager" : "lazy"}
            referrerPolicy="no-referrer"
            onError={handleImageError}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
          />
        ) : (
          /* Clean Matte Fallback Card for Items Without Posters */
          <div className="w-full h-full flex flex-col justify-between p-3.5 bg-zinc-900 relative">
            <div className="w-7 h-7 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-400">
              <Film className="w-3.5 h-3.5" />
            </div>

            <div className="my-auto py-2">
              <div className="text-xs font-semibold text-white line-clamp-3 leading-snug">
                {title}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                {year || "2026"}
              </div>
            </div>

            <div className="text-[10px] text-zinc-500 font-medium">
              Available to Stream
            </div>
          </div>
        )}

        {/* Hover overlay with minimal Play button */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>

        {/* Watchlist Quick Button (minimal top-right icon, no badge) */}
        <button
          onClick={handleWatchlistToggle}
          className={`absolute top-2 right-2 p-1.5 rounded-md backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100 ${
            inWatchlist
              ? "opacity-100 bg-white text-black"
              : "bg-black/70 hover:bg-black text-zinc-300 hover:text-white"
          }`}
          title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
        >
          {inWatchlist ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
        </button>
      </Link>

      {/* Info text below poster (no badge chips) */}
      <div className="p-2.5 flex flex-col justify-between bg-[#121216]">
        <Link href={detailUrl} className="block">
          <h3 className="font-medium text-xs sm:text-sm text-zinc-100 group-hover:text-white transition-colors line-clamp-1" title={title}>
            {title}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
          <span>{year || "N/A"}</span>
          {item.vote_average ? (
            <>
              <span>•</span>
              <span className="text-zinc-300">★ {item.vote_average.toFixed(1)}</span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
