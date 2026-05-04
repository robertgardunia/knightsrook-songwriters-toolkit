export type LyricsLine  = { id: string; text: string };
export type LyricsBlock = { id: string; label: string; lines: LyricsLine[] };
export type LyricsContent = { version: 1; blocks: LyricsBlock[] };

function uid() { return crypto.randomUUID(); }

export const newLine  = (text = ''): LyricsLine  => ({ id: uid(), text });
export const newBlock = (label = 'Section'): LyricsBlock => ({ id: uid(), label, lines: [newLine()] });
export const emptyContent = (): LyricsContent => ({ version: 1, blocks: [newBlock('Verse 1')] });

export function parseLyricsContent(raw: string | null | undefined): LyricsContent {
  if (!raw?.trim()) return emptyContent();
  try {
    const p = JSON.parse(raw);
    if (p.version === 1 && Array.isArray(p.blocks)) return p as LyricsContent;
  } catch {}
  // Legacy HTML / plain text → convert
  const text = raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  if (!paragraphs.length) return emptyContent();
  return {
    version: 1,
    blocks: paragraphs.map((p, i) => ({
      id: uid(),
      label: `Section ${i + 1}`,
      lines: p.split('\n').map(t => t.trim()).filter(Boolean).map(t => newLine(t)),
    })),
  };
}

export const serializeLyricsContent = (c: LyricsContent): string => JSON.stringify(c);
