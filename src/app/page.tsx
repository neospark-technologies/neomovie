import React from "react";
import {
  getTrending,
  getPopularMovies,
  getPopularTV,
  getAnimeList,
  getIndianMovies,
  getTorboxItems,
} from "@/lib/tmdb";
import { HeroBanner } from "@/components/home/HeroBanner";
import { MovieRow } from "@/components/home/MovieRow";
import { ContinueWatchingRow } from "@/components/home/ContinueWatchingRow";

export default async function HomePage() {
  const [trending, popularMovies, indianMovies, popularTV, animeList, torboxItems] =
    await Promise.all([
      getTrending("all"),
      getPopularMovies(),
      getIndianMovies(),
      getPopularTV(),
      getAnimeList(),
      getTorboxItems(),
    ]);

  return (
    <div className="flex flex-col min-h-screen pb-16 bg-[#0a0a0c]">
      {/* Hero Banner */}
      <HeroBanner items={indianMovies.concat(trending).slice(0, 5)} />

      {/* Continue Watching */}
      <ContinueWatchingRow />

      {/* Movie & Series Rows */}
      <div className="space-y-2 mt-2">
        {/* Bollywood & Indian Cinema */}
        <MovieRow
          title="Bollywood & Indian Blockbusters"
          items={indianMovies}
          exploreUrl="/explore?type=indian"
        />

        {/* User's TorBox Debrid Cloud Library */}
        {torboxItems.length > 0 && (
          <MovieRow
            title="TorBox Cloud Library"
            items={torboxItems}
            exploreUrl="/explore?type=torbox"
          />
        )}

        {/* Trending Worldwide */}
        <MovieRow
          title="Trending This Week"
          items={trending}
          exploreUrl="/explore?type=all"
        />

        {/* Blockbuster Movies */}
        <MovieRow
          title="Popular Movies"
          items={popularMovies}
          exploreUrl="/explore?type=movie"
        />

        {/* Popular TV Shows */}
        <MovieRow
          title="Popular TV Shows"
          items={popularTV}
          exploreUrl="/explore?type=tv"
        />

        {/* Anime Series */}
        <MovieRow
          title="Anime Series"
          items={animeList}
          exploreUrl="/explore?type=anime"
        />
      </div>
    </div>
  );
}
