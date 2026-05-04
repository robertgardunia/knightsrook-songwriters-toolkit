import { useEffect, useRef, useState } from "react";
import { listSongs, createSong, deleteSong, updateSong, type Song } from "../lib/api";
import Visualizer, { type VizType } from "../components/Visualizer";
import Button from "../components/Button";

const SLOTS_PER_PAGE = 6;

interface Props {
  onSelect: (song: Song) => void;
  page: number;
  onPageChange: (page: number) => void;
  onTotalPagesChange: (total: number) => void;
  vizType: VizType;
}

export default function SongList({ onSelect, page, onPageChange, onTotalPagesChange, vizType }: Props) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingAt, setAddingAt] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [search, setSearch] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLInputElement>(null);
  const addSubmitRef = useRef(false);
  const editSubmitRef = useRef(false);

  useEffect(() => {
    listSongs().then(setSongs).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (addingAt !== null) inputRef.current?.focus();
  }, [addingAt]);

  useEffect(() => {
    if (editingId !== null) editRef.current?.focus();
  }, [editingId]);

  const isSearching = search.trim().length > 0;
  const filteredSongs = isSearching
    ? songs.filter(s => s.title.toLowerCase().includes(search.toLowerCase().trim()))
    : null;

  const totalSlots = Math.ceil((songs.length + 1) / SLOTS_PER_PAGE) * SLOTS_PER_PAGE;
  const allSlots: (Song | null)[] = [
    ...songs,
    ...Array(totalSlots - songs.length).fill(null),
  ];
  const totalPages = Math.ceil(allSlots.length / SLOTS_PER_PAGE);
  const pagedSlots = allSlots.slice(page * SLOTS_PER_PAGE, (page + 1) * SLOTS_PER_PAGE);

  const displaySlots: (Song | null)[] = isSearching ? filteredSongs! : pagedSlots;

  useEffect(() => {
    onTotalPagesChange(isSearching ? 1 : totalPages);
  }, [totalPages, isSearching, onTotalPagesChange]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) { setAddingAt(null); return; }
    const song = await createSong(newTitle.trim());
    setSongs(s => [song, ...s]);
    setNewTitle("");
    setAddingAt(null);
    onPageChange(0);
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await deleteSong(id);
    setSongs(s => s.filter(x => x.id !== id));
    if (selectedSong?.id === id) setSelectedSong(null);
  }

  async function handleRename(id: string, e: React.FormEvent) {
    e.preventDefault();
    if (!editTitle.trim()) { setEditingId(null); return; }
    const updated = await updateSong(id, editTitle.trim());
    setSongs(s => s.map(x => x.id === id ? { ...x, title: updated.title } : x));
    setEditingId(null);
    setSelectedSong(null);
  }

  function handleSelectSong(song: Song) {
    const next = selectedSong?.id === song.id ? null : song;
    setSelectedSong(next);
    setEditingId(null);
    if (!next) setIsPlaying(false);
  }

  function startEdit(song: Song) {
    setEditTitle(song.title);
    setEditingId(song.id);
    setSelectedSong(null);
  }

  return (
    <div className="home">
      <div className="visualizer-wrap">
        <Visualizer type={vizType} active={isPlaying} />
        <button
          className={`viz-play-btn${selectedSong ? (isPlaying ? ' viz-play-btn--playing' : ' viz-play-btn--ready') : ''}`}
          onClick={() => selectedSong && setIsPlaying(p => !p)}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg width="44" height="44" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
              <path d="M5 6.25a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0zm3.5 0a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0z"/>
            </svg>
          ) : (
            <svg width="44" height="44" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
              <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445"/>
            </svg>
          )}
        </button>
      </div>

      <div className="search-bar">
        <input
          type="search"
          value={search}
          onChange={e => { setSearch(e.target.value); onPageChange(0); }}
          placeholder="Search tracks…"
        />
      </div>

      <div className="panel-section">
        <div className="jukebox-panel">
          <div className="jukebox-panel__header">SELECT A TRACK</div>
          {loading ? (
            <div className="jukebox-panel__loading">Loading…</div>
          ) : (
            <ul className="title-cards">
              {displaySlots.map((song, i) => {
                const globalIndex = isSearching ? i : page * SLOTS_PER_PAGE + i;
                const isSelected = !!song && selectedSong?.id === song.id;
                const isEditing = !!song && editingId === song.id;
                return (
                  <li
                    key={song?.id ?? `empty-${globalIndex}`}
                    className={`title-card ${song ? "title-card--filled" : "title-card--empty"}${isSelected ? " title-card--selected" : ""}`}
                  >
                    <span className="title-card__num">{String(globalIndex + 1).padStart(2, "0")}</span>

                    {song ? (
                      isEditing ? (
                        <form onSubmit={e => handleRename(song.id, e)} className="title-card__form">
                          <input
                            ref={editRef}
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            onBlur={e => {
                              if (editSubmitRef.current) { editSubmitRef.current = false; return; }
                              if (e.relatedTarget?.closest("form") === e.currentTarget.closest("form")) return;
                              setEditingId(null);
                            }}
                          />
                          <Button
                            size="sm"
                            type="submit"
                            onPointerDown={() => { editSubmitRef.current = true; }}
                          >✓</Button>
                        </form>
                      ) : isSelected ? (
                        <>
                          <span className="title-card__title title-card__title--selected">{song.title}</span>
                          <Button size="sm" onClick={() => onSelect(song)}>Lyrics</Button>
                          <Button size="sm" onClick={() => startEdit(song)}>Edit</Button>
                        </>
                      ) : (
                        <>
                          <span className="title-card__title" onClick={() => handleSelectSong(song)}>
                            {song.title}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon
                            onClick={e => handleDelete(song.id, e)}
                          >✕</Button>
                        </>
                      )
                    ) : !isSearching && addingAt === globalIndex ? (
                      <form onSubmit={handleCreate} className="title-card__form">
                        <input
                          ref={inputRef}
                          value={newTitle}
                          onChange={e => setNewTitle(e.target.value)}
                          placeholder="Song title…"
                          onBlur={e => {
                            if (addSubmitRef.current) { addSubmitRef.current = false; return; }
                            if (e.relatedTarget?.closest("form") === e.currentTarget.closest("form")) return;
                            setAddingAt(null);
                            setNewTitle("");
                          }}
                        />
                        <Button
                          size="sm"
                          type="submit"
                          onPointerDown={() => { addSubmitRef.current = true; }}
                        >✓</Button>
                      </form>
                    ) : !isSearching ? (
                      <span className="title-card__add" onClick={() => setAddingAt(globalIndex)}>
                        Add new song…
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
