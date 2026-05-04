# knightsrook-songwriters-toolkit

A songwriter's toolkit with multi-track recording, lyric editor, and AI-powered rhyme/synonym assistance.

## Stack

- **Client**: React + Vite + Tiptap + ClerkProvider (PWA-ready)
- **Server**: Express + TypeScript
- **Database**: MySQL
- **Auth**: Clerk
- **AI**: Anthropic Claude (rhymes, synonyms, suggestions)
- **Deploy**: PM2 on port 5010

## Quickstart

```bash
cp .env.example .env
# fill in .env
npm install
npm run dev
```

## Client

The `client/` directory is a React + Vite + TypeScript SPA with PWA support.

- **UI framework**: React 19
- **Rich text editor**: Tiptap (StarterKit + Placeholder extension)
- **Auth**: `@clerk/react` (`ClerkProvider` wrapping the app)
- **PWA**: `vite-plugin-pwa` with auto-update service worker

### Client setup

```bash
cp client/.env.example client/.env.local
# Set VITE_CLERK_PUBLISHABLE_KEY=pk_test_... in client/.env.local
cd client
npm install
npm run dev   # starts on http://localhost:5173, proxies /api → http://localhost:5010
```

## Screens

- **Home** — jukebox-style title card panel + audio visualizer. Fixed 10 slots; empty slots are tappable to create a new song.
- **Song** — full song experience with flip panel between **Lyrics** (Tiptap editor + Word Assistant) and **Mixer** (placeholder).
- **Library** — audio file manager (slide-in drawer). Files persist independently of songs.
- **Settings** — account + preferences (slide-in drawer).

Chrome (Library, Settings, and visualizer cycle icons) is persistent across all screens. Tapping the bar-chart icon cycles through 5 visualizer types: bars, scope, VU meters, dot matrix, radial.

## Architecture

- Songs are the primary object. Each song has lyrics and can reference multiple audio files.
- Audio files are stored independently (`audio_files` table). Many-to-many with songs via `song_audio` join table. Files survive song deletion.
- Lyrics sync via server/MySQL.
- Audio stays local for MVP (metadata only in DB).

## Data model

```
songs          — id, user_id, title
lyrics         — id, song_id, content
audio_files    — id, user_id, filename, original_name, mime_type, duration_ms, size_bytes
song_audio     — song_id, audio_file_id  (many-to-many join)
```

## UI

- Retro-futurism aesthetic inspired by vintage jukeboxes
- Mobile-first, dark theme, neon tube aesthetic in magenta → amber → teal
- Fonts: Orbitron (display), Rajdhani (UI), Space Mono (lyrics editor)
- Chunky touch targets (52px minimum) for 3am one-thumb use
- Reusable `Button` component (`variant=plastic|ghost`, `size=md|sm`, `icon`) — all buttons share the same chunky ivory plastic CSS with cut-hole protrusion effect
- Neon gradient frame (magenta → amber → teal) wraps entire app including header; 8px border with `border-radius: 72px 72px 20px 20px`; chrome ring sheen via `::after` at z-index 1000
- Header centered title only ("Songwriter Toolkit" in Bungee Inline, bottom-aligned); all controls (Library, Settings, Back, pagination) in persistent bottom nav bar
- Header and bottom nav clipped to inner corner radii (194px top, 12px bottom) so dark fills never cover neon corners
- Inner chrome bezel follows the 194px arc via inset box-shadow (6px, dark→bright→dark), sits inside content without touching neon
