import { Router } from "express";
import { requireUser } from "../middleware/auth.js";
import songsRouter from "./songs.js";
import lyricsRouter from "./lyrics.js";
import aiRouter from "./ai.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, data: "ok" });
});

router.use(requireUser);

router.use("/songs", songsRouter);
router.use("/songs/:id/lyrics", lyricsRouter);
router.use("/ai", aiRouter);

export default router;
