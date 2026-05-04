import { useRef } from "react";
import { useAudioEngine } from "../hooks/useAudioEngine";
import Visualizer, { type VizType } from "./Visualizer";
import Button from "./Button";

interface Props {
  songId: string;
  vizType: VizType;
}

function IconPlay() {
  return <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/><path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445"/></svg>;
}
function IconPause() {
  return <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/><path d="M5 6.25a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0zm3.5 0a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0z"/></svg>;
}
function IconStop() {
  return <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/><path d="M5 6.5A1.5 1.5 0 0 1 6.5 5h3A1.5 1.5 0 0 1 11 6.5v3A1.5 1.5 0 0 1 9.5 11h-3A1.5 1.5 0 0 1 5 9.5z"/></svg>;
}
function IconRecord() {
  return <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="5"/></svg>;
}
function IconTrash() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
}

export default function Mixer({ songId, vizType }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    tracks, isPlaying, isRecording, loading,
    play, pause, stop,
    startRecording, stopRecording,
    removeTrack,
    setVolume, setMute, setSolo,
  } = useAudioEngine(songId);

  async function handleFileAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    // uploadTrack handled inside hook — just trigger import flow
    const { uploadTrack } = await import("../lib/api");
    const { audioEngine } = await import("../lib/audioEngine");
    const remote = await uploadTrack(songId, file);
    await audioEngine.loadTrack(remote.id, remote.original_name, `/api/audio/file/${remote.filename}`);
  }

  return (
    <div className="mixer">
      {/* Visualizer */}
      <div className="visualizer-wrap">
        <Visualizer type={vizType} active={isPlaying} />
      </div>

      {/* Transport */}
      <div className="mixer-transport">
        <Button icon size="sm" onClick={isPlaying ? pause : play} disabled={tracks.length === 0} title={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? <IconPause /> : <IconPlay />}
        </Button>
        <Button icon size="sm" onClick={stop} disabled={!isPlaying} title="Stop"><IconStop /></Button>
        <Button
          icon size="sm"
          className={isRecording ? "btn--recording" : ""}
          onClick={isRecording ? stopRecording : startRecording}
          title={isRecording ? "Stop recording" : "Record"}
        ><IconRecord /></Button>
        <button className="mixer-add-btn" onClick={() => fileInputRef.current?.click()} title="Import audio file">
          + Import
        </button>
        <input ref={fileInputRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={handleFileAdd} />
      </div>

      {/* Track list */}
      <div className="mixer-tracks">
        {loading && <div className="mixer-empty">Loading tracks…</div>}
        {!loading && tracks.length === 0 && (
          <div className="mixer-empty">No tracks yet — record or import audio</div>
        )}
        {tracks.map(track => (
          <div key={track.id} className="mixer-track">
            <div className="mixer-track__name" title={track.name}>{track.name}</div>
            <div className="mixer-track__wave" aria-hidden="true" />
            <div className="mixer-track__controls">
              <button
                className={`mixer-btn${track.muted ? " mixer-btn--active" : ""}`}
                onClick={() => setMute(track.id, !track.muted)}
                title="Mute"
              >M</button>
              <button
                className={`mixer-btn${track.solo ? " mixer-btn--active" : ""}`}
                onClick={() => setSolo(track.id, !track.solo)}
                title="Solo"
              >S</button>
              <input
                type="range" min={0} max={1} step={0.01}
                value={track.volume}
                onChange={e => setVolume(track.id, parseFloat(e.target.value))}
                className="mixer-track__vol"
                title="Volume"
              />
              <button
                className="mixer-btn mixer-btn--danger"
                onClick={() => removeTrack(track.id, track.id)}
                title="Remove track"
              ><IconTrash /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
