import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../lib/db.js";

const router = Router({ mergeParams: true });

router.get("/", async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const { id: songId } = req.params;

    const [songs] = await pool.execute(
      "SELECT id FROM songs WHERE id = ? AND user_id = ?",
      [songId, userId]
    );
    if ((songs as unknown[]).length === 0) {
      res.status(404).json({ success: false, error: "Song not found" });
      return;
    }

    const [rows] = await pool.execute(
      "SELECT content, updated_at FROM lyrics WHERE song_id = ?",
      [songId]
    );
    const lyrics = (rows as { content: string; updated_at: string }[])[0] ?? {
      content: "",
    };
    res.json({ success: true, data: lyrics });
  } catch (err) {
    next(err);
  }
});

router.put("/", async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const { id: songId } = req.params;
    const { content } = req.body as { content?: string };

    if (typeof content !== "string") {
      res.status(400).json({ success: false, error: "content must be a string" });
      return;
    }

    const [songs] = await pool.execute(
      "SELECT id FROM songs WHERE id = ? AND user_id = ?",
      [songId, userId]
    );
    if ((songs as unknown[]).length === 0) {
      res.status(404).json({ success: false, error: "Song not found" });
      return;
    }

    const [existing] = await pool.execute(
      "SELECT id FROM lyrics WHERE song_id = ?",
      [songId]
    );

    if ((existing as unknown[]).length > 0) {
      await pool.execute(
        "UPDATE lyrics SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE song_id = ?",
        [content, songId]
      );
    } else {
      await pool.execute(
        "INSERT INTO lyrics (id, song_id, content) VALUES (?, ?, ?)",
        [uuidv4(), songId, content]
      );
    }

    res.json({ success: true, data: { content } });
  } catch (err) {
    next(err);
  }
});

export default router;
