# knightsrook-songwriters-toolkit

A songwriter's toolkit with multi-track recording, lyric editor, and AI-powered rhyme/synonym assistance.

## Stack

- **Client**: React + Vite + dnd-kit + ClerkProvider (PWA-ready)
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

- **Home** — jukebox-style title card panel + audio visualizer + chrome search bar. Tap a filled slot to select it, revealing **Lyrics** (navigate to song) and **Edit** (rename inline) buttons. Empty slots tap to create. Tapping a selected song deselects it. Deleting a song shows an inline confirmation; message notes that lyrics will be preserved.
- **Song** — full song experience with flip panel between **Lyrics** (Tiptap editor + Word Assistant) and **Mixer**. Lyrics panel loads the first associated lyrics sheet; shows a "Write Lyrics" button if none exist yet.
- **Lyrics Library** — standalone list of all lyrics sheets (title + last-updated date). Accessible via the Lyrics nav button when no song is active. Tap a sheet to open it in the editor. "New Sheet" button creates a fresh sheet.
- **Lyrics Detail** — standalone editor for a lyrics sheet (not tied to a song). Editable title + Tiptap editor + Save button.
- **Library** — audio file manager (slide-in drawer). Files persist independently of songs.
- **Settings** — account + preferences (slide-in drawer).

Chrome is persistent across all screens:
- **Bottom nav**: prev/next chevrons (disabled at page limits), visualizer cycle, Lyrics button, Library, Settings
- Tapping the bar-chart icon cycles through 5 visualizer types: bars, scope, VU meters, dot matrix, radial
- Lyrics nav button: with active song → jumps to lyrics panel; without a song → opens Lyrics Library
- Back button navigates: Song Detail → Home; Lyrics Detail → Lyrics Library; Lyrics Library → Home; New Sheet → Lyrics Library
- Visualizer is idle (static) until a song is playing
- Account management (sign in / manage profile) lives inside the Settings drawer

## Architecture

- Songs and lyrics are both first-class independent objects. Lyrics survive song deletion.
- Audio files are stored independently (`audio_files` table). Many-to-many with songs via `song_audio` join table. Files survive song deletion.
- Lyrics are stored independently (`lyrics` table with `user_id`). Many-to-many with songs via `song_lyrics` join table. Lyrics survive song deletion.
- Audio files uploaded via `multer` to `server/uploads/`; served unauthenticated at `/api/audio/file/:filename` (UUID filenames are unguessable).

## Audio engine

`client/src/lib/audioEngine.ts` — singleton Web Audio API engine.

- `loadTrack(id, name, url)` — fetches + decodes audio; creates a `GainNode` on the master chain
- `play()` / `pause()` / `stop()` — source nodes are one-shot; new `AudioBufferSourceNode` per play
- `setVolume()`, `setMute()`, `setSolo()` with proper solo logic
- Subscriber pattern for React sync

`client/src/hooks/useAudioEngine.ts` — React hook that loads server tracks, syncs engine state, and exposes `startRecording()` / `stopRecording()` via `MediaRecorder`.

`client/src/components/Mixer.tsx` — Mixer UI: Visualizer, transport bar (play/pause/stop/record/import), per-track controls (volume, mute, solo, delete).

## Dev seed

Generate 4 WAV test tracks and insert a "Dev Test Track" song:

```bash
cd server
npx tsx scripts/seed-dev.ts
```

User ID is auto-detected from the database (sign in and create one song first). Pass a Clerk user ID as the first argument to override.

Tracks: Bass (80 Hz sine), Melody (440 Hz), Harmony (523 Hz), Kick (decaying frequency burst).

## Auth flow

All API routes require a valid Clerk session. The client obtains a JWT via `useAuth().getToken()` and stores it in a module-level getter (`client/src/lib/api.ts: setTokenGetter`). `SongList` registers the getter once Clerk is loaded (`isLoaded && isSignedIn`), then every `apiFetch` call includes `Authorization: Bearer <token>`. Server-side routes use `getAuth(req)` from `@clerk/express` and return 401 if `userId` is null.

## Data model

```
songs          — id, user_id, title  (PATCH /:id renames title)
lyrics         — id, user_id, title, content  (first-class; survives song deletion)
song_lyrics    — song_id, lyrics_id  (many-to-many join, lyrics survive song deletion)
audio_files    — id, user_id, filename, original_name, mime_type, duration_ms, size_bytes
song_audio     — song_id, audio_file_id  (many-to-many join, files survive song deletion)
```

### Migration

If you have existing data in the old `lyrics` schema (which had `song_id` instead of `user_id`):

```bash
cd server
npx tsx scripts/migrate-lyrics.ts
```

Then run the schema changes (add columns, create `song_lyrics` table) and finally drop the old `song_id` column:

```sql
ALTER TABLE lyrics
  ADD COLUMN user_id VARCHAR(255) NOT NULL DEFAULT '' AFTER id,
  ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT 'Untitled' AFTER user_id,
  ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER content;

CREATE TABLE IF NOT EXISTS song_lyrics (
  song_id   VARCHAR(36) NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  lyrics_id VARCHAR(36) NOT NULL REFERENCES lyrics(id) ON DELETE CASCADE,
  PRIMARY KEY (song_id, lyrics_id),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- After running migrate-lyrics.ts and confirming results:
ALTER TABLE lyrics DROP COLUMN song_id;
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
