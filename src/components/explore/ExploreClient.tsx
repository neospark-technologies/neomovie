"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { MediaItem } from "@/types/movie";
import { MovieCard } from "@/components/movie/MovieCard";
import { searchCatalog } from "@/lib/tmdb";

interface ExploreClientProps {
  initialTrending: MediaItem[];
  initialMovies: MediaItem[];
  initialTV: MediaItem[];
  initialAnime: MediaItem[];
  initialIndian: MediaItem[];
  initialTorbox: MediaItem[];
}

export function ExploreClient({
  initialTrending,
  initialMovies,
  initialTV,
  initialAnime,
  initialIndian,
  initialTorbox,
}: ExploreClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const typeParam = searchParams.get("type") || "all";
  const queryParam = searchParams.get("q") || "";

  const [activeType, setActiveType] = useState<string>(typeParam);
  const [searchQuery, setSearchQuery] = useState<string>(queryParam);
  const [searchResults, setSearchResults] = useState<MediaItem[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setActiveType(typeParam);
  }, [typeParam]);

  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  const getCategoryItems = (type: string): MediaItem[] => {
    switch (type) {
      case "indian":
        return initialIndian || [];
      case "torbox":
        return initialTorbox || [];
      case "movie":
        return [...(initialIndian || []), ...(initialMovies || [])];
      case "tv":
        return initialTV || [];
      case "anime":
        return initialAnime || [];
      case "all":
      default:
        return [...(initialIndian || []), ...(initialTrending || [])];
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchCatalog(searchQuery);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleTypeSelect = (type: string) => {
    setActiveType(type);
    setSearchQuery("");
    setSearchResults(null);
    router.push(`/explore?type=${type}`, { scroll: false });
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
    router.push(`/explore?type=${activeType}`, { scroll: false });
  };

  const displayItems = searchQuery.trim()
    ? (searchResults || [])
    : getCategoryItems(activeType);

  const categories = [
    { id: "all", label: "All" },
    { id: "indian", label: "Bollywood" },
    { id: "movie", label: "Movies" },
    { id: "tv", label: "Series" },
    { id: "anime", label: "Anime" },
    { id: "torbox", label: "TorBox Cloud" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      {/* Header and Search: NO paragraph under heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Explore
        </h1>

        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills: Clean matte styling */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-4">
        {categories.map((cat) => {
          const isActive = activeType === cat.id && !searchQuery.trim();
          return (
            <button
              key={cat.id}
              onClick={() => handleTypeSelect(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                isActive
                  ? "bg-white text-black"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Media Grid */}
      <div className="mt-4">
        {isSearching ? (
          <div className="py-20 flex justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-zinc-500 border-t-white animate-spin" />
          </div>
        ) : displayItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {displayItems.map((item, index) => (
              <MovieCard key={`${item.id}-${index}`} item={item} priority={index < 6} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <h3 className="text-base font-medium text-white">No results found</h3>
          </div>
        )}
      </div>
    </div>
  );
}
