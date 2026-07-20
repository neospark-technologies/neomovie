"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Film,
  Search,
  Bookmark,
  Settings,
  PlayCircle,
  Menu,
  X,
} from "lucide-react";
import { getWatchlist } from "@/lib/storage";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { searchCatalog, getPosterUrl } from "@/lib/tmdb";
import { MediaItem } from "@/types/movie";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateCount = () => {
      setWatchlistCount(getWatchlist().length);
    };
    updateCount();
    window.addEventListener("neomovie-watchlist-updated", updateCount);
    return () => window.removeEventListener("neomovie-watchlist-updated", updateCount);
  }, []);

  // Stop background playback when leaving /watch
  useEffect(() => {
    if (!pathname.startsWith("/watch")) {
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
          if (f.src && (f.src.includes("vidsrc") || f.src.includes("embed"))) {
            f.src = "about:blank";
          }
        } catch {}
      });
    }
  }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchCatalog(searchQuery);
        setSearchResults(results.slice(0, 6));
        setShowSearchDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchDropdown(false);
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Bollywood", href: "/explore?type=indian" },
    { label: "Movies", href: "/explore?type=movie" },
    { label: "Series", href: "/explore?type=tv" },
    { label: "Anime", href: "/explore?type=anime" },
    { label: "TorBox Cloud", href: "/explore?type=torbox" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#0a0a0c]/90 backdrop-blur-md border-b border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <PlayCircle className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold tracking-tight text-lg text-white">
                NeoMovie
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "text-white bg-white/10"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Search Bar */}
          <div ref={searchRef} className="relative flex-1 max-w-md hidden sm:block">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search movies, series..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowSearchDropdown(true);
                  }}
                  className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-500 transition-colors"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </form>

            {/* Dropdown Results */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#141418] border border-zinc-800 rounded-xl shadow-2xl p-2 z-50">
                <div className="space-y-1">
                  {searchResults.map((item) => (
                    <Link
                      key={item.id}
                      href={`/movie/${item.id}`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/60 transition-colors group"
                    >
                      <div className="w-8 h-11 rounded bg-zinc-800 overflow-hidden shrink-0">
                        {item.poster_path ? (
                          <img
                            src={getPosterUrl(item.poster_path, "w342")}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            <Film className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span>{(item.release_date || item.first_air_date || "").slice(0, 4) || "N/A"}</span>
                          <span>•</span>
                          <span className="text-zinc-300">★ {item.vote_average.toFixed(1)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="pt-2 mt-1 border-t border-zinc-800 text-center">
                  <button
                    onClick={handleSearchSubmit}
                    className="text-xs text-zinc-300 hover:text-white font-medium py-1"
                  >
                    View all results for &quot;{searchQuery}&quot; →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            <Link
              href="/watchlist"
              className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Your Watchlist"
            >
              <Bookmark className="w-4 h-4" />
              <span className="hidden sm:inline">Watchlist</span>
              {watchlistCount > 0 && (
                <span className="text-zinc-500 font-normal">
                  ({watchlistCount})
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 md:hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0e0e12] border-t border-zinc-800 px-4 py-3 space-y-2">
            <form onSubmit={handleSearchSubmit} className="mb-3">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs"
              />
            </form>
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm text-zinc-300 hover:bg-zinc-800"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
