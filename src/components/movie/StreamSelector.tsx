"use client";

import React, { useState, useEffect } from "react";
import {
  Play,
  Copy,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { StreamItem } from "@/types/movie";

interface StreamSelectorProps {
  imdbId?: string;
  type?: string;
  season?: number;
  episode?: number;
  onSelectStream?: (stream: StreamItem) => void;
  selectedStreamUrl?: string;
  mediaId?: string | number;
  title?: string;
}

export function StreamSelector({
  imdbId,
  type = "movie",
  season = 1,
  episode = 1,
  onSelectStream,
  selectedStreamUrl,
  mediaId,
  title,
}: StreamSelectorProps) {
  const router = useRouter();
  const [streams, setStreams] = useState<StreamItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterRes, setFilterRes] = useState<string>("ALL");
  const [filterLang, setFilterLang] = useState<string>("ALL");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    const targetId = imdbId || (mediaId ? String(mediaId) : undefined);
    if (!targetId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchStreams = async () => {
      try {
        const queryParams = new URLSearchParams({
          imdbId: targetId,
          type,
          season: String(season),
          episode: String(episode),
        });
        if (title && title.trim()) {
          queryParams.set("title", title.trim());
        }

        const res = await fetch(`/api/streams?${queryParams.toString()}`);
        const data = await res.json();

        if (!isMounted) return;

        if (data.streams && data.streams.length > 0) {
          setStreams(data.streams);
          if (!selectedStreamUrl) {
            // Prioritize browser-compatible streams by default to avoid decoding limit errors
            const preferred =
              data.streams.find((s: StreamItem) => s.parsed?.isMp4 && s.parsed?.audio === "AAC") ||
              data.streams.find((s: StreamItem) => s.parsed?.isMp4) ||
              data.streams.find((s: StreamItem) => s.parsed?.resolution === "1080p" && (s.parsed?.isMp4 || s.parsed?.quality === "WEB-DL")) ||
              data.streams.find((s: StreamItem) => s.parsed?.resolution === "1080p") ||
              data.streams.find((s: StreamItem) => s.parsed?.resolution === "720p") ||
              data.streams[0];
            if (onSelectStream && preferred) {
              onSelectStream(preferred);
            }
          }
        } else {
          setError(data.error || "No streams found for this title.");
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || "Failed to load streams.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStreams();

    return () => {
      isMounted = false;
    };
  }, [imdbId, mediaId, type, season, episode, title]);

  const getAbsoluteStreamUrl = (url: string) => {
    if (typeof window === "undefined") return url;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${window.location.origin}${url}`;
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(getAbsoluteStreamUrl(url));
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const availableLanguages = Array.from(
    new Set(streams.flatMap((s) => s.parsed?.languages || []))
  );

  const filteredStreams = streams.filter((s) => {
    if (filterRes !== "ALL") {
      if (filterRes === "4K" && s.parsed?.resolution !== "4K") return false;
      if (filterRes === "1080p" && s.parsed?.resolution !== "1080p") return false;
      if (filterRes === "Remux" && !/remux/i.test(s.parsed?.quality || "")) return false;
      if (filterRes === "MP4" && !s.parsed?.isMp4) return false;
    }

    if (filterLang !== "ALL") {
      const langs = s.parsed?.languages || [];
      if (!langs.some((l) => l.toLowerCase() === filterLang.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  const handleStreamClick = (stream: StreamItem) => {
    if (onSelectStream) {
      onSelectStream(stream);
    } else {
      const targetId = mediaId || imdbId;
      router.push(
        `/watch/${targetId}?type=${type}${
          type === "series" || type === "tv"
            ? `&season=${season}&episode=${episode}`
            : ""
        }`
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Filter Controls: NO paragraph under heading */}
      <div className="space-y-3 border-b border-zinc-800 pb-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
          Available Streams
        </h3>

        {/* Filters Row: Sleek matte styling */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {/* Quality Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-zinc-400 font-medium mr-1">Quality:</span>
            {["ALL", "4K", "1080p", "Remux", "MP4"].map((res) => (
              <button
                key={res}
                onClick={() => setFilterRes(res)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  filterRes === res
                    ? "bg-white text-black"
                    : "bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {res === "MP4" ? "MP4" : res}
              </button>
            ))}
          </div>

          {/* Language Filter */}
          {availableLanguages.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] text-zinc-400 font-medium mr-1">Audio:</span>
              <button
                onClick={() => setFilterLang("ALL")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  filterLang === "ALL"
                    ? "bg-white text-black"
                    : "bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                All
              </button>
              {availableLanguages.slice(0, 5).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setFilterLang(lang)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    filterLang === lang
                      ? "bg-white text-black"
                      : "bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-8 flex justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-zinc-400 border-t-white animate-spin" />
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 text-center">
          {error}
        </div>
      )}

      {/* Stream List: NO badges, clean technical metadata line */}
      {!loading && !error && filteredStreams.length > 0 && (
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {filteredStreams.map((stream, idx) => {
            const isSelected = selectedStreamUrl === stream.url;
            const parsed = stream.parsed || {};
            const cleanTitle =
              stream.behaviorHints?.filename ||
              stream.description.split("\n")[0] ||
              `Stream #${idx + 1}`;

            // Build cohesive metadata string (no badges)
            const metaSpecs: string[] = [];
            if (parsed.resolution) metaSpecs.push(parsed.resolution);
            if (parsed.quality) metaSpecs.push(parsed.quality);
            if (parsed.hdr) metaSpecs.push("HDR");
            if (parsed.dv) metaSpecs.push("Dolby Vision");
            if (parsed.audio) metaSpecs.push(parsed.audio);
            if (parsed.size) metaSpecs.push(parsed.size);
            if (parsed.languages && parsed.languages.length > 0) {
              metaSpecs.push(parsed.languages.join(", "));
            }

            return (
              <div
                key={idx}
                onClick={() => handleStreamClick(stream)}
                className={`p-3 rounded-lg border transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSelected
                    ? "bg-[#16161c] border-zinc-500 text-white"
                    : "bg-[#111115] border-zinc-800/80 hover:border-zinc-700 text-zinc-300"
                }`}
              >
                {/* Left metadata */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="text-xs font-medium text-white truncate" title={cleanTitle}>
                    {cleanTitle}
                  </div>

                  <div className="text-[11px] text-zinc-400">
                    {metaSpecs.join(" • ")}
                  </div>
                </div>

                {/* Right action buttons */}
                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleStreamClick(stream)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      isSelected
                        ? "bg-white text-black"
                        : "bg-zinc-800 hover:bg-zinc-700 text-white"
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isSelected ? "Active" : "Play"}</span>
                  </button>

                  <a
                    href={`vlc://${getAbsoluteStreamUrl(stream.url)}`}
                    className="px-2 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-medium"
                    title="Open in VLC"
                  >
                    VLC
                  </a>

                  <button
                    onClick={() => handleCopy(stream.url)}
                    className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                    title="Copy stream link"
                  >
                    {copiedUrl === stream.url ? (
                      <Check className="w-3.5 h-3.5 text-zinc-200" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
