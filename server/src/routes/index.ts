import { Router } from "express";
import express from "express";
import path from "path";
import { requireUser } from "../middleware/auth.js";
import songsRouter from "./songs.js";
import lyricsRouter from "./lyrics.js";
import audioRouter, { uploadDir } from "./audio.js";
import aiRouter from "./ai.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, data: "ok" });
});

// Serve uploaded audio files (auth not required for direct file access — URLs are unguessable UUIDs)
router.use("/audio/file", express.static(uploadDir));

router.use(requireUser);

router.use("/songs", songsRouter);
router.use("/songs/:id/lyrics", lyricsRouter);
router.use("/songs/:id/audio", audioRouter);
router.use("/ai", aiRouter);

export default router;
