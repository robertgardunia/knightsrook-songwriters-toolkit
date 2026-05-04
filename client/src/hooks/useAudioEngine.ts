import { useEffect, useRef, useState, useCallback } from "react";
import { audioEngine } from "../lib/audioEngine";
import { listSongTracks, uploadTrack, deleteTrack } from "../lib/api";

export interface RemoteTrack {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  duration_ms: number | null;
  size_bytes: number;
}

export function useAudioEngine(songId: string) {
  const [tracks, setTracks] = useState(audioEngine.getTracks());
  const [isPlaying, setIsPlaying] = useState(audioEngine.isPlaying);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  // Sync engine state into React
  useEffect(() => {
    return audioEngine.subscribe(() => {
      setTracks(audioEngine.getTracks());
      setIsPlaying(audioEngine.isPlaying);
    });
  }, []);

  // Load tracks from server and buffer them
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listSongTracks(songId).then(async remoteTracks => {
      if (cancelled) return;
      for (const t of remoteTracks) {
        const url = `/api/audio/file/${t.filename}`;
        await audioEngine.loadTrack(t.id, t.original_name, url);
      }
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => {
      cancelled = true;
      audioEngine.destroy();
    };
  }, [songId]);

  const play = useCallback(() => audioEngine.play(), []);
  const pause = useCallback(() => audioEngine.pause(), []);
  const stop = useCallback(() => audioEngine.stop(), []);

  const startRecording = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunks.current = [];
    mr.ondataavailable = e => { if (e.data.size > 0) chunks.current.push(e.data); };
    mr.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(chunks.current, { type: mr.mimeType });
      const ext = mr.mimeType.includes("mp4") ? ".mp4" : ".webm";
      const file = new File([blob], `recording-${Date.now()}${ext}`, { type: mr.mimeType });
      const remote = await uploadTrack(songId, file);
      await audioEngine.loadTrack(remote.id, remote.original_name, `/api/audio/file/${remote.filename}`);
      setIsRecording(false);
    };
    mr.start();
    recorder.current = mr;
    setIsRecording(true);
  }, [songId]);

  const stopRecording = useCallback(() => {
    recorder.current?.stop();
    recorder.current = null;
  }, []);

  const removeTrack = useCallback(async (id: string, songAudioFileId: string) => {
    await deleteTrack(songId, songAudioFileId);
    audioEngine.removeTrack(id);
  }, [songId]);

  return {
    tracks,
    isPlaying,
    isRecording,
    loading,
    play,
    pause,
    stop,
    startRecording,
    stopRecording,
    removeTrack,
    setVolume: audioEngine.setVolume.bind(audioEngine),
    setMute: audioEngine.setMute.bind(audioEngine),
    setSolo: audioEngine.setSolo.bind(audioEngine),
  };
}
