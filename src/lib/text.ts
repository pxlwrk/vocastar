/** Hilfsfunktionen zum Vergleichen von Antworten. */

export function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function normalize(s: string, ignoreAccents: boolean): string {
  let r = s
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[.,!?;:"'„“”‚‘’«»¡¿]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (ignoreAccents) r = stripAccents(r).replace(/ß/g, "ss");
  return r;
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Alternativen wie "groß, riesig" oder "big / large" werden einzeln akzeptiert. */
export function variants(solution: string): string[] {
  const parts = solution
    .split(/[,;/]|\bor\b|\boder\b/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length ? [solution, ...parts] : [solution];
}

/** Englische Artikel/„to“ dürfen fehlen. */
function withoutLeading(s: string): string {
  return s.replace(/^(to|the|a|an|der|die|das|le|la|les|l'|el|los|las)\s+/, "");
}

export type AnswerResult = "correct" | "almost" | "wrong";

export function checkAnswer(
  input: string,
  solution: string,
  opts: { typoTolerance: number; ignoreAccents: boolean },
): AnswerResult {
  const given = normalize(input, opts.ignoreAccents);
  if (!given) return "wrong";
  let best = Infinity;
  for (const v of variants(solution)) {
    const target = normalize(v, opts.ignoreAccents);
    if (!target) continue;
    for (const [g, t] of [
      [given, target],
      [withoutLeading(given), withoutLeading(target)],
    ]) {
      if (g === t) return "correct";
      best = Math.min(best, levenshtein(g, t));
    }
  }
  // kurze Wörter: maximal 1 Fehler, sonst verwässert die Toleranz zu stark
  const shortest = Math.min(...variants(solution).map((v) => v.length));
  const tolerance = shortest <= 3 ? Math.min(opts.typoTolerance, 1) : opts.typoTolerance;
  if (best <= tolerance) return "almost";
  return "wrong";
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
