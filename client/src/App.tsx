import { SignedIn, SignedOut, SignIn } from "@clerk/react";
import SongList from "./pages/SongList";
import SongDetail from "./pages/SongDetail";
import { useState } from "react";

export type Song = { id: string; title: string };

export default function App() {
  const [activeSongId, setActiveSongId] = useState<string | null>(null);

  return (
    <>
      <SignedOut>
        <div className="auth-screen">
          <SignIn routing="hash" />
        </div>
      </SignedOut>
      <SignedIn>
        {activeSongId ? (
          <SongDetail songId={activeSongId} onBack={() => setActiveSongId(null)} />
        ) : (
          <SongList onSelect={setActiveSongId} />
        )}
      </SignedIn>
    </>
  );
}
