import React, { Suspense } from "react";
import {
  getTrending,
  getPopularMovies,
  getPopularTV,
  getAnimeList,
  getIndianMovies,
  getTorboxItems,
} from "@/lib/tmdb";
import { ExploreClient } from "@/components/explore/ExploreClient";

export default async function ExplorePage() {
  const [trending, movies, tv, anime, indian, torbox] = await Promise.all([
    getTrending("all"),
    getPopularMovies(),
    getPopularTV(),
    getAnimeList(),
    getIndianMovies(),
    getTorboxItems(),
  ]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white pb-20">
      <Suspense
        fallback={
          <div className="py-24 flex justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-zinc-600 border-t-white animate-spin" />
          </div>
        }
      >
        <ExploreClient
          initialTrending={trending}
          initialMovies={movies}
          initialTV={tv}
          initialAnime={anime}
          initialIndian={indian}
          initialTorbox={torbox}
        />
      </Suspense>
    </div>
  );
}
