"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { MediaItem, Episode } from "@/types/movie";
import { StreamSelector } from "@/components/movie/StreamSelector";
import { MovieDetailsClient } from "@/components/movie/MovieDetailsClient";

interface SeriesDetailsClientProps {
  series: MediaItem;
  initialEpisodes: Episode[];
}

export function SeriesDetailsClient({
  series,
  initialEpisodes,
}: SeriesDetailsClientProps) {
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodes, setEpisodes] = useState<Episode[]>(initialEpisodes);
  const [totalSeasons, setTotalSeasons] = useState(series.number_of_seasons || 1);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  const handleSeasonChange = async (seasonNum: number) => {
    setSelectedSeason(seasonNum);
    setSelectedEpisode(1);
    setLoadingEpisodes(true);

    try {
      const res = await fetch(`/api/episodes?tvId=${series.id}&season=${seasonNum}`);
      if (res.ok) {
        const data = await res.json();
        if (data.episodes) setEpisodes(data.episodes);
        if (data.totalSeasons && data.totalSeasons > totalSeasons) {
          setTotalSeasons(data.totalSeasons);
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoadingEpisodes(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Action Buttons */}
      <MovieDetailsClient item={series} />

      {/* Season & Episode Selector: Clean header without badges */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            Episodes
          </h3>

          {/* Season Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {Array.from({ length: Math.max(totalSeasons, 1) }).map((_, idx) => {
              const seasonNum = idx + 1;
              const isSelected = selectedSeason === seasonNum;
              return (
                <button
                  key={seasonNum}
                  onClick={() => handleSeasonChange(seasonNum)}
                  className={`px-3 py-1 rounded-md text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-white text-black"
                      : "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300"
                  }`}
                >
                  Season {seasonNum}
                </button>
              );
            })}
          </div>
        </div>

        {/* Episode Carousel */}
        {loadingEpisodes ? (
          <div className="py-8 flex justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-zinc-400 border-t-white animate-spin" />
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
            {episodes.map((ep) => {
              const isSelected = selectedEpisode === ep.episode_number;
              const watchLink = `/watch/${series.id}?type=tv&season=${selectedSeason}&episode=${ep.episode_number}`;

              return (
                <div
                  key={ep.episode_number}
                  onClick={() => setSelectedEpisode(ep.episode_number)}
                  className={`w-[220px] shrink-0 p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-[#181820] border-zinc-400 text-white"
                      : "bg-[#121216] border-zinc-800 hover:border-zinc-700 text-zinc-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 mb-1">
                      <span>Episode {ep.episode_number}</span>
                      <Link
                        href={watchLink}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
                        title={`Watch Episode ${ep.episode_number}`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </Link>
                    </div>
                    <div className="text-xs font-medium text-white line-clamp-1">
                      {ep.name || `Episode ${ep.episode_number}`}
                    </div>
                    {ep.overview && (
                      <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">
                        {ep.overview}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stream Resolver */}
      <div className="p-6 rounded-xl bg-[#111115] border border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-white">
            Streams: S{selectedSeason} E{selectedEpisode}
          </h2>

          <Link
            href={`/watch/${series.id}?type=tv&season=${selectedSeason}&episode=${selectedEpisode}`}
            className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play Episode {selectedEpisode}</span>
          </Link>
        </div>

        <StreamSelector
          imdbId={series.imdb_id || String(series.id)}
          title={series.title || series.name}
          type="series"
          season={selectedSeason}
          episode={selectedEpisode}
          mediaId={series.id}
        />
      </div>
    </div>
  );
}
