import { useEffect, useState, useCallback } from "react";
import { getLyrics, saveLyrics, getAssist } from "../lib/api";
import LyricEditor from "../components/LyricEditor";

interface Props {
  songId: string;
  onBack: () => void;
}

export default function SongDetail({ songId, onBack }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "unsaved" | "saving">("saved");
  const [selectedWord, setSelectedWord] = useState("");
  const [assistType, setAssistType] = useState<"rhymes" | "synonyms">("rhymes");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [assistLoading, setAssistLoading] = useState(false);

  useEffect(() => {
    getLyrics(songId).then((l) => setContent(l.content ?? ""));
  }, [songId]);

  const handleChange = useCallback((html: string) => {
    setContent(html);
    setSaveState("unsaved");
  }, []);

  async function handleSave() {
    if (content === null) return;
    setSaveState("saving");
    await saveLyrics(songId, content);
    setSaveState("saved");
  }

  async function handleAssist() {
    if (!selectedWord.trim()) return;
    setAssistLoading(true);
    try {
      const results = await getAssist(selectedWord.trim(), assistType);
      setSuggestions(results);
    } finally {
      setAssistLoading(false);
    }
  }

  if (content === null) return <div className="page"><p>Loading…</p></div>;

  return (
    <div className="song-detail">
      <header>
        <button onClick={onBack}>← Songs</button>
        <button onClick={handleSave} disabled={saveState === "saved"}>
          {saveState === "saving" ? "Saving…" : saveState === "unsaved" ? "Save" : "Saved"}
        </button>
      </header>
      <div className="editor-layout">
        <div className="editor-pane">
          <LyricEditor content={content} onChange={handleChange} />
        </div>
        <aside className="ai-pane">
          <h3>Word Assistant</h3>
          <input
            value={selectedWord}
            onChange={(e) => setSelectedWord(e.target.value)}
            placeholder="Enter a word…"
          />
          <div className="assist-type">
            <label>
              <input
                type="radio"
                value="rhymes"
                checked={assistType === "rhymes"}
                onChange={() => setAssistType("rhymes")}
              />
              Rhymes
            </label>
            <label>
              <input
                type="radio"
                value="synonyms"
                checked={assistType === "synonyms"}
                onChange={() => setAssistType("synonyms")}
              />
              Synonyms
            </label>
          </div>
          <button onClick={handleAssist} disabled={assistLoading || !selectedWord.trim()}>
            {assistLoading ? "…" : "Get Suggestions"}
          </button>
          <ul className="suggestions">
            {suggestions.map((w) => (
              <li key={w} onClick={() => setSelectedWord(w)}>
                {w}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
