import type { GameMode } from "./types";

export interface ModeInfo {
  id: GameMode;
  title: string;
  emoji: string;
  description: string;
  color: string;
  minWords: number;
}

export const MODES: ModeInfo[] = [
  { id: "karten", title: "Karteikarten", emoji: "🃏", description: "Umdrehen und merken", color: "#8b5cf6", minWords: 1 },
  { id: "quiz", title: "Quiz", emoji: "❓", description: "Richtige Antwort antippen", color: "#3b82f6", minWords: 2 },
  { id: "memory", title: "Memory", emoji: "🧩", description: "Paare finden", color: "#10b981", minWords: 2 },
  { id: "salat", title: "Buchstabensalat", emoji: "🔤", description: "Wort zusammenbauen", color: "#f59e0b", minWords: 1 },
  { id: "schreiben", title: "Schreiben", emoji: "✏️", description: "Selbst eintippen", color: "#ec4899", minWords: 1 },
  { id: "hoeren", title: "Hör-Quiz", emoji: "👂", description: "Zuhören und wählen", color: "#06b6d4", minWords: 2 },
  { id: "blitz", title: "Blitzrunde", emoji: "⚡", description: "Schnell auf Zeit", color: "#ef4444", minWords: 3 },
];

export function getMode(id: string): ModeInfo | undefined {
  return MODES.find((m) => m.id === id);
}
