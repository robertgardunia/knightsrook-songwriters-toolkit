import { useState, useCallback } from "react";
import { createLyrics, type Lyrics } from "../lib/api";
import BlockLyricEditor from "../components/BlockLyricEditor";
import { emptyContent, serializeLyricsContent, type LyricsContent } from "../lib/lyricsBlocks";
import Button from "../components/Button";

interface Props {
  onSaved: (lyrics: Lyrics) => void;
}

export default function NewLyrics({ onSaved }: Props) {
  const [title, setTitle] = useState("");
  const [lyricsContent, setLyricsContent] = useState<LyricsContent>(emptyContent);
  const [saving, setSaving] = useState(false);

  const handleChange = useCallback((content: LyricsContent) => {
    setLyricsContent(content);
  }, []);

  const hasContent = lyricsContent.blocks.some(b => b.lines.some(l => l.text.trim()));

  async function handleSave() {
    setSaving(true);
    try {
      const lyrics = await createLyrics(
        title.trim() || "Untitled",
        serializeLyricsContent(lyricsContent)
      );
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
        <Button size="sm" onClick={handleSave} disabled={saving || !hasContent}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
      <div className="panel-content panel-content--idle">
        <BlockLyricEditor content={lyricsContent} onChange={handleChange} />
      </div>
    </div>
  );
}
