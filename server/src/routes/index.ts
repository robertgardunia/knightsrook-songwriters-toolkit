import { Router } from "express";
import { requireUser } from "../middleware/auth.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, data: "ok" });
});

// All routes below require authentication
router.use(requireUser);

// TODO: songs routes
// TODO: lyrics routes
// TODO: ai routes (rhymes, synonyms)

export default router;
