"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Bookmark, Check, Share2 } from "lucide-react";
import { MediaItem } from "@/types/movie";
import { isInWatchlist, addToWatchlist, removeFromWatchlist } from "@/lib/storage";

interface MovieDetailsClientProps {
  item: MediaItem;
}

export function MovieDetailsClient({ item }: MovieDetailsClientProps) {
  const [inWatchlist, setInWatchlist] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    setInWatchlist(isInWatchlist(item.id));
    const handleUpdate = () => setInWatchlist(isInWatchlist(item.id));
    window.addEventListener("neomovie-watchlist-updated", handleUpdate);
    return () => window.removeEventListener("neomovie-watchlist-updated", handleUpdate);
  }, [item.id]);

  const toggleWatchlist = () => {
    if (inWatchlist) {
      removeFromWatchlist(item.id);
    } else {
      addToWatchlist(item);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const isSeries = item.media_type === "tv" || item.media_type === "anime";
  const watchUrl = `/watch/${item.id}?type=${isSeries ? "tv" : "movie"}`;

  return (
    <div className="flex flex-wrap items-center gap-3 pt-1">
      <Link
        href={watchUrl}
        className="px-6 py-2.5 rounded-lg font-semibold text-sm bg-white hover:bg-zinc-200 text-black flex items-center gap-2 transition-colors"
      >
        <Play className="w-4 h-4 fill-current" />
        <span>Watch Now</span>
      </Link>

      <button
        onClick={toggleWatchlist}
        className="px-4 py-2.5 rounded-lg font-medium text-sm bg-zinc-800/80 hover:bg-zinc-700 text-white border border-zinc-700 flex items-center gap-2 transition-colors"
      >
        {inWatchlist ? (
          <>
            <Check className="w-4 h-4 text-zinc-300" />
            <span>In Watchlist</span>
          </>
        ) : (
          <>
            <Bookmark className="w-4 h-4" />
            <span>Add to Watchlist</span>
          </>
        )}
      </button>

      <button
        onClick={handleShare}
        className="p-2.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white transition-colors"
        title="Share link"
      >
        <Share2 className="w-4 h-4" />
      </button>
      {copiedShare && (
        <span className="text-xs text-zinc-400">Link copied</span>
      )}
    </div>
  );
}
