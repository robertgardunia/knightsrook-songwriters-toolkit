import { useState, useCallback } from "react";
import { createLyrics, type Lyrics } from "../lib/api";
import LyricEditor from "../components/LyricEditor";
import Button from "../components/Button";

interface Props {
  onSaved: (lyrics: Lyrics) => void;
}

export default function NewLyrics({ onSaved }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = useCallback((html: string) => setContent(html), []);

  async function handleSave() {
    const t = title.trim() || "Untitled";
    setSaving(true);
    try {
      const lyrics = await createLyrics(t, content);
      onSaved(lyrics);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="song-detail">
      <div className="panel-toggle">
        <input
          className="new-lyrics-title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Sheet title…"
          autoFocus
        />
        <Button size="sm" onClick={handleSave} disabled={saving || !content.trim()}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
      <div className="panel-content panel-content--idle">
        <div className="editor-layout">
          <div className="editor-pane">
            <LyricEditor content={content} onChange={handleChange} />
          </div>
        </div>
      </div>
    </div>
  );
}
