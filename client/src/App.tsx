import { useState, useEffect } from "react";
import SongList from "./pages/SongList";
import SongDetail from "./pages/SongDetail";
import NewLyrics from "./pages/NewLyrics";
import LyricsLibrary from "./pages/LyricsLibrary";
import LyricsDetail from "./pages/LyricsDetail";
import LibraryDrawer from "./components/LibraryDrawer";
import SettingsDrawer from "./components/SettingsDrawer";
import Button from "./components/Button";
import type { Song, Lyrics } from "./lib/api";
import { type VizType } from "./components/Visualizer";

const VIZ_TYPES: VizType[] = ['bars', 'scope', 'vu', 'dots', 'radial'];

type Panel = "lyrics" | "mixer";

function IconLibrary() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function IconBarChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="12" width="4" height="8" />
      <rect x="10" y="7" width="4" height="13" />
      <rect x="17" y="3" width="4" height="17" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconLyrics() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="10" x2="16" y2="10" />
      <line x1="4" y1="14" x2="20" y2="14" />
      <line x1="4" y1="18" x2="12" y2="18" />
    </svg>
  );
}

export default function App() {
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [panel, setPanel] = useState<Panel>("lyrics");
  const [lyricsMode, setLyricsMode] = useState(false);
  const [activeLyrics, setActiveLyrics] = useState<Lyrics | null>(null);
  const [freshLyrics, setFreshLyrics] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [vizIdx, setVizIdx] = useState(0);

  useEffect(() => { setPanel("lyrics"); }, [activeSong?.id]);

  function selectSong(song: Song | null) {
    setActiveSong(song);
  }

  function handleLyricsNav() {
    if (activeSong) {
      setPanel("lyrics");
    } else {
      setLyricsMode(true);
    }
  }

  function handleBack() {
    if (activeSong) {
      selectSong(null);
    } else if (lyricsMode && freshLyrics) {
      setFreshLyrics(false);
    } else if (lyricsMode && activeLyrics) {
      setActiveLyrics(null);
    } else if (lyricsMode) {
      setLyricsMode(false);
    }
  }

  const showBack = !!(activeSong || lyricsMode);

  function headerTitle() {
    if (activeSong) return activeSong.title;
    if (lyricsMode) {
      if (freshLyrics) return "New Sheet";
      if (activeLyrics) return activeLyrics.title;
      return "Lyrics";
    }
    return null; // shows wordmark
  }

  const title = headerTitle();

  return (
    <div className="app">
      <div className="app-inner">
        <header className="app-chrome">
          {title ? (
            <span className="chrome-song-title">{title}</span>
          ) : (
            <span className="chrome-wordmark">Songwriter<br />Toolkit</span>
          )}
        </header>

        <main className="app-main">
          {activeSong ? (
            <SongDetail
              song={activeSong}
              vizType={VIZ_TYPES[vizIdx]}
              panel={panel}
              onPanelChange={setPanel}
            />
          ) : lyricsMode && activeLyrics ? (
            <LyricsDetail
              lyrics={activeLyrics}
              onBack={() => setActiveLyrics(null)}
            />
          ) : lyricsMode && freshLyrics ? (
            <NewLyrics
              onSaved={l => { setFreshLyrics(false); setActiveLyrics(l); }}
            />
          ) : lyricsMode ? (
            <LyricsLibrary
              onSelect={setActiveLyrics}
              onNew={() => setFreshLyrics(true)}
            />
          ) : (
            <SongList
              onSelect={selectSong}
              page={page}
              onPageChange={setPage}
              onTotalPagesChange={setTotalPages}
              vizType={VIZ_TYPES[vizIdx]}
            />
          )}
        </main>
      </div>

      <nav className="app-nav">
        <div className="nav-left">
          {showBack
            ? <Button icon onClick={handleBack} title="Back"><IconChevronLeft /></Button>
            : <Button icon onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} title="Previous page"><IconChevronLeft /></Button>
          }
        </div>
        <div className="nav-center">
          <Button icon onClick={() => setVizIdx(i => (i + 1) % VIZ_TYPES.length)} title="Cycle visualizer"><IconBarChart /></Button>
          <Button icon onClick={handleLyricsNav} title="Lyrics"><IconLyrics /></Button>
          <Button icon onClick={() => setLibraryOpen(true)} title="Audio library"><IconLibrary /></Button>
          <Button icon onClick={() => setSettingsOpen(true)} title="Settings"><IconSettings /></Button>
        </div>
        <div className="nav-right">
          <Button icon
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={!!activeSong || lyricsMode || page === totalPages - 1}
            title="Next page"
          ><IconChevronRight /></Button>
        </div>
      </nav>

      <LibraryDrawer open={libraryOpen} onClose={() => setLibraryOpen(false)} />
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
