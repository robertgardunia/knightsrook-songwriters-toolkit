import { Router } from "express";
import { getAuth } from "@clerk/express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../lib/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } });

function uid(req: Parameters<typeof getAuth>[0]) {
  return getAuth(req).userId ?? null;
}

const router = Router({ mergeParams: true });

/* GET /api/songs/:id/audio — list tracks for a song */
router.get("/", async (req, res, next) => {
  try {
    const userId = uid(req);
    if (!userId) { res.status(401).json({ success: false, error: "Unauthorized" }); return; }
    const { id: songId } = req.params;
    const [rows] = await pool.execute(
      `SELECT af.id, af.filename, af.original_name, af.mime_type, af.duration_ms, af.size_bytes, af.created_at
       FROM audio_files af
       JOIN song_audio sa ON sa.audio_file_id = af.id
       WHERE sa.song_id = ? AND af.user_id = ?
       ORDER BY af.created_at ASC`,
      [songId, userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

/* POST /api/songs/:id/audio — upload + link a new track */
router.post("/", upload.single("audio"), async (req, res, next) => {
  try {
    const userId = uid(req);
    if (!userId) { res.status(401).json({ success: false, error: "Unauthorized" }); return; }
    if (!req.file) { res.status(400).json({ success: false, error: "No file uploaded" }); return; }
    const { id: songId } = req.params;
    const { originalname, filename, mimetype, size } = req.file;
    const fileId = uuidv4();

    await pool.execute(
      "INSERT INTO audio_files (id, user_id, filename, original_name, mime_type, duration_ms, size_bytes) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [fileId, userId, filename, originalname, mimetype, null, size]
    );
    await pool.execute(
      "INSERT INTO song_audio (song_id, audio_file_id) VALUES (?, ?)",
      [songId, fileId]
    );

    res.status(201).json({ success: true, data: { id: fileId, filename, original_name: originalname, mime_type: mimetype, size_bytes: size, duration_ms: null } });
  } catch (err) { next(err); }
});

/* DELETE /api/songs/:id/audio/:fileId — unlink + delete file */
router.delete("/:fileId", async (req, res, next) => {
  try {
    const userId = uid(req);
    if (!userId) { res.status(401).json({ success: false, error: "Unauthorized" }); return; }
    const { id: songId, fileId } = req.params;

    const [rows] = await pool.execute(
      "SELECT af.filename FROM audio_files af WHERE af.id = ? AND af.user_id = ?",
      [fileId, userId]
    );
    if ((rows as unknown[]).length === 0) { res.status(404).json({ success: false, error: "Not found" }); return; }
    const { filename } = (rows as { filename: string }[])[0];

    await pool.execute("DELETE FROM song_audio WHERE song_id = ? AND audio_file_id = ?", [songId, fileId]);
    // Only delete the file itself if no other songs reference it
    const [refs] = await pool.execute("SELECT 1 FROM song_audio WHERE audio_file_id = ?", [fileId]);
    if ((refs as unknown[]).length === 0) {
      await pool.execute("DELETE FROM audio_files WHERE id = ?", [fileId]);
      const filePath = path.join(uploadDir, filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

export { uploadDir };
export default router;
