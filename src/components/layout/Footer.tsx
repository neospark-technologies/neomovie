import React from "react";
import Link from "next/link";
import { PlayCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-800 bg-[#0a0a0c] py-10 text-zinc-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-zinc-800">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <PlayCircle className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-base text-white tracking-tight">
                NeoMovie
              </span>
            </div>
            <p className="max-w-md text-zinc-400 leading-relaxed text-xs">
              Cinema interface and personal stream aggregator.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-zinc-400">
              <li>
                <Link href="/explore?type=movie" className="hover:text-white transition-colors">
                  Popular Movies
                </Link>
              </li>
              <li>
                <Link href="/explore?type=tv" className="hover:text-white transition-colors">
                  TV Series
                </Link>
              </li>
              <li>
                <Link href="/explore?type=anime" className="hover:text-white transition-colors">
                  Anime
                </Link>
              </li>
              <li>
                <Link href="/watchlist" className="hover:text-white transition-colors">
                  Watchlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Attribution */}
          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">
              Attribution
            </h4>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Powered by Cinemeta and TMDB.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 text-[11px] text-zinc-500 gap-4">
          <p>© 2026 NeoMovie.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-zinc-300 transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-zinc-300 transition-colors cursor-pointer">Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
