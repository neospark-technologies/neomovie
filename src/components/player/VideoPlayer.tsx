"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Tv,
  ExternalLink,
  Copy,
  Check,
  Subtitles,
  Square,
  SkipForward,
} from "lucide-react";
import Hls from "hls.js";
import { saveWatchProgress } from "@/lib/storage";

interface SubtitleTrack {
  id: string;
  url: string;
  lang: string;
  label: string;
}

interface VideoPlayerProps {
  streamUrl: string;
  title: string;
  poster?: string;
  backdrop?: string;
  mediaId: string | number;
  imdbId?: string;
  mediaType?: "movie" | "tv" | "series" | "anime";
  season?: number;
  episode?: number;
  hasNextEpisode?: boolean;
  onNextEpisode?: () => void;
  onOpenExternal?: () => void;
  onStopPlayback?: () => void;
}

export function VideoPlayer({
  streamUrl,
  title,
  poster,
  backdrop,
  mediaId,
  imdbId,
  mediaType = "movie",
  season = 1,
  episode = 1,
  hasNextEpisode = false,
  onNextEpisode,
  onStopPlayback,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [playerMode, setPlayerMode] = useState<"debrid" | "embed">("debrid");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);
  const [selectedSub, setSelectedSub] = useState<string>("off");
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stop all active playback (audio and video) immediately
  const handleStopAll = () => {
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      } catch {}
    }
    if (iframeRef.current) {
      try {
        iframeRef.current.src = "about:blank";
      } catch {}
    }
    setIsPlaying(false);
    onStopPlayback?.();
  };

  // Immediate stop on route change, back navigation, or unmount
  useEffect(() => {
    const handleStop = () => {
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.removeAttribute("src");
          videoRef.current.load();
        } catch {}
      }
      if (iframeRef.current) {
        try {
          iframeRef.current.src = "about:blank";
        } catch {}
      }
      setIsPlaying(false);
    };

    window.addEventListener("popstate", handleStop);
    window.addEventListener("pagehide", handleStop);
    window.addEventListener("beforeunload", handleStop);
    window.addEventListener("neomovie-stop-playback", handleStop);

    return () => {
      handleStop();
      window.removeEventListener("popstate", handleStop);
      window.removeEventListener("pagehide", handleStop);
      window.removeEventListener("beforeunload", handleStop);
      window.removeEventListener("neomovie-stop-playback", handleStop);
    };
  }, []);

  // Fetch subtitles for this title
  useEffect(() => {
    if (!imdbId) return;
    fetch(`/api/subtitles?imdbId=${imdbId}&type=${mediaType}&season=${season}&episode=${episode}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.subtitles) setSubtitles(data.subtitles);
      })
      .catch((err) => console.warn("Failed to load subtitles", err));
  }, [imdbId, mediaType, season, episode]);

  const getAbsoluteStreamUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (typeof window !== "undefined") {
      return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
    }
    return url;
  };

  // Construct Proxied Stream URL to handle 206 Range headers & private encrypted tokens
  const proxiedStreamUrl = streamUrl
    ? streamUrl.startsWith("/api/stream-proxy")
      ? streamUrl
      : `/api/stream-proxy?token=${streamUrl}`
    : "";

  const absoluteStreamUrl = getAbsoluteStreamUrl(proxiedStreamUrl);

  // Setup HLS or Native Video with streaming proxy
  useEffect(() => {
    if (playerMode !== "debrid") return;
    const video = videoRef.current;
    if (!video || !proxiedStreamUrl) return;

    setPlaybackError(null);
    setIsPlaying(false);

    let hls: Hls | null = null;

    if (streamUrl.includes(".m3u8")) {
      if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(proxiedStreamUrl);
        hls.attachMedia(video);
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = proxiedStreamUrl;
      }
    } else {
      video.src = proxiedStreamUrl;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
      if (video) {
        try {
          video.pause();
          video.removeAttribute("src");
          video.load();
        } catch {}
      }
    };
  }, [streamUrl, proxiedStreamUrl, playerMode]);

  // Save progress periodically
  useEffect(() => {
    if (currentTime > 5 && duration > 0) {
      saveWatchProgress({
        id: mediaId,
        title,
        poster_path: poster || null,
        backdrop_path: backdrop || poster || null,
        media_type: mediaType,
        imdb_id: imdbId,
        progressSeconds: currentTime,
        durationSeconds: duration,
        season,
        episode,
      });
    }
  }, [currentTime, duration, mediaId, title, poster, backdrop, mediaType, imdbId, season, episode]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch((err) => {
        console.warn("Autoplay or format unsupported", err);
        setPlaybackError("Format requires external player (MKV/HEVC/DTS), or switch to Web Cinema.");
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const changeSpeed = (rate: number) => {
    setSpeed(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSpeedMenu(false);
  };

  const handleSelectSubtitle = (subUrl: string) => {
    setSelectedSub(subUrl);
    setShowSubMenu(false);
    if (!videoRef.current) return;

    const tracks = videoRef.current.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = subUrl === "off" ? "disabled" : "showing";
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    }
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(absoluteStreamUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanId =
    imdbId && imdbId !== "undefined" && imdbId.trim().length > 0
      ? imdbId.trim()
      : String(mediaId || "157336");

  const embedUrl =
    mediaType === "tv" || mediaType === "series"
      ? `https://vidsrc.cc/v2/embed/tv/${cleanId}/${season}/${episode}`
      : `https://vidsrc.cc/v2/embed/movie/${cleanId}`;

  return (
    <div className="space-y-3">
      {/* Player Mode Switcher Tabs: Clean matte design */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111115] p-2 rounded-xl border border-zinc-800 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPlayerMode("debrid")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              playerMode === "debrid"
                ? "bg-white text-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Debrid Stream
          </button>

          <button
            onClick={() => setPlayerMode("embed")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              playerMode === "embed"
                ? "bg-white text-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Web Cinema
          </button>

          <button
            onClick={handleStopAll}
            className="px-2.5 py-1.5 rounded-md font-medium text-xs text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer ml-1"
            title="Stop & Turn Off Playback"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Turn Off</span>
          </button>
        </div>

        {/* External Player Launchers: Clean zinc buttons */}
        <div className="flex items-center gap-1.5">
          <a
            href={`vlc://${absoluteStreamUrl}`}
            onClick={() => {
              if (videoRef.current) videoRef.current.pause();
            }}
            className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-medium"
            title="Launch in VLC"
          >
            VLC
          </a>
          <a
            href={`mpv://${absoluteStreamUrl}`}
            onClick={() => {
              if (videoRef.current) videoRef.current.pause();
            }}
            className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-medium"
            title="Launch in MPV"
          >
            MPV
          </a>
          <button
            onClick={handleCopyLink}
            className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-medium flex items-center gap-1"
            title="Copy stream link"
          >
            {copied ? <Check className="w-3 h-3 text-zinc-200" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Main Video Viewport */}
      {playerMode === "embed" ? (
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
          <iframe
            ref={iframeRef}
            src={embedUrl}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          />
        </div>
      ) : !streamUrl ? (
        <div className="w-full aspect-video rounded-xl bg-zinc-950 flex flex-col items-center justify-center p-6 border border-zinc-800 text-center">
          <div className="w-6 h-6 rounded-full border-2 border-zinc-500 border-t-white animate-spin mb-3" />
          <h3 className="font-medium text-white text-sm">Searching Available Streams</h3>
          <p className="text-xs text-zinc-500 mt-1">Select a stream below once loaded, or switch to Web Cinema above.</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-zinc-800 group select-none"
        >
          <video
            ref={videoRef}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
              if (hasNextEpisode && onNextEpisode) {
                onNextEpisode();
              }
            }}
            onError={() => {
              setPlaybackError(
                "This format (.mkv / DTS / HEVC) requires external player (VLC/MPV), or switch to Web Cinema."
              );
            }}
            onClick={togglePlay}
            poster={poster}
            className="w-full h-full object-contain cursor-pointer"
            playsInline
            crossOrigin="anonymous"
          >
            {subtitles.map((sub) => (
              <track
                key={sub.id}
                kind="subtitles"
                src={sub.url}
                srcLang={sub.lang}
                label={sub.label}
                default={sub.lang === "en" || sub.lang === "eng"}
              />
            ))}
          </video>

          {/* Fallback Notice for Unsupported Codec Streams */}
          {playbackError && (
            <div className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center p-6 text-center text-white">
              <div className="p-3 rounded-full bg-zinc-800 text-zinc-300 mb-3">
                <Tv className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold">Decoding Limit</h3>
              <p className="max-w-md text-xs text-zinc-400 mt-1 mb-5">{playbackError}</p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => setPlayerMode("embed")}
                  className="px-4 py-2 rounded-lg font-medium text-xs bg-white text-black hover:bg-zinc-200 transition-colors"
                >
                  Switch to Web Cinema
                </button>

                <a
                  href={`vlc://${absoluteStreamUrl}`}
                  className="px-4 py-2 rounded-lg font-medium text-xs bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  VLC Player
                </a>

                <a
                  href={`mpv://${absoluteStreamUrl}`}
                  className="px-4 py-2 rounded-lg font-medium text-xs bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  MPV Player
                </a>
              </div>
            </div>
          )}

          {/* Floating Center Play/Pause button when paused */}
          {!isPlaying && !playbackError && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-white/90 text-black flex items-center justify-center shadow-lg hover:scale-105 transition-transform pointer-events-auto"
            >
              <Play className="w-6 h-6 fill-current ml-0.5" />
            </button>
          )}

          {/* On-Screen Video Controls Overlay */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 flex flex-col justify-end p-4 transition-opacity duration-300 pointer-events-none ${
              showControls ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="space-y-3 pointer-events-auto">
              {/* Progress Scrubber Bar: Red / white cinema scrubber */}
              <div className="relative w-full flex items-center group/scrub">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-600 hover:h-1.5 transition-all"
                />
              </div>

              {/* Controls row */}
              <div className="flex items-center justify-between text-white text-xs">
                {/* Left: Play/Pause, Volume, Time, Next Episode */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <button
                    onClick={togglePlay}
                    className="p-1 rounded text-white hover:text-zinc-300 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>

                  {hasNextEpisode && onNextEpisode && (
                    <button
                      onClick={onNextEpisode}
                      className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      title="Next Episode"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Next Ep</span>
                    </button>
                  )}

                  {/* Volume */}
                  <div className="flex items-center gap-2 group/vol">
                    <button onClick={toggleMute} className="text-white hover:text-zinc-300">
                      {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>

                  {/* Time Stamp */}
                  <div className="text-[11px] font-mono text-zinc-400">
                    <span>{formatTime(currentTime)}</span>
                    <span className="text-zinc-600 mx-1">/</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Right: Subtitles, Speed, Fullscreen */}
                <div className="flex items-center gap-3">
                  <div className="hidden md:block text-[11px] font-medium text-zinc-400 max-w-[200px] truncate">
                    {title}
                  </div>

                  {/* Subtitles Menu */}
                  {subtitles.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setShowSubMenu(!showSubMenu)}
                        className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
                        title="Subtitles"
                      >
                        <Subtitles className="w-4 h-4" />
                      </button>
                      {showSubMenu && (
                        <div className="absolute bottom-full right-0 mb-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-20 min-w-[140px] max-h-48 overflow-y-auto">
                          <div className="text-[10px] font-medium text-zinc-500 px-3 py-1 uppercase border-b border-zinc-800">
                            Subtitles
                          </div>
                          <button
                            onClick={() => handleSelectSubtitle("off")}
                            className={`w-full text-left px-3 py-1 text-xs hover:bg-zinc-800 ${
                              selectedSub === "off" ? "text-white font-medium" : "text-zinc-400"
                            }`}
                          >
                            Off
                          </button>
                          {subtitles.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => handleSelectSubtitle(sub.url)}
                              className={`w-full text-left px-3 py-1 text-xs hover:bg-zinc-800 truncate ${
                                selectedSub === sub.url ? "text-white font-medium" : "text-zinc-400"
                              }`}
                            >
                              {sub.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Speed Selector */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      className="px-1.5 py-0.5 rounded text-[11px] font-mono font-medium text-zinc-400 hover:text-white transition-colors"
                    >
                      {speed}x
                    </button>
                    {showSpeedMenu && (
                      <div className="absolute bottom-full right-0 mb-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-20 min-w-[80px]">
                        {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                          <button
                            key={s}
                            onClick={() => changeSpeed(s)}
                            className={`w-full text-left px-3 py-1 text-xs hover:bg-zinc-800 font-mono ${
                              speed === s ? "text-white font-medium" : "text-zinc-400"
                            }`}
                          >
                            {s}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
                  >
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
