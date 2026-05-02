import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../lib/db.js";
import type { AuthObject } from "@clerk/express";

declare global {
  namespace Express {
    interface Request {
      auth: AuthObject;
    }
  }
}

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const [rows] = await pool.execute(
      "SELECT id, title, created_at, updated_at FROM songs WHERE user_id = ? ORDER BY updated_at DESC",
      [userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const { title } = req.body as { title?: string };
    if (!title || typeof title !== "string" || !title.trim()) {
      res.status(400).json({ success: false, error: "title is required" });
      return;
    }
    const id = uuidv4();
    await pool.execute(
      "INSERT INTO songs (id, user_id, title) VALUES (?, ?, ?)",
      [id, userId, title.trim()]
    );
    res.status(201).json({ success: true, data: { id, title: title.trim() } });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;
    const [result] = await pool.execute(
      "DELETE FROM songs WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    const affected = (result as { affectedRows: number }).affectedRows;
    if (affected === 0) {
      res.status(404).json({ success: false, error: "Song not found" });
      return;
    }
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

export default router;
