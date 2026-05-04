import { useEffect, useState, useCallback, useRef } from "react";
import { getLyrics, saveLyrics, getAssist, type Song } from "../lib/api";
import LyricEditor from "../components/LyricEditor";
import Visualizer, { type VizType } from "../components/Visualizer";
import Button from "../components/Button";

interface Props {
  song: Song;
  vizType: VizType;
}

type Panel = "lyrics" | "mixer";
type AnimState = "idle" | "out" | "in";

export default function SongDetail({ song, vizType }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "unsaved" | "saving">("saved");
  const [panel, setPanel] = useState<Panel>("lyrics");
  const [anim, setAnim] = useState<AnimState>("idle");
  const [selectedWord, setSelectedWord] = useState("");
  const [assistType, setAssistType] = useState<"rhymes" | "synonyms">("rhymes");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [assistLoading, setAssistLoading] = useState(false);
  const nextPanel = useRef<Panel>("lyrics");

  useEffect(() => {
    getLyrics(song.id).then(l => setContent(l.content ?? ""));
  }, [song.id]);

  const handleChange = useCallback((html: string) => {
    setContent(html);
    setSaveState("unsaved");
  }, []);

  async function handleSave() {
    if (content === null) return;
    setSaveState("saving");
    await saveLyrics(song.id, content);
    setSaveState("saved");
  }

  function switchPanel(to: Panel) {
    if (to === panel || anim !== "idle") return;
    nextPanel.current = to;
    setAnim("out");
    setTimeout(() => {
      setPanel(to);
      setAnim("in");
      setTimeout(() => setAnim("idle"), 220);
    }, 200);
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

  return (
    <div className="song-detail">
      <div className="panel-toggle">
        <Button
          className={panel === "lyrics" ? "panel-btn--active" : ""}
          onClick={() => switchPanel("lyrics")}
        >Lyrics</Button>
        <Button
          className={panel === "mixer" ? "panel-btn--active" : ""}
          onClick={() => switchPanel("mixer")}
        >Mixer</Button>
        {panel === "lyrics" && (
          <Button size="sm" onClick={handleSave} disabled={saveState !== "unsaved"}>
            {saveState === "saving" ? "Saving…" : saveState === "unsaved" ? "Save" : "Saved"}
          </Button>
        )}
      </div>

      <div className={`panel-content panel-content--${anim}`}>
        {panel === "lyrics" ? (
          content === null ? (
            <div className="panel-loading">Loading…</div>
          ) : (
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
          )
        ) : (
          <div className="mixer-view">
            <div className="visualizer-wrap">
              <Visualizer type={vizType} active={false} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
