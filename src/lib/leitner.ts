import type { Progress } from "./types";

export const BOXES = 5;
const DAY = 24 * 60 * 60 * 1000;
/** Wartezeit bis zur nächsten Wiederholung je Box (Box 1 sofort). */
export const BOX_INTERVALS = [0, 0, 1 * DAY, 3 * DAY, 7 * DAY, 14 * DAY];

export function emptyProgress(profileId: string, wordId: string): Progress {
  return { profileId, wordId, box: 1, correct: 0, wrong: 0, nextDue: 0, lastSeen: 0 };
}

export function applyAnswer(p: Progress, correct: boolean, now = Date.now()): Progress {
  const box = correct ? Math.min(BOXES, p.box + 1) : 1;
  return {
    ...p,
    box,
    correct: p.correct + (correct ? 1 : 0),
    wrong: p.wrong + (correct ? 0 : 1),
    lastSeen: now,
    nextDue: now + BOX_INTERVALS[box],
  };
}

export function isMastered(p: Progress | undefined): boolean {
  return !!p && p.box >= 4;
}

/**
 * Wählt Wörter für eine Runde: fällige und schwache Wörter zuerst,
 * danach neue, dann zufällig aufgefüllt.
 */
export function pickForRound<T extends { id: string }>(
  words: T[],
  progress: Map<string, Progress>,
  size: number,
  now = Date.now(),
): T[] {
  const scored = words.map((w) => {
    const p = progress.get(w.id);
    let score: number;
    if (!p || p.lastSeen === 0) score = 50; // neu
    else if (p.nextDue <= now) score = 100 - p.box * 10; // fällig, schwache Box zuerst
    else score = 10 - p.box;
    return { w, score: score + Math.random() * 15 };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, Math.min(size, words.length)).map((s) => s.w);
}
