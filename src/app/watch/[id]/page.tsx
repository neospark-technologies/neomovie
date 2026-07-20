import React from "react";
import { notFound } from "next/navigation";
import { getMediaDetails, getPosterUrl, getBackdropUrl } from "@/lib/tmdb";
import { WatchPageClient } from "@/components/player/WatchPageClient";

export const instant = false;

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string; season?: string; episode?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const mediaType = (query.type as "movie" | "tv" | "anime") || "movie";
  const season = parseInt(query.season || "1", 10);
  const episode = parseInt(query.episode || "1", 10);

  const media = await getMediaDetails(id, mediaType);

  if (!media) {
    notFound();
  }

  const posterUrl = getPosterUrl(media.poster_path, "w500", media.imdb_id);
  const backdropUrl = getBackdropUrl(media.backdrop_path, "original", media.imdb_id);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <WatchPageClient
          media={media}
          mediaType={mediaType}
          season={season}
          episode={episode}
          posterUrl={posterUrl}
          backdropUrl={backdropUrl}
        />
      </div>
    </div>
  );
}
