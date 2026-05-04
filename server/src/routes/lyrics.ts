import { Router } from "express";
import { getAuth } from "@clerk/express";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../lib/db.js";

const router = Router();

function userId(req: Parameters<typeof getAuth>[0]) {
  return getAuth(req).userId ?? null;
}

// GET /lyrics — list all lyrics for the authenticated user
router.get("/", async (req, res, next) => {
  try {
    const uid = userId(req);
    if (!uid) { res.status(401).json({ success: false, error: "Unauthorized" }); return; }

    const [rows] = await pool.execute(
      "SELECT id, title, updated_at FROM lyrics WHERE user_id = ? ORDER BY updated_at DESC",
      [uid]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// POST /lyrics — create a new standalone lyrics sheet
router.post("/", async (req, res, next) => {
  try {
    const uid = userId(req);
    if (!uid) { res.status(401).json({ success: false, error: "Unauthorized" }); return; }

    const { title, content } = req.body as { title?: string; content?: string };
    const id = uuidv4();
    const safeTitle = (typeof title === "string" && title.trim()) ? title.trim() : "Untitled";
    const safeContent = typeof content === "string" ? content : "";

    await pool.execute(
      "INSERT INTO lyrics (id, user_id, title, content) VALUES (?, ?, ?, ?)",
      [id, uid, safeTitle, safeContent]
    );

    const [rows] = await pool.execute(
      "SELECT id, title, content, created_at, updated_at FROM lyrics WHERE id = ?",
      [id]
    );
    res.status(201).json({ success: true, data: (rows as any[])[0] });
  } catch (err) {
    next(err);
  }
});

// GET /lyrics/:id — get one lyrics sheet
router.get("/:id", async (req, res, next) => {
  try {
    const uid = userId(req);
    if (!uid) { res.status(401).json({ success: false, error: "Unauthorized" }); return; }

    const [rows] = await pool.execute(
      "SELECT id, title, content, created_at, updated_at FROM lyrics WHERE id = ? AND user_id = ?",
      [req.params.id, uid]
    );
    if ((rows as any[]).length === 0) {
      res.status(404).json({ success: false, error: "Lyrics not found" });
      return;
    }
    res.json({ success: true, data: (rows as any[])[0] });
  } catch (err) {
    next(err);
  }
});

// PUT /lyrics/:id — update title and/or content
router.put("/:id", async (req, res, next) => {
  try {
    const uid = userId(req);
    if (!uid) { res.status(401).json({ success: false, error: "Unauthorized" }); return; }

    const { title, content } = req.body as { title?: string; content?: string };

    if (title === undefined && content === undefined) {
      res.status(400).json({ success: false, error: "Provide title and/or content" });
      return;
    }

    // Build dynamic SET clause only for provided fields.
    const setClauses: string[] = ["updated_at = CURRENT_TIMESTAMP"];
    const params: unknown[] = [];
    if (typeof title === "string") { setClauses.push("title = ?"); params.push(title.trim() || "Untitled"); }
    if (typeof content === "string") { setClauses.push("content = ?"); params.push(content); }
    params.push(req.params.id, uid);

    const [result] = await pool.execute(
      `UPDATE lyrics SET ${setClauses.join(", ")} WHERE id = ? AND user_id = ?`,
      params
    );
    if ((result as any).affectedRows === 0) {
      res.status(404).json({ success: false, error: "Lyrics not found" });
      return;
    }

    const [rows] = await pool.execute(
      "SELECT id, title, content, created_at, updated_at FROM lyrics WHERE id = ?",
      [req.params.id]
    );
    res.json({ success: true, data: (rows as any[])[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /lyrics/:id — delete lyrics object (song_lyrics cascade handles join rows)
router.delete("/:id", async (req, res, next) => {
  try {
    const uid = userId(req);
    if (!uid) { res.status(401).json({ success: false, error: "Unauthorized" }); return; }

    const [result] = await pool.execute(
      "DELETE FROM lyrics WHERE id = ? AND user_id = ?",
      [req.params.id, uid]
    );
    if ((result as any).affectedRows === 0) {
      res.status(404).json({ success: false, error: "Lyrics not found" });
      return;
    }
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

export default router;
