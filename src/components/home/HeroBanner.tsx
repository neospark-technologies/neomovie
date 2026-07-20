"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Info, Bookmark, Star, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { MediaItem } from "@/types/movie";
import { getBackdropUrl } from "@/lib/tmdb";
import { isInWatchlist, addToWatchlist, removeFromWatchlist } from "@/lib/storage";

interface HeroBannerProps {
  items: MediaItem[];
}

export function HeroBanner({ items }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inWatchlist, setInWatchlist] = useState(false);

  const featuredList = items.slice(0, 5);
  const current = featuredList[currentIndex] || items[0];

  useEffect(() => {
    if (!current) return;
    setInWatchlist(isInWatchlist(current.id));
    const handleUpdate = () => setInWatchlist(isInWatchlist(current.id));
    window.addEventListener("neomovie-watchlist-updated", handleUpdate);
    return () => window.removeEventListener("neomovie-watchlist-updated", handleUpdate);
  }, [current]);

  // Auto rotate banner every 8 seconds
  useEffect(() => {
    if (featuredList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredList.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [featuredList.length]);

  if (!current) return null;

  const title = current.title || current.name || "Featured Title";
  const year = (current.release_date || current.first_air_date || "").slice(0, 4);
  const isSeries = current.media_type === "tv" || current.media_type === "anime";
  const watchUrl = `/watch/${current.id}?type=${current.media_type || "movie"}`;
  const detailUrl = isSeries ? `/series/${current.id}` : `/movie/${current.id}`;

  const imdbId = current.imdb_id || (typeof current.id === "string" && current.id.startsWith("tt") ? current.id : undefined);
  const [backdropSrc, setBackdropSrc] = useState<string>(getBackdropUrl(current.backdrop_path, "original", imdbId));

  useEffect(() => {
    setBackdropSrc(getBackdropUrl(current.backdrop_path, "original", imdbId));
  }, [current.id, current.backdrop_path, imdbId]);

  const handleBackdropError = () => {
    if (imdbId && backdropSrc !== `https://images.metahub.space/background/medium/${imdbId}/img`) {
      setBackdropSrc(`https://images.metahub.space/background/medium/${imdbId}/img`);
    }
  };

  const handleWatchlistToggle = () => {
    if (inWatchlist) {
      removeFromWatchlist(current.id);
    } else {
      addToWatchlist(current);
    }
  };

  return (
    <div className="relative w-full h-[65vh] min-h-[480px] max-h-[700px] overflow-hidden select-none bg-black">
      {/* Background Backdrop Image */}
      <div className="absolute inset-0">
        <img
          key={`${current.id}-${backdropSrc}`}
          src={backdropSrc}
          alt={title}
          referrerPolicy="no-referrer"
          onError={handleBackdropError}
          className="w-full h-full object-cover object-top opacity-40 transition-opacity duration-700"
        />
        {/* Cinematic Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-[#0a0a0c]/80 to-transparent w-full md:w-3/5" />
      </div>

      {/* Hero Content: NO badge above heading, NO paragraph under heading */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-14 z-10">
        <div className="max-w-2xl space-y-4">
          {/* Main Title at top */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
            {title}
          </h1>

          {/* Clean Inline Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-zinc-300 font-medium">
            {current.vote_average ? (
              <div className="flex items-center gap-1 text-white font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{current.vote_average.toFixed(1)}</span>
              </div>
            ) : null}
            {year && <span>{year}</span>}
            {current.genres && current.genres.length > 0 && (
              <span>{current.genres.map((g) => g.name).slice(0, 2).join(", ")}</span>
            )}
          </div>

          {/* Action Buttons: Solid, non-AI styling */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={watchUrl}
              className="px-6 py-2.5 rounded-lg font-semibold text-sm bg-white hover:bg-zinc-200 text-black flex items-center gap-2 transition-colors"
            >
              <Play className="w-4 h-4 fill-current" />
              Watch Now
            </Link>

            <Link
              href={detailUrl}
              className="px-5 py-2.5 rounded-lg font-medium text-sm bg-zinc-800/80 hover:bg-zinc-700 text-white border border-zinc-700 flex items-center gap-2 transition-colors"
            >
              <Info className="w-4 h-4 text-zinc-400" />
              Details
            </Link>

            <button
              onClick={handleWatchlistToggle}
              className="p-2.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-white border border-zinc-700 transition-colors"
              title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
            >
              {inWatchlist ? <Check className="w-4 h-4 text-zinc-300" /> : <Bookmark className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Carousel navigation buttons */}
      <div className="absolute bottom-6 right-4 sm:right-8 z-20 flex items-center gap-2">
        <button
          onClick={() =>
            setCurrentIndex((prev) => (prev === 0 ? featuredList.length - 1 : prev - 1))
          }
          className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 px-2">
          {featuredList.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1 rounded-full transition-all ${
                idx === currentIndex ? "w-5 bg-white" : "w-2 bg-zinc-700 hover:bg-zinc-500"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % featuredList.length)}
          className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
