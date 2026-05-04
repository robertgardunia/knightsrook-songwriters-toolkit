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
      <div className="lyrics-library__header">
        <span className="lyrics-library__label">LYRICS SHEETS</span>
        <Button size="sm" onClick={onNew}>+ New Sheet</Button>
      </div>

      {loading ? (
        <div className="lyrics-empty">Loading…</div>
      ) : sheets.length === 0 ? (
        <div className="lyrics-empty">No lyrics yet. Tap <strong>+ New Sheet</strong> to write.</div>
      ) : (
        <ul className="lyrics-list">
          {sheets.map(l => (
            <li
              key={l.id}
              className="lyrics-item"
              onClick={() => onSelect(l)}
            >
              <span className="lyrics-item__title">{l.title}</span>
              <span className="lyrics-item__date">{formatDate(l.updated_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
