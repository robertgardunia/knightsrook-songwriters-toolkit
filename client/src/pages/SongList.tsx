import { useEffect, useRef, useState } from "react";
import { listSongs, createSong, deleteSong, type Song } from "../lib/api";
import Visualizer from "../components/Visualizer";
import Button from "../components/Button";

const SLOTS_PER_PAGE = 6;

interface Props {
  onSelect: (song: Song) => void;
}

export default function SongList({ onSelect }: Props) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingAt, setAddingAt] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [page, setPage] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listSongs().then(setSongs).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (addingAt !== null) inputRef.current?.focus();
  }, [addingAt]);

  const totalSlots = Math.ceil((songs.length + 1) / SLOTS_PER_PAGE) * SLOTS_PER_PAGE;
  const allSlots: (Song | null)[] = [
    ...songs,
    ...Array(totalSlots - songs.length).fill(null),
  ];
  const totalPages = Math.ceil(allSlots.length / SLOTS_PER_PAGE);
  const slots = allSlots.slice(page * SLOTS_PER_PAGE, (page + 1) * SLOTS_PER_PAGE);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) { setAddingAt(null); return; }
    const song = await createSong(newTitle.trim());
    setSongs(s => [song, ...s]);
    setNewTitle("");
    setAddingAt(null);
    setPage(0);
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await deleteSong(id);
    setSongs(s => s.filter(x => x.id !== id));
  }

  return (
    <div className="home">
      <div className="visualizer-wrap">
        <Visualizer />
      </div>

      <div className="panel-section">
        <div className="jukebox-panel">
          <div className="jukebox-panel__header">SELECT A TRACK</div>
          {loading ? (
            <div className="jukebox-panel__loading">Loading…</div>
          ) : (
            <ul className="title-cards">
              {slots.map((song, i) => {
                const globalIndex = page * SLOTS_PER_PAGE + i;
                return (
                  <li
                    key={song?.id ?? `empty-${globalIndex}`}
                    className={`title-card ${song ? "title-card--filled" : "title-card--empty"}`}
                  >
                    <span className="title-card__num">{String(globalIndex + 1).padStart(2, "0")}</span>
                    {song ? (
                      <>
                        <span className="title-card__title" onClick={() => onSelect(song)}>
                          {song.title}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon
                          onClick={e => handleDelete(song.id, e)}
                        >✕</Button>
                      </>
                    ) : addingAt === globalIndex ? (
                      <form onSubmit={handleCreate} className="title-card__form">
                        <input
                          ref={inputRef}
                          value={newTitle}
                          onChange={e => setNewTitle(e.target.value)}
                          placeholder="Song title…"
                          onBlur={e => {
                            if (e.relatedTarget?.closest("form") === e.currentTarget.closest("form")) return;
                            setAddingAt(null);
                            setNewTitle("");
                          }}
                        />
                        <Button size="sm" type="submit" onMouseDown={e => e.preventDefault()}>✓</Button>
                      </form>
                    ) : (
                      <span className="title-card__add" onClick={() => setAddingAt(globalIndex)}>
                        Add new song…
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {totalPages > 1 && (
          <div className="panel-nav">
            <Button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>‹</Button>
            <span className="page-indicator">{page + 1} / {totalPages}</span>
            <Button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>›</Button>
          </div>
        )}
      </div>
    </div>
  );
}
