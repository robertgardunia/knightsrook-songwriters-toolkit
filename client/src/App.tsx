import { Show, UserButton, useClerk } from "@clerk/react";
import { useState } from "react";
import SongList from "./pages/SongList";
import SongDetail from "./pages/SongDetail";
import LibraryDrawer from "./components/LibraryDrawer";
import SettingsDrawer from "./components/SettingsDrawer";
import Button from "./components/Button";
import type { Song } from "./lib/api";
import { type VizType } from "./components/Visualizer";

const VIZ_TYPES: VizType[] = ['bars', 'scope', 'vu', 'dots', 'radial'];

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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function App() {
  const { openSignIn } = useClerk();
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [vizIdx, setVizIdx] = useState(0);

  return (
    <div className="app">
      {/* Corner icons live outside app-inner to avoid arc overflow:hidden clipping */}
      <button className="chrome-icon chrome-icon--settings" onClick={() => setSettingsOpen(true)} title="Settings">
        <IconSettings />
      </button>
      <div className="chrome-icon chrome-icon--auth">
        <Show when="signed-out">
          <button className="chrome-corner-btn" onClick={() => openSignIn()} title="Sign in">
            <IconUser />
          </button>
        </Show>
        <Show when="signed-in">
          <div className="chrome-corner-user"><UserButton /></div>
        </Show>
      </div>

      <div className="app-inner">
        <header className="app-chrome">
          {activeSong ? (
            <span className="chrome-song-title">{activeSong.title}</span>
          ) : (
            <span className="chrome-wordmark">Songwriter<br />Toolkit</span>
          )}
        </header>

        <main className="app-main">
          {activeSong ? (
            <SongDetail song={activeSong} />
          ) : (
            <SongList
              onSelect={setActiveSong}
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
          {activeSong
            ? <Button icon onClick={() => setActiveSong(null)} title="Back"><IconChevronLeft /></Button>
            : <Button icon onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}><IconChevronLeft /></Button>
          }
        </div>
        <div className="nav-center">
          <Button icon onClick={() => setVizIdx(i => (i + 1) % VIZ_TYPES.length)} title="Cycle visualizer"><IconBarChart /></Button>
          <Button icon onClick={() => setLibraryOpen(true)} title="Library"><IconLibrary /></Button>
        </div>
        <div className="nav-right">
          {!activeSong && (
            <Button icon onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}><IconChevronRight /></Button>
          )}
        </div>
      </nav>

      <LibraryDrawer open={libraryOpen} onClose={() => setLibraryOpen(false)} />
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
