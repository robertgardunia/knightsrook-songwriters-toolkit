import { useState, useCallback } from "react";
import { saveLyrics, type Lyrics } from "../lib/api";
import BlockLyricEditor from "../components/BlockLyricEditor";
import { parseLyricsContent, serializeLyricsContent, type LyricsContent } from "../lib/lyricsBlocks";
import Button from "../components/Button";

interface Props {
  lyrics: Lyrics;
  onBack: () => void;
}

export default function LyricsDetail({ lyrics, onBack }: Props) {
  const [title, setTitle] = useState(lyrics.title);
  const [lyricsContent, setLyricsContent] = useState<LyricsContent>(() =>
    parseLyricsContent(lyrics.content)
  );
  const [saveState, setSaveState] = useState<"saved" | "unsaved" | "saving">("saved");

  const handleChange = useCallback((content: LyricsContent) => {
    setLyricsContent(content);
    setSaveState("unsaved");
  }, []);

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
    setSaveState("unsaved");
  }

  async function handleSave() {
    setSaveState("saving");
    try {
      await saveLyrics(lyrics.id, serializeLyricsContent(lyricsContent), title.trim() || "Untitled");
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
        <BlockLyricEditor content={lyricsContent} onChange={handleChange} />
      </div>
    </div>
  );
}
