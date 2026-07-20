"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { MediaItem } from "@/types/movie";
import { MovieCard } from "@/components/movie/MovieCard";

interface MovieRowProps {
  title: string;
  items: MediaItem[];
  exploreUrl?: string;
  icon?: React.ReactNode;
}

export function MovieRow({ title, items, exploreUrl }: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setCanScrollLeft(scrollLeft > 20);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 20);
    }
  };

  const handleScroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const { clientWidth } = rowRef.current;
      const scrollAmount = direction === "left" ? -clientWidth * 0.75 : clientWidth * 0.75;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="relative py-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Row Header: Clean title, no badges, no paragraph under heading */}
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
          {title}
        </h2>

        <div className="flex items-center gap-3">
          {exploreUrl && (
            <Link
              href={exploreUrl}
              className="group flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              <span>See all</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}

          {/* Carousel Arrows */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => handleScroll("left")}
              disabled={!canScrollLeft}
              className={`p-1.5 rounded-md border border-zinc-800 transition-colors ${
                canScrollLeft
                  ? "bg-zinc-900 text-white hover:bg-zinc-800"
                  : "bg-zinc-900/40 text-zinc-600 cursor-not-allowed opacity-40"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll("right")}
              disabled={!canScrollRight}
              className={`p-1.5 rounded-md border border-zinc-800 transition-colors ${
                canScrollRight
                  ? "bg-zinc-900 text-white hover:bg-zinc-800"
                  : "bg-zinc-900/40 text-zinc-600 cursor-not-allowed opacity-40"
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Row */}
      <div
        ref={rowRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1 -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            className="w-[150px] sm:w-[180px] md:w-[195px] shrink-0"
          >
            <MovieCard item={item} priority={index < 4} />
          </div>
        ))}
      </div>
    </section>
  );
}
