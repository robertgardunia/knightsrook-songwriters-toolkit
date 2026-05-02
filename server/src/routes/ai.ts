import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT =
  "You are a lyric-writing assistant. When asked for rhymes, return words that rhyme with the given word. When asked for synonyms, return words with similar meaning. Always respond with a JSON array of strings and nothing else. Limit results to 10 items.";

router.post("/assist", async (req, res, next) => {
  try {
    const { word, type } = req.body as { word?: string; type?: string };

    if (!word || typeof word !== "string" || !word.trim()) {
      res.status(400).json({ success: false, error: "word is required" });
      return;
    }
    if (type !== "rhymes" && type !== "synonyms") {
      res.status(400).json({
        success: false,
        error: "type must be 'rhymes' or 'synonyms'",
      });
      return;
    }

    const userMessage =
      type === "rhymes"
        ? `Give me rhymes for the word: "${word.trim()}"`
        : `Give me synonyms for the word: "${word.trim()}"`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userMessage }],
    });

    const raw =
      message.content[0].type === "text" ? message.content[0].text : "[]";

    let suggestions: string[];
    try {
      const parsed = JSON.parse(raw) as unknown;
      suggestions = Array.isArray(parsed)
        ? (parsed as unknown[])
            .filter((x): x is string => typeof x === "string")
            .slice(0, 10)
        : [];
    } catch {
      suggestions = [];
    }

    res.json({ success: true, data: suggestions });
  } catch (err) {
    next(err);
  }
});

export default router;
