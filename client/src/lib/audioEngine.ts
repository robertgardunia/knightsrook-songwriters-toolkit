export interface Track {
  id: string;
  name: string;
  buffer: AudioBuffer;
  gainNode: GainNode;
  volume: number;
  muted: boolean;
  solo: boolean;
}

type EngineListener = () => void;

class AudioEngine {
  private _ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private tracks = new Map<string, Track>();
  private activeSources = new Map<string, AudioBufferSourceNode>();
  private listeners = new Set<EngineListener>();
  private _isPlaying = false;
  private playbackOffset = 0;
  private playbackStartedAt = 0;

  get ctx(): AudioContext {
    if (!this._ctx) {
      this._ctx = new AudioContext();
      this.masterGain = this._ctx.createGain();
      this.masterGain.connect(this._ctx.destination);
    }
    return this._ctx;
  }

  get isPlaying() { return this._isPlaying; }
  get currentTime() {
    if (!this._isPlaying) return this.playbackOffset;
    return this.playbackOffset + (this.ctx.currentTime - this.playbackStartedAt);
  }
  getTrack(id: string) { return this.tracks.get(id); }
  getTracks() { return Array.from(this.tracks.values()); }

  subscribe(fn: EngineListener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private notify() { this.listeners.forEach(fn => fn()); }

  async resume() {
    if (this._ctx?.state === "suspended") await this._ctx.resume();
  }

  async loadTrack(id: string, name: string, url: string): Promise<void> {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    const buffer = await this.ctx.decodeAudioData(buf);
    const gainNode = this.ctx.createGain();
    gainNode.connect(this.masterGain!);
    const existing = this.tracks.get(id);
    this.tracks.set(id, {
      id, name, buffer, gainNode,
      volume: existing?.volume ?? 1,
      muted: existing?.muted ?? false,
      solo: existing?.solo ?? false,
    });
    if (existing?.muted) gainNode.gain.value = 0;
    this.notify();
  }

  removeTrack(id: string) {
    const track = this.tracks.get(id);
    if (!track) return;
    this.activeSources.get(id)?.stop();
    this.activeSources.delete(id);
    track.gainNode.disconnect();
    this.tracks.delete(id);
    this.notify();
  }

  play() {
    if (this._isPlaying) return;
    this.resume();
    const offset = this.playbackOffset;
    this.tracks.forEach(track => {
      const src = this.ctx.createBufferSource();
      src.buffer = track.buffer;
      src.connect(track.gainNode);
      src.start(0, Math.min(offset, track.buffer.duration));
      this.activeSources.set(track.id, src);
    });
    this.playbackStartedAt = this.ctx.currentTime;
    this._isPlaying = true;
    this.notify();
  }

  pause() {
    if (!this._isPlaying) return;
    this.playbackOffset = this.currentTime;
    this.activeSources.forEach(src => { try { src.stop(); } catch {} });
    this.activeSources.clear();
    this._isPlaying = false;
    this.notify();
  }

  stop() {
    this.activeSources.forEach(src => { try { src.stop(); } catch {} });
    this.activeSources.clear();
    this._isPlaying = false;
    this.playbackOffset = 0;
    this.notify();
  }

  setVolume(id: string, volume: number) {
    const track = this.tracks.get(id);
    if (!track) return;
    track.volume = volume;
    if (!track.muted) track.gainNode.gain.value = volume;
    this.notify();
  }

  setMute(id: string, muted: boolean) {
    const track = this.tracks.get(id);
    if (!track) return;
    track.muted = muted;
    track.gainNode.gain.value = muted ? 0 : track.volume;
    this.notify();
  }

  setSolo(id: string, solo: boolean) {
    const track = this.tracks.get(id);
    if (!track) return;
    track.solo = solo;
    const hasSolo = Array.from(this.tracks.values()).some(t => t.solo);
    this.tracks.forEach(t => {
      t.gainNode.gain.value = hasSolo ? (t.solo ? t.volume : 0) : (t.muted ? 0 : t.volume);
    });
    this.notify();
  }

  setMasterVolume(vol: number) {
    if (this.masterGain) this.masterGain.gain.value = vol;
  }

  destroy() {
    this.stop();
    this._ctx?.close();
    this._ctx = null;
    this.tracks.clear();
  }
}

export const audioEngine = new AudioEngine();
