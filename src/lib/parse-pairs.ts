import type { WordPair } from "./types";

const SEPARATORS = [/\t+/, /\s{3,}/, /\s+[-–—=:]\s+/, /\s*[=:]\s*/, /\s+[-–—]\s*/, /\s{2,}/];

/** Zerlegt eine Zeile wie "the dog - der Hund" in ein Paar. */
export function splitLine(line: string): [string, string] | null {
  const clean = line.replace(/^\s*(\d+[.)]|[•*·-])\s*/, "").trim();
  if (!clean) return null;
  for (const sep of SEPARATORS) {
    const parts = clean.split(sep).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return [parts[0], parts.slice(1).join(" ")];
    }
  }
  return null;
}

/**
 * Liest Textblöcke (z. B. aus OCR oder Copy & Paste) als Vokabelpaare.
 * Erwartet "Fremdsprache  Deutsch" pro Zeile, außer foreignFirst ist false.
 */
export function parsePairs(text: string, foreignFirst = true): WordPair[] {
  const pairs: WordPair[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const s = splitLine(raw);
    if (!s) continue;
    const [a, b] = s;
    if (a.length > 60 || b.length > 80) continue;
    if (!/\p{L}/u.test(a) || !/\p{L}/u.test(b)) continue;
    pairs.push(foreignFirst ? { foreign: a, de: b } : { de: a, foreign: b });
  }
  return pairs;
}
