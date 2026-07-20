import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Clock,
  Calendar,
  Users,
} from "lucide-react";
import { getMediaDetails, getCastAndCredits, getBackdropUrl, getPosterUrl } from "@/lib/tmdb";
import { StreamSelector } from "@/components/movie/StreamSelector";
import { MovieDetailsClient } from "@/components/movie/MovieDetailsClient";

export const instant = false;

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movie = await getMediaDetails(id, "movie");

  if (!movie) {
    notFound();
  }

  const cast = await getCastAndCredits(id, "movie");
  const backdropUrl = getBackdropUrl(movie.backdrop_path, "original", movie.imdb_id);
  const posterUrl = getPosterUrl(movie.poster_path, "w500", movie.imdb_id);
  const year = (movie.release_date || "").slice(0, 4);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 pb-20">
      {/* Backdrop Header */}
      <div className="relative w-full h-[50vh] min-h-[380px] max-h-[550px] overflow-hidden select-none">
        <img
          src={backdropUrl}
          alt={movie.title}
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
                alt={movie.title}
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
                {movie.title}
              </h1>

              {/* Meta Specifications */}
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-zinc-300 py-1">
                {movie.vote_average ? (
                  <div className="flex items-center gap-1 text-white font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{movie.vote_average.toFixed(1)}</span>
                  </div>
                ) : null}

                {year && (
                  <>
                    <span>•</span>
                    <span>{year}</span>
                  </>
                )}

                {movie.runtime ? (
                  <>
                    <span>•</span>
                    <span>
                      {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                    </span>
                  </>
                ) : null}

                {movie.genres && movie.genres.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{movie.genres.map((g) => g.name).join(", ")}</span>
                  </>
                )}
              </div>
            </div>

            {/* Interactive Actions (Watchlist, Watch Now, Share) */}
            <MovieDetailsClient item={movie} />

            {/* Synopsis */}
            {movie.overview && (
              <div className="space-y-2 pt-2">
                <p className="text-zinc-300 text-sm leading-relaxed max-w-3xl">
                  {movie.overview}
                </p>
              </div>
            )}

            {/* Cast row */}
            {cast && cast.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-zinc-800/80">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Cast
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar py-1">
                  {cast.slice(0, 8).map((c) => (
                    <div key={c.id} className="w-16 shrink-0 text-center space-y-1">
                      <div className="w-14 h-14 mx-auto rounded-full overflow-hidden bg-zinc-800 border border-zinc-700">
                        {c.profile_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w185${c.profile_path}`}
                            alt={c.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-500">
                            {c.name.slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] font-medium text-white truncate">{c.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stream Resolver Section: NO paragraph under heading */}
        <div className="mt-12 p-6 rounded-xl bg-[#111115] border border-zinc-800">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white">
              Streams
            </h2>
          </div>

          <StreamSelector
            imdbId={movie.imdb_id || String(movie.id)}
            title={movie.title}
            type="movie"
            mediaId={movie.id}
          />
        </div>
      </div>
    </div>
  );
}
