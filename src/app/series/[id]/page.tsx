import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import { getMediaDetails, getSeasonEpisodes, getBackdropUrl, getPosterUrl } from "@/lib/tmdb";
import { SeriesDetailsClient } from "@/components/series/SeriesDetailsClient";

export const instant = false;

export default async function SeriesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const series = await getMediaDetails(id, "tv");

  if (!series) {
    notFound();
  }

  const initialEpisodes = await getSeasonEpisodes(id, 1);
  const backdropUrl = getBackdropUrl(series.backdrop_path, "original", series.imdb_id);
  const posterUrl = getPosterUrl(series.poster_path, "w500", series.imdb_id);
  const year = (series.first_air_date || "").slice(0, 4);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 pb-20">
      {/* Backdrop Header */}
      <div className="relative w-full h-[50vh] min-h-[380px] max-h-[550px] overflow-hidden select-none">
        <img
          src={backdropUrl}
          alt={series.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-top opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-[#0a0a0c]/80 to-transparent w-full md:w-2/3" />

        {/* Back Link */}
        <div className="absolute top-6 left-4 sm:left-8 z-20">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse</span>
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Poster Column */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="rounded-xl overflow-hidden shadow-2xl border border-zinc-800 bg-[#121216]">
              <img
                src={posterUrl}
                alt={series.title}
                referrerPolicy="no-referrer"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          {/* Details Column: NO badge above heading, NO paragraph under heading */}
          <div className="md:col-span-8 lg:col-span-9 space-y-6">
            <div className="space-y-3">
              {/* Heading stands clean at top */}
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                {series.title}
              </h1>

              {/* Meta Specifications */}
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-zinc-300 py-1">
                {series.vote_average ? (
                  <div className="flex items-center gap-1 text-white font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{series.vote_average.toFixed(1)}</span>
                  </div>
                ) : null}

                {year && (
                  <>
                    <span>•</span>
                    <span>{year}</span>
                  </>
                )}

                {series.number_of_seasons ? (
                  <>
                    <span>•</span>
                    <span>{series.number_of_seasons} Seasons</span>
                  </>
                ) : null}

                {series.genres && series.genres.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{series.genres.map((g) => g.name).join(", ")}</span>
                  </>
                )}
              </div>
            </div>

            {/* Synopsis */}
            {series.overview && (
              <div className="space-y-2">
                <p className="text-zinc-300 text-sm leading-relaxed max-w-3xl">
                  {series.overview}
                </p>
              </div>
            )}

            {/* Interactive Seasons, Episodes & Stream Selector */}
            <SeriesDetailsClient
              series={series}
              initialEpisodes={initialEpisodes}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
