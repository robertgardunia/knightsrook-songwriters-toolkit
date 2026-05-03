import { Show, SignIn } from "@clerk/react";
import { useState } from "react";
import SongList from "./pages/SongList";
import SongDetail from "./pages/SongDetail";
import LibraryDrawer from "./components/LibraryDrawer";
import SettingsDrawer from "./components/SettingsDrawer";
import Button from "./components/Button";
import type { Song } from "./lib/api";

function IconLibrary() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
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

export default function App() {
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <Show when="signed-out">
        <div className="auth-screen">
          <SignIn routing="hash" />
        </div>
      </Show>
      <Show when="signed-in">
        <div className="app">
          <header className="app-chrome">
            <div className="chrome-left">
              {activeSong ? (
                <Button onClick={() => setActiveSong(null)}>
                  ← <span className="chrome-back__title">{activeSong.title}</span>
                </Button>
              ) : (
                <span className="chrome-wordmark">Songwriter's<br />Toolkit</span>
              )}
            </div>
            <div className="chrome-right">
              <Button icon onClick={() => setLibraryOpen(true)} title="Library">
                <IconLibrary />
              </Button>
              <Button icon onClick={() => setSettingsOpen(true)} title="Settings">
                <IconSettings />
              </Button>
            </div>
          </header>

          <main className="app-main">
            {activeSong ? (
              <SongDetail song={activeSong} />
            ) : (
              <SongList onSelect={setActiveSong} />
            )}
          </main>

          <LibraryDrawer open={libraryOpen} onClose={() => setLibraryOpen(false)} />
          <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </div>
      </Show>
    </>
  );
}
