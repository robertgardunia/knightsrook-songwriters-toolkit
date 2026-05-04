import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import { listLyrics, setTokenGetter, type Lyrics } from "../lib/api";
import Button from "../components/Button";

interface Props {
  onSelect: (lyrics: Lyrics) => void;
  onNew: () => void;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function LyricsLibrary({ onSelect, onNew }: Props) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [sheets, setSheets] = useState<Lyrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { setLoading(false); return; }
    setTokenGetter(getToken);
    listLyrics().then(setSheets).finally(() => setLoading(false));
  }, [isLoaded, isSignedIn, getToken]);

  return (
    <div className="lyrics-library">
      {/* Top section — fills the arched zone the same way the visualizer does on the home screen */}
      <div className="lyrics-library__top">
        <span className="lyrics-library__count">
          {loading ? "—" : sheets.length}
        </span>
        <span className="lyrics-library__count-label">sheets</span>
      </div>

      {/* Chrome strip — sits at the arch boundary, mirrors search-bar on home screen */}
      <div className="lyrics-library__bar">
        <span className="lyrics-library__bar-label">LYRICS SHEETS</span>
        <Button size="sm" onClick={onNew}>+ New Sheet</Button>
      </div>

      {/* Scrollable list */}
      <div className="lyrics-library__body">
        {loading ? (
          <div className="lyrics-empty">Loading…</div>
        ) : sheets.length === 0 ? (
          <div className="lyrics-empty">Nothing here yet.<br />Tap <strong>+ New Sheet</strong> to start writing.</div>
        ) : (
          <ul className="lyrics-list">
            {sheets.map(l => (
              <li key={l.id} className="lyrics-item" onClick={() => onSelect(l)}>
                <span className="lyrics-item__title">{l.title}</span>
                <span className="lyrics-item__date">{formatDate(l.updated_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
