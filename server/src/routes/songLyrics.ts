import { Router } from "express";
import { getAuth } from "@clerk/express";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../lib/db.js";

const router = Router({ mergeParams: true });

function userId(req: Parameters<typeof getAuth>[0]) {
  return getAuth(req).userId ?? null;
}

/** Verify the song exists and belongs to the user. Returns the song id or null. */
async function ownedSongId(songId: string, uid: string): Promise<string | null> {
  const [rows] = await pool.execute(
    "SELECT id FROM songs WHERE id = ? AND user_id = ?",
    [songId, uid]
  );
  return (rows as any[]).length > 0 ? songId : null;
}

// GET /songs/:id/lyrics — list lyrics associated with this song
router.get("/", async (req, res, next) => {
  try {
    const uid = userId(req);
    if (!uid) { res.status(401).json({ success: false, error: "Unauthorized" }); return; }

    const songId = await ownedSongId(req.params.id, uid);
    if (!songId) { res.status(404).json({ success: false, error: "Song not found" }); return; }

    const [rows] = await pool.execute(
      `SELECT l.id, l.title, l.content, l.created_at, l.updated_at
         FROM lyrics l
         JOIN song_lyrics sl ON sl.lyrics_id = l.id
        WHERE sl.song_id = ?
        ORDER BY sl.added_at ASC`,
      [songId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// POST /songs/:id/lyrics — associate existing lyrics OR create new + associate
router.post("/", async (req, res, next) => {
  try {
    const uid = userId(req);
    if (!uid) { res.status(401).json({ success: false, error: "Unauthorized" }); return; }

    const songId = await ownedSongId(req.params.id, uid);
    if (!songId) { res.status(404).json({ success: false, error: "Song not found" }); return; }

    const { lyricsId, title, content } = req.body as {
      lyricsId?: string;
      title?: string;
      content?: string;
    };

    if (lyricsId) {
      // Associate existing lyrics object (must belong to same user).
      const [existing] = await pool.execute(
        "SELECT id FROM lyrics WHERE id = ? AND user_id = ?",
        [lyricsId, uid]
      );
      if ((existing as any[]).length === 0) {
        res.status(404).json({ success: false, error: "Lyrics not found" });
        return;
      }
      // INSERT IGNORE avoids error if already associated.
      await pool.execute(
        "INSERT IGNORE INTO song_lyrics (song_id, lyrics_id) VALUES (?, ?)",
        [songId, lyricsId]
      );
      res.json({ success: true, data: null });
    } else {
      // Create a new lyrics sheet and associate it.
      const newId = uuidv4();
      const safeTitle = (typeof title === "string" && title.trim()) ? title.trim() : "Untitled";
      const safeContent = typeof content === "string" ? content : "";

      await pool.execute(
        "INSERT INTO lyrics (id, user_id, title, content) VALUES (?, ?, ?, ?)",
        [newId, uid, safeTitle, safeContent]
      );
      await pool.execute(
        "INSERT INTO song_lyrics (song_id, lyrics_id) VALUES (?, ?)",
        [songId, newId]
      );

      const [rows] = await pool.execute(
        "SELECT id, title, content, created_at, updated_at FROM lyrics WHERE id = ?",
        [newId]
      );
      res.status(201).json({ success: true, data: (rows as any[])[0] });
    }
  } catch (err) {
    next(err);
  }
});

// DELETE /songs/:id/lyrics/:lyricsId — disassociate only (does NOT delete the lyrics object)
router.delete("/:lyricsId", async (req, res, next) => {
  try {
    const uid = userId(req);
    if (!uid) { res.status(401).json({ success: false, error: "Unauthorized" }); return; }

    const songId = await ownedSongId(req.params.id, uid);
    if (!songId) { res.status(404).json({ success: false, error: "Song not found" }); return; }

    await pool.execute(
      "DELETE FROM song_lyrics WHERE song_id = ? AND lyrics_id = ?",
      [songId, req.params.lyricsId]
    );
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

export default router;
