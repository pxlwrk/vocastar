import type { DifficultyConfig } from "./levels";
import { levenshtein, shuffle } from "./text";
import type { Direction, Word } from "./types";

export interface Question {
  word: Word;
  prompt: string;
  solution: string;
  /** true, wenn die Frage in der Fremdsprache gestellt wird */
  promptIsForeign: boolean;
  options: string[];
}

export function resolveDirection(d: Direction): Exclude<Direction, "mixed"> {
  if (d !== "mixed") return d;
  return Math.random() < 0.5 ? "de-foreign" : "foreign-de";
}

function pickDistractors(word: Word, pool: Word[], side: "de" | "foreign", n: number, similar: boolean): string[] {
  const target = word[side].toLowerCase();
  const candidates = pool.filter((w) => w.id !== word.id && w[side].toLowerCase() !== target);
  let ordered: Word[];
  if (similar) {
    ordered = [...candidates].sort((a, b) => {
      const da = levenshtein(a[side].toLowerCase(), target) - (a[side][0]?.toLowerCase() === target[0] ? 2 : 0);
      const dbb = levenshtein(b[side].toLowerCase(), target) - (b[side][0]?.toLowerCase() === target[0] ? 2 : 0);
      return da - dbb + (Math.random() - 0.5);
    });
  } else {
    ordered = shuffle(candidates);
  }
  const out: string[] = [];
  for (const w of ordered) {
    if (!out.some((o) => o.toLowerCase() === w[side].toLowerCase())) out.push(w[side]);
    if (out.length >= n) break;
  }
  return out;
}

export function buildQuestion(word: Word, pool: Word[], cfg: DifficultyConfig, direction: Direction): Question {
  const dir = resolveDirection(direction);
  const promptIsForeign = dir === "foreign-de";
  const solutionSide = promptIsForeign ? "de" : "foreign";
  const nOptions = Math.min(cfg.options, pool.length);
  const distractors = pickDistractors(word, pool, solutionSide, nOptions - 1, cfg.id === "schwer");
  return {
    word,
    prompt: promptIsForeign ? word.foreign : word.de,
    solution: word[solutionSide],
    promptIsForeign,
    options: shuffle([word[solutionSide], ...distractors]),
  };
}

export function buildQuestions(round: Word[], pool: Word[], cfg: DifficultyConfig, direction: Direction): Question[] {
  return round.map((w) => buildQuestion(w, pool, cfg, direction));
}

/** Buchstaben-Kacheln für den Buchstabensalat. Leerzeichen bleiben feste Lücken. */
export function letterTiles(solution: string, decoys: number): { id: number; ch: string }[] {
  const letters = [...solution].filter((c) => c !== " ");
  const alphabet = "abcdefghijklmnoprstuvw";
  const extra = Array.from({ length: decoys }, () => alphabet[Math.floor(Math.random() * alphabet.length)]);
  return shuffle([...letters, ...extra]).map((ch, id) => ({ id, ch }));
}
