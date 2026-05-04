let _getToken: (() => Promise<string | null>) | null = null;

export function setTokenGetter(fn: () => Promise<string | null>) {
  _getToken = fn;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = _getToken ? await _getToken() : null;
  const res = await fetch(`/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    ...init,
  });
  const json = (await res.json()) as { success: boolean; data: T; error?: string };
  if (!json.success) throw new Error(json.error ?? "API error");
  return json.data;
}

export type Song = { id: string; title: string; created_at?: string; updated_at?: string };

export const listSongs = () => apiFetch<Song[]>("/songs");
export const createSong = (title: string) =>
  apiFetch<Song>("/songs", { method: "POST", body: JSON.stringify({ title }) });
export const deleteSong = (id: string) =>
  apiFetch<null>(`/songs/${id}`, { method: "DELETE" });
export const updateSong = (id: string, title: string) =>
  apiFetch<Song>(`/songs/${id}`, { method: "PATCH", body: JSON.stringify({ title }) });

export type Lyrics = {
  id: string;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
};

export const listLyrics = () => apiFetch<Lyrics[]>("/lyrics");
export const createLyrics = (title: string, content?: string) =>
  apiFetch<Lyrics>("/lyrics", {
    method: "POST",
    body: JSON.stringify({ title, content: content ?? "" }),
  });
export const getLyricsById = (id: string) => apiFetch<Lyrics>(`/lyrics/${id}`);
export const saveLyrics = (id: string, content: string, title?: string) =>
  apiFetch<Lyrics>(`/lyrics/${id}`, {
    method: "PUT",
    body: JSON.stringify({ content, ...(title !== undefined ? { title } : {}) }),
  });
export const deleteLyrics = (id: string) =>
  apiFetch<null>(`/lyrics/${id}`, { method: "DELETE" });

export const getSongLyrics = (songId: string) =>
  apiFetch<Lyrics[]>(`/songs/${songId}/lyrics`);
export const associateLyrics = (songId: string, lyricsId: string) =>
  apiFetch<null>(`/songs/${songId}/lyrics`, {
    method: "POST",
    body: JSON.stringify({ lyricsId }),
  });
export const createAndAssociateLyrics = (songId: string, title: string, content: string) =>
  apiFetch<Lyrics>(`/songs/${songId}/lyrics`, {
    method: "POST",
    body: JSON.stringify({ title, content }),
  });
export const disassociateLyrics = (songId: string, lyricsId: string) =>
  apiFetch<null>(`/songs/${songId}/lyrics/${lyricsId}`, { method: "DELETE" });

export const getAssist = (word: string, type: "rhymes" | "synonyms") =>
  apiFetch<string[]>("/ai/assist", {
    method: "POST",
    body: JSON.stringify({ word, type }),
  });

export type AudioFile = {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  duration_ms: number | null;
  size_bytes: number;
};

export const listSongTracks = (songId: string) =>
  apiFetch<AudioFile[]>(`/songs/${songId}/audio`);

export async function uploadTrack(songId: string, file: File): Promise<AudioFile> {
  const token = _getToken ? await _getToken() : null;
  const form = new FormData();
  form.append("audio", file);
  const res = await fetch(`/api/songs/${songId}/audio`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const json = (await res.json()) as { success: boolean; data: AudioFile; error?: string };
  if (!json.success) throw new Error(json.error ?? "Upload failed");
  return json.data;
}

export const deleteTrack = (songId: string, fileId: string) =>
  apiFetch<null>(`/songs/${songId}/audio/${fileId}`, { method: "DELETE" });
