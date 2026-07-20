"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MediaItem, StreamItem, Episode } from "@/types/movie";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { StreamSelector } from "@/components/movie/StreamSelector";
import { Star, ExternalLink, ArrowLeft, Square, SkipForward } from "lucide-react";

interface WatchPageClientProps {
  media: MediaItem;
  mediaType: "movie" | "tv" | "anime";
  season: number;
  episode: number;
  posterUrl: string;
  backdropUrl?: string;
}

export function WatchPageClient({
  media,
  mediaType,
  season: initialSeason,
  episode: initialEpisode,
  posterUrl,
  backdropUrl,
}: WatchPageClientProps) {
  const router = useRouter();
  const [selectedStream, setSelectedStream] = useState<StreamItem | null>(null);

  // Dynamic Season & Episode state for TV series
  const [currentSeason, setCurrentSeason] = useState(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [totalSeasons, setTotalSeasons] = useState<number>(media.number_of_seasons || 1);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  const isSeries = mediaType === "tv" || mediaType === "anime";

  const resolvedImdbId =
    media.imdb_id || (typeof media.id === "string" && media.id.startsWith("tt") ? media.id : undefined);

  // Fetch episodes when currentSeason changes for series
  useEffect(() => {
    if (!isSeries) return;
    let isMounted = true;
    setLoadingEpisodes(true);

    fetch(`/api/episodes?tvId=${media.id}&season=${currentSeason}`)
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.episodes && Array.isArray(data.episodes)) {
          setEpisodes(data.episodes);
        }
        if (data.totalSeasons && data.totalSeasons > totalSeasons) {
          setTotalSeasons(data.totalSeasons);
        }
      })
      .catch((err) => console.warn("Failed to load episodes in watch client", err))
      .finally(() => {
        if (isMounted) setLoadingEpisodes(false);
      });

    return () => {
      isMounted = false;
    };
  }, [media.id, currentSeason, isSeries, totalSeasons]);

  // Episode & Season Switcher handlers
  const handleSelectEpisode = (epNum: number, seasonNum = currentSeason) => {
    if (epNum === currentEpisode && seasonNum === currentSeason) return;
    setSelectedStream(null);
    setCurrentSeason(seasonNum);
    setCurrentEpisode(epNum);

    const newUrl = `/watch/${media.id}?type=${mediaType}&season=${seasonNum}&episode=${epNum}`;
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", newUrl);
    }
  };

  const handleSelectSeason = (seasonNum: number) => {
    if (seasonNum === currentSeason) return;
    setSelectedStream(null);
    setCurrentSeason(seasonNum);
    setCurrentEpisode(1);

    const newUrl = `/watch/${media.id}?type=${mediaType}&season=${seasonNum}&episode=1`;
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", newUrl);
    }
  };

  // Next Episode logic
  const activeEpIndex = episodes.findIndex((e) => e.episode_number === currentEpisode);
  const hasNextInSeason = activeEpIndex >= 0 && activeEpIndex < episodes.length - 1;
  const hasNextSeason = currentSeason < totalSeasons;
  const hasNextEpisode = isSeries && (hasNextInSeason || hasNextSeason);

  const handleNextEpisode = () => {
    if (hasNextInSeason) {
      const nextEp = episodes[activeEpIndex + 1];
      handleSelectEpisode(nextEp.episode_number, currentSeason);
    } else if (hasNextSeason) {
      handleSelectSeason(currentSeason + 1);
    }
  };

  const titleWithEpisode = isSeries
    ? `${media.title} (S${currentSeason} E${currentEpisode})`
    : media.title;

  const handleBackToDetails = () => {
    window.dispatchEvent(new Event("neomovie-stop-playback"));
    document.querySelectorAll("video").forEach((v) => {
      try {
        v.pause();
        v.removeAttribute("src");
        v.load();
      } catch {}
    });
    document.querySelectorAll("iframe").forEach((f) => {
      try {
        f.src = "about:blank";
      } catch {}
    });
    router.push(isSeries ? `/series/${media.id}` : `/movie/${media.id}`);
  };

  const handleStopPlayback = () => {
    window.dispatchEvent(new Event("neomovie-stop-playback"));
    document.querySelectorAll("video").forEach((v) => {
      try {
        v.pause();
        v.removeAttribute("src");
        v.load();
      } catch {}
    });
    document.querySelectorAll("iframe").forEach((f) => {
      try {
        f.src = "about:blank";
      } catch {}
    });
    setSelectedStream(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation with Instant-Kill On Back */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <button
          onClick={handleBackToDetails}
          className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Details</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-white truncate max-w-[160px] sm:max-w-xs">
              {media.title}
            </span>
            {isSeries && (
              <span className="text-zinc-400 font-mono text-[11px]">
                S{currentSeason} E{currentEpisode}
              </span>
            )}
          </div>

          <button
            onClick={handleStopPlayback}
            className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-red-950/40 text-zinc-300 hover:text-red-400 border border-zinc-700/80 hover:border-red-900/60 text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Stop video and turn off player"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Turn Off</span>
          </button>
        </div>
      </div>

      {/* Video Player Display */}
      <div className="space-y-3">
        <VideoPlayer
          streamUrl={selectedStream?.url || ""}
          title={titleWithEpisode}
          poster={posterUrl}
          backdrop={backdropUrl}
          mediaId={media.id}
          imdbId={resolvedImdbId}
          mediaType={mediaType}
          season={currentSeason}
          episode={currentEpisode}
          hasNextEpisode={hasNextEpisode}
          onNextEpisode={handleNextEpisode}
          onStopPlayback={handleStopPlayback}
        />

        {/* Active Stream Info Bar */}
        {selectedStream && (
          <div className="p-3 rounded-lg bg-[#111115] border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Stream:</span>
              <span className="font-medium text-white truncate max-w-sm sm:max-w-md">
                {selectedStream.behaviorHints?.filename || selectedStream.name}
              </span>
              {selectedStream.parsed?.resolution && (
                <span className="text-zinc-400 font-medium text-[11px]">
                  ({selectedStream.parsed.resolution})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {hasNextEpisode && (
                <button
                  onClick={handleNextEpisode}
                  className="px-2.5 py-1 rounded-md bg-white text-black hover:bg-zinc-200 font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                  title="Next Episode"
                >
                  <SkipForward className="w-3 h-3" />
                  <span>Next Ep</span>
                </button>
              )}

              <a
                href={`vlc://${selectedStream.url}`}
                onClick={() => window.dispatchEvent(new Event("neomovie-stop-playback"))}
                className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium text-[11px] flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                VLC
              </a>
              <a
                href={`mpv://${selectedStream.url}`}
                onClick={() => window.dispatchEvent(new Event("neomovie-stop-playback"))}
                className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium text-[11px] flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                MPV
              </a>
              <button
                onClick={handleStopPlayback}
                className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-red-950/40 text-zinc-300 hover:text-red-400 border border-zinc-700/80 hover:border-red-900/60 font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                title="Stop playback"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Turn Off</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Series Season & Episode Switching Panel (Available on watch page!) */}
      {isSeries && (
        <div className="p-4 rounded-xl bg-[#111115] border border-zinc-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Episodes • Season {currentSeason}
            </h3>

            {/* Season Selector Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {Array.from({ length: Math.max(totalSeasons, 1) }).map((_, idx) => {
                const seasonNum = idx + 1;
                const isSelected = currentSeason === seasonNum;
                return (
                  <button
                    key={seasonNum}
                    onClick={() => handleSelectSeason(seasonNum)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-white text-black"
                        : "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white"
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
            <div className="py-6 flex justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-zinc-400 border-t-white animate-spin" />
            </div>
          ) : (
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
              {episodes.map((ep) => {
                const isSelected = currentEpisode === ep.episode_number;
                return (
                  <button
                    key={ep.episode_number}
                    onClick={() => handleSelectEpisode(ep.episode_number)}
                    className={`w-[180px] shrink-0 p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-[#181820] border-zinc-400 text-white"
                        : "bg-[#121216] border-zinc-800/80 hover:border-zinc-700 text-zinc-300 hover:text-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-400 mb-1">
                        <span>Episode {ep.episode_number}</span>
                        {isSelected && (
                          <span className="text-[9px] text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded">
                            Playing
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-medium text-white line-clamp-1">
                        {ep.name || `Episode ${ep.episode_number}`}
                      </div>
                      {ep.overview && (
                        <p className="text-[10px] text-zinc-400 line-clamp-2 mt-1 leading-snug">
                          {ep.overview}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Stream Selection & Media Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 rounded-xl bg-[#111115] border border-zinc-800">
          <StreamSelector
            imdbId={resolvedImdbId}
            mediaId={media.id}
            title={media.title}
            type={isSeries ? "series" : "movie"}
            season={currentSeason}
            episode={currentEpisode}
            selectedStreamUrl={selectedStream?.url}
            onSelectStream={(stream) => setSelectedStream(stream)}
          />
        </div>

        {/* Media Sidebar Information: Clean, no badges */}
        <div className="lg:col-span-4 space-y-3 p-6 rounded-xl bg-[#111115] border border-zinc-800">
          <h2 className="text-base font-bold text-white leading-snug">{media.title}</h2>

          <div className="flex items-center gap-3 text-xs text-zinc-400">
            {media.vote_average ? (
              <div className="flex items-center gap-1 text-white font-medium">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{media.vote_average.toFixed(1)}</span>
              </div>
            ) : null}
            <span>•</span>
            <span>{(media.release_date || media.first_air_date || "").slice(0, 4)}</span>
          </div>

          {media.overview && (
            <p className="text-xs text-zinc-400 leading-relaxed pt-1">
              {media.overview}
            </p>
          )}

          {media.genres && media.genres.length > 0 && (
            <div className="pt-2 flex flex-wrap gap-1.5">
              {media.genres.map((g) => (
                <span
                  key={g.id}
                  className="px-2 py-0.5 rounded bg-zinc-800 text-[11px] text-zinc-300"
                >
                  {g.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
