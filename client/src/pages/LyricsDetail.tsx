import { useState, useCallback } from "react";
import { saveLyrics, type Lyrics } from "../lib/api";
import LyricEditor from "../components/LyricEditor";
import Button from "../components/Button";

interface Props {
  lyrics: Lyrics;
  onBack: () => void;
}

export default function LyricsDetail({ lyrics, onBack }: Props) {
  const [title, setTitle] = useState(lyrics.title);
  const [content, setContent] = useState(lyrics.content ?? "");
  const [saveState, setSaveState] = useState<"saved" | "unsaved" | "saving">("saved");

  const handleChange = useCallback((html: string) => {
    setContent(html);
    setSaveState("unsaved");
  }, []);

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
    setSaveState("unsaved");
  }

  async function handleSave() {
    setSaveState("saving");
    try {
      await saveLyrics(lyrics.id, content, title.trim() || "Untitled");
      setSaveState("saved");
    } catch {
      setSaveState("unsaved");
    }
  }

  return (
    <div className="song-detail">
      <div className="panel-toggle">
        <input
          className="new-lyrics-title"
          value={title}
          onChange={handleTitleChange}
          placeholder="Sheet title…"
        />
        <Button size="sm" onClick={handleSave} disabled={saveState !== "unsaved"}>
          {saveState === "saving" ? "Saving…" : saveState === "unsaved" ? "Save" : "Saved"}
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
