async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
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

export const getLyrics = (songId: string) =>
  apiFetch<{ content: string }>(`/songs/${songId}/lyrics`);
export const saveLyrics = (songId: string, content: string) =>
  apiFetch<{ content: string }>(`/songs/${songId}/lyrics`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });

export const getAssist = (word: string, type: "rhymes" | "synonyms") =>
  apiFetch<string[]>("/ai/assist", {
    method: "POST",
    body: JSON.stringify({ word, type }),
  });
