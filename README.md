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

## Architecture

- Lyrics sync via account/backend
- Audio files stored locally on device, metadata synced
- Songs contain lyrics + track references
