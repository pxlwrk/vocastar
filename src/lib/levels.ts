import type { Difficulty, Direction, Grade } from "./types";

/** Klassenstufen, die aktuell angeboten werden. Einfach erweiterbar. */
export const GRADES: Grade[] = [5, 7];

export interface DifficultyConfig {
  id: Difficulty;
  label: string;
  emoji: string;
  description: string;
  options: number;
  typoTolerance: number;
  ignoreAccents: boolean;
  memoryPairs: number;
  blitzSeconds: number;
  direction: Direction;
  letterHints: boolean;
  autoSpeak: boolean;
  xpMultiplier: number;
  roundSize: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  leicht: {
    id: "leicht",
    label: "Leicht",
    emoji: "🐣",
    description: "3 Antworten, kleine Tippfehler sind okay",
    options: 3,
    typoTolerance: 2,
    ignoreAccents: true,
    memoryPairs: 4,
    blitzSeconds: 90,
    direction: "foreign-de",
    letterHints: true,
    autoSpeak: true,
    xpMultiplier: 1,
    roundSize: 8,
  },
  mittel: {
    id: "mittel",
    label: "Mittel",
    emoji: "🦊",
    description: "4 Antworten, ein Tippfehler ist okay",
    options: 4,
    typoTolerance: 1,
    ignoreAccents: true,
    memoryPairs: 6,
    blitzSeconds: 60,
    direction: "de-foreign",
    letterHints: false,
    autoSpeak: false,
    xpMultiplier: 1.5,
    roundSize: 10,
  },
  schwer: {
    id: "schwer",
    label: "Schwer",
    emoji: "🦁",
    description: "5 Antworten, genaue Schreibweise, beide Richtungen",
    options: 5,
    typoTolerance: 0,
    ignoreAccents: false,
    memoryPairs: 8,
    blitzSeconds: 45,
    direction: "mixed",
    letterHints: false,
    autoSpeak: false,
    xpMultiplier: 2,
    roundSize: 12,
  },
};

export const DIFFICULTY_ORDER: Difficulty[] = ["leicht", "mittel", "schwer"];

export function getDifficulty(d: Difficulty | undefined): DifficultyConfig {
  return DIFFICULTIES[d ?? "mittel"] ?? DIFFICULTIES.mittel;
}
