# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server only (no `/api` functions; use `vercel dev` directly, not `npm run dev`, when you need `/api/youtube` locally — it auto-detects Vite and runs the `dev` script itself, so `package.json`'s `dev` script must stay `vite`, never `vercel dev`, or it recurses)
- `npm run build` — type-check (`tsc -b`) then production build
- `npm run lint` — run oxlint
- `npm run preview` — preview the production build

There is no test suite configured in this project.

## Environment

Requires `YOUTUBE_API_KEY` (no `VITE_` prefix — it must stay server-only) in `.env` (see `.env.example`) — a YouTube Data API v3 key. It is read only by the `/api/youtube` serverless function (`api/youtube.ts`), never bundled into client code. Without it, the proxy returns a 500 and search, playlist import, and episode metadata (duration/channel) enrichment surface Thai error messages or silently degrade; oEmbed-based title fallback still works without a key. On Vercel, set `YOUTUBE_API_KEY` in the project's Environment Variables (not `VITE_YOUTUBE_API_KEY`) — a redeploy is required for changes to take effect.

## Architecture

Podcastery is a single-page app that turns YouTube videos into an audio-only "podcast" player, using YouTube's IFrame API as a hidden/muted-visual player. Almost everything is client-side; app state persists to `localStorage` only. The one exception is `api/youtube.ts`, a Vercel serverless function that proxies all YouTube Data API v3 calls so the API key never reaches the browser and so client requests hit the same origin (avoids third-party-domain firewall blocks on `googleapis.com`).

**Routing (`src/App.tsx`):** `react-router-dom` with a single layout route. `AppLayout` (Topbar + Sidebar + `<Outlet>` + `PlayerBar`) wraps four pages: `HomeView` (`/`, recommended clips), `SearchView` (`/search?q=`), `PlaylistView` (`/playlist/:id`), `WatchView` (`/watch/:videoId`). Picking a clip anywhere (search, recommendations, related) goes through a shared `handlePickClip` in `App.tsx` that opens `SelectPlaylistDialog` to choose/create a target playlist — this dialog lives outside the router `<Routes>` so it survives navigation.

**Global playback state (`src/contexts/PlaybackContext.tsx`):** `PlaybackProvider` wraps the whole router and owns all player state (`currentEpisode`, `isPlaying`, `currentTime`, `duration`, `volume`, `isShuffled`, `playbackRate`) plus the single `YouTubePlayer` instance and its imperative `playerRef`. It polls `playerRef` on a 500ms interval while playing to update the progress bar, since the IFrame API doesn't push time updates. Two ways to start playback: `playEpisode(playlistId, episodeId, videoId, channelTitle)` for episodes already saved in a playlist, vs `playStandaloneVideo(videoId, title, channelTitle)` for videos opened directly (e.g. from search/recommendations) that aren't in any playlist yet — the latter creates a synthetic `standalone-{videoId}` episode and is later patched via `updateStandaloneMetadata` once real title/channel data arrives. Any component needing playback reads/calls through the `usePlayback()` hook; there is no prop-drilling of player state.

**Data flow (playlists):**
- `src/hooks/usePlaylists.ts` is the sole owner of playlist/episode state, backed by `src/hooks/useLocalStorage.ts` (key: `podcastery:playlists`, cross-tab synced via the `storage` event). All mutations (create/delete playlist, add/remove episode, import playlist) go through this hook, which `PlaybackProvider` calls internally and re-exposes via `usePlayback()`.
- Adding an episode always resolves through `buildEpisodeFromVideoId`/`buildEpisodeFromVideoDetails` in that same file, which combines two data sources in parallel: the YouTube Data API (`src/lib/youtubeDataApi.ts`) for title/duration/channel, and the public oEmbed endpoint (`src/lib/youtube.ts`) as a title fallback when the Data API call fails. Both are best-effort (`Promise.allSettled`) — a failed/missing-key proxy call never blocks adding an episode by raw URL.
- `src/lib/youtube.ts` also handles all YouTube URL/ID parsing (`watch`, `youtu.be`, `/embed/`, `/shorts/`, and `/playlist?list=`).
- `src/lib/youtubeDataApi.ts` calls `/api/youtube?endpoint=...` (never `googleapis.com` directly) for `search`, `videos`, `channels`, and `playlistItems`, chunking video-detail lookups into batches of 50 and paginating `playlistItems` fully. All quota/network failures surface as Thai-language `Error` messages meant to be shown directly to the user (see `AddEpisodeDialog`/`swal` usage), and are also `console.error`-logged with technical detail for diagnosing firewall/CORS/quota issues. `api/youtube.ts` is the actual upstream caller: it validates `endpoint` against an allowlist, forwards query params, and attaches `YOUTUBE_API_KEY` server-side.

**Recommendations & history:** `src/hooks/usePlayHistory.ts` records every play (`videoId`, `channelTitle`, `playedAt`) to `localStorage` (key `podcastery:play-history`, capped at 200 entries). `src/lib/recommendation.ts` (`getRecommendedClips`) scores channels by recency-weighted play count (`0.5 ^ (age / 14 days)` half-life), picks up to 3 channels via weighted sampling without replacement, and fires one `searchVideos` call per channel — falling back to a fixed Thai keyword pool when there's no history yet. `HomeView` is the only consumer.

**Playback primitive:** `src/components/YouTubePlayer.tsx` wraps the actual `YT.Player` in a visually hidden 2x2px div and exposes an imperative handle (`play`/`pause`/`seekTo`/`setVolume`/`setPlaybackRate`/`loadVideo`/`getDuration`/`getCurrentTime`) via `forwardRef`/`useImperativeHandle`. It lazily injects the `iframe_api` script once (module-level `apiReadyPromise` guards against double-loading across remounts). There is exactly one instance, created inside `PlaybackProvider`.

**UI stack:** shadcn/ui components (`src/components/ui/`, style `base-nova`, Tailwind v4 via `@tailwindcss/vite`, no separate Tailwind config file — tokens live in `src/index.css`). Path alias `@/*` → `src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`). SweetAlert2 (`src/lib/swal.ts`) is used for destructive-action confirmations and success toasts, all in Thai.

All user-facing strings (errors, confirmations, empty states) are in Thai — keep new strings consistent with this.
