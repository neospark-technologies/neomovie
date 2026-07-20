# NeoMovie

A high-performance, modern cinema streaming web application built with **Next.js**, **React**, and **TypeScript**. NeoMovie features an immersive matte cinema UI, multi-source stream aggregation with 1080p priority decoding, subtitle integration, watch history tracking, and external player support (VLC / MPV).

## Features

- **Matte Cinema Interface**: Refined, distraction-free design with smooth navigation and responsive layouts across mobile, tablet, and desktop.
- **Adaptive Stream Selector**: Intelligent stream resolver with priority default to 1080p browser-compatible formats, preventing hardware decoding limits while retaining 4K options.
- **Embedded & External Players**: Built-in HTML5 video player with custom scrubber, speed controls, subtitles, and one-click launch support for VLC and MPV.
- **TV Series Episode Drawer**: Seamless switching between seasons and episodes directly within the watch interface, including next-episode auto-progression.
- **Watch History & Progress**: Local tracking of watched titles with playback resume, progress indicators, and resilient multi-level poster fallbacks.
- **Personal Watchlist**: Quick bookmarking to save movies and series for later.
- **Multi-Source Catalog**: Browse popular, top-rated, trending titles, anime, and international cinema.

## Tech Stack

- **Framework**: Next.js (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Modern CSS Design Tokens
- **Icons**: Lucide React
- **Streaming & Media**: Native HTML5 Video & HLS.js

## Getting Started

### Prerequisites

- Node.js 18.18+ or later
- npm, pnpm, or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/neospark-technologies/neomovie.git
   cd neomovie/neomovie-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env.local` file in the root directory:
   ```env
   # Optional: TMDB API Key for metadata enrichment
   NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key

   # Stream Provider Service Base URL
   STREAM_PROVIDER_URL=your_stream_service_url
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for Production

```bash
npm run build
npm run start
```

## Project Structure

```text
src/
├── app/                  # Next.js App Router pages and API routes
│   ├── api/              # Secure stream proxy, streams, episodes, subtitles
│   ├── explore/          # Search and catalog exploration
│   ├── movie/            # Movie details and stream launcher
│   ├── series/           # Series details, seasons, and episode guide
│   ├── watch/            # Cinema player viewport and stream selector
│   └── watchlist/        # User saved titles
├── components/           # Reusable UI, layout, player, and movie components
├── lib/                  # Metadata resolvers, storage, and security helpers
└── types/                # TypeScript interfaces and schema definitions
```

## License

This project is licensed under the MIT License.