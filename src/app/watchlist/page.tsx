"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Trash2, ArrowRight } from "lucide-react";
import { MediaItem } from "@/types/movie";
import { getWatchlist } from "@/lib/storage";
import { MovieCard } from "@/components/movie/MovieCard";

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<MediaItem[]>([]);

  useEffect(() => {
    const update = () => setWatchlist(getWatchlist());
    update();
    window.addEventListener("neomovie-watchlist-updated", update);
    return () => window.removeEventListener("neomovie-watchlist-updated", update);
  }, []);

  const handleClear = () => {
    if (confirm("Are you sure you want to clear your entire watchlist?")) {
      localStorage.removeItem("neomovie_watchlist");
      window.dispatchEvent(new Event("neomovie-watchlist-updated"));
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header: NO badge above heading, NO paragraph under heading */}
        <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Watchlist
          </h1>

          {watchlist.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Watchlist Grid */}
        <div className="mt-8">
          {watchlist.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {watchlist.map((item) => (
                <MovieCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center space-y-4">
              <h3 className="text-base font-medium text-white">Your watchlist is empty</h3>
              <div>
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-xs bg-white hover:bg-zinc-200 text-black transition-colors"
                >
                  <span>Explore Titles</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
