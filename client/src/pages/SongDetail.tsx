import { useEffect, useState, useCallback, useRef } from "react";
import {
  getSongLyrics,
  saveLyrics,
  createAndAssociateLyrics,
  getAssist,
  type Song,
  type Lyrics,
} from "../lib/api";
import LyricEditor from "../components/LyricEditor";
import Mixer from "../components/Mixer";
import { type VizType } from "../components/Visualizer";
import Button from "../components/Button";

type Panel = "lyrics" | "mixer";
type AnimState = "idle" | "out" | "in";

interface Props {
  song: Song;
  vizType: VizType;
  panel: Panel;
  onPanelChange: (p: Panel) => void;
}

export default function SongDetail({ song, vizType, panel, onPanelChange }: Props) {
  const [activeLyrics, setActiveLyrics] = useState<Lyrics | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(true);
  const [content, setContent] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "unsaved" | "saving">("saved");
  const [displayPanel, setDisplayPanel] = useState<Panel>(panel);
  const [anim, setAnim] = useState<AnimState>("idle");
  const [selectedWord, setSelectedWord] = useState("");
  const [assistType, setAssistType] = useState<"rhymes" | "synonyms">("rhymes");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [assistLoading, setAssistLoading] = useState(false);
  const animLock = useRef(false);

  useEffect(() => {
    setLyricsLoading(true);
    setActiveLyrics(null);
    setContent(null);
    getSongLyrics(song.id)
      .then(sheets => {
        setActiveLyrics(sheets[0] ?? null);
        setContent(sheets[0]?.content ?? null);
      })
      .finally(() => setLyricsLoading(false));
  }, [song.id]);

  useEffect(() => {
    if (panel === displayPanel || animLock.current) return;
    animLock.current = true;
    setAnim("out");
    setTimeout(() => {
      setDisplayPanel(panel);
      setAnim("in");
      setTimeout(() => { setAnim("idle"); animLock.current = false; }, 220);
    }, 200);
  }, [panel]);

  const handleChange = useCallback((html: string) => {
    setContent(html);
    setSaveState("unsaved");
  }, []);

  async function handleSave() {
    if (content === null || !activeLyrics) return;
    setSaveState("saving");
    await saveLyrics(activeLyrics.id, content);
    setSaveState("saved");
  }

  async function handleWriteLyrics() {
    const created = await createAndAssociateLyrics(song.id, song.title, "");
    setActiveLyrics(created);
    setContent(created.content ?? "");
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

  function renderLyricsPanel() {
    if (lyricsLoading) {
      return <div className="panel-loading">Loading…</div>;
    }
    if (!activeLyrics) {
      return (
        <div className="panel-loading">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <span>No lyrics yet.</span>
            <Button onClick={handleWriteLyrics}>Write Lyrics</Button>
          </div>
        </div>
      );
    }
    if (content === null) {
      return <div className="panel-loading">Loading…</div>;
    }
    return (
      <div className="editor-layout">
        <div className="editor-pane">
          <LyricEditor content={content} onChange={handleChange} />
        </div>
        <aside className="ai-pane">
          <h3>Word Assistant</h3>
          <input
            value={selectedWord}
            onChange={e => setSelectedWord(e.target.value)}
            placeholder="Enter a word…"
          />
          <div className="assist-type">
            <label>
              <input type="radio" value="rhymes" checked={assistType === "rhymes"} onChange={() => setAssistType("rhymes")} />
              Rhymes
            </label>
            <label>
              <input type="radio" value="synonyms" checked={assistType === "synonyms"} onChange={() => setAssistType("synonyms")} />
              Synonyms
            </label>
          </div>
          <Button onClick={handleAssist} disabled={assistLoading || !selectedWord.trim()}>
            {assistLoading ? "…" : "Get Suggestions"}
          </Button>
          <ul className="suggestions">
            {suggestions.map(w => (
              <li key={w} onClick={() => setSelectedWord(w)}>{w}</li>
            ))}
          </ul>
        </aside>
      </div>
    );
  }

  return (
    <div className="song-detail">
      <div className="panel-toggle">
        <Button
          className={displayPanel === "lyrics" ? "panel-btn--active" : ""}
          onClick={() => onPanelChange("lyrics")}
        >Lyrics</Button>
        <Button
          className={displayPanel === "mixer" ? "panel-btn--active" : ""}
          onClick={() => onPanelChange("mixer")}
        >Mixer</Button>
        {displayPanel === "lyrics" && activeLyrics && (
          <Button size="sm" onClick={handleSave} disabled={saveState !== "unsaved"}>
            {saveState === "saving" ? "Saving…" : saveState === "unsaved" ? "Save" : "Saved"}
          </Button>
        )}
      </div>

      <div className={`panel-content panel-content--${anim}`}>
        {displayPanel === "lyrics" ? renderLyricsPanel() : (
          <Mixer songId={song.id} vizType={vizType} />
        )}
      </div>
    </div>
  );
}
