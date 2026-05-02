import { useEffect, useState } from "react";
import { UserButton } from "@clerk/react";
import { listSongs, createSong, deleteSong, type Song } from "../lib/api";

interface Props {
  onSelect: (id: string) => void;
}

export default function SongList({ onSelect }: Props) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listSongs().then(setSongs).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const song = await createSong(newTitle.trim());
    setSongs((s) => [song, ...s]);
    setNewTitle("");
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await deleteSong(id);
    setSongs((s) => s.filter((x) => x.id !== id));
  }

  return (
    <div className="page">
      <header>
        <h1>Songwriter's Toolkit</h1>
        <UserButton />
      </header>
      <form onSubmit={handleCreate} className="new-song-form">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New song title..."
        />
        <button type="submit">+</button>
      </form>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <ul className="song-list">
          {songs.map((s) => (
            <li key={s.id} onClick={() => onSelect(s.id)}>
              <span>{s.title}</span>
              <button onClick={(e) => handleDelete(s.id, e)}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
