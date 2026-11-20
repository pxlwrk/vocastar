export type Grade = 5 | 7;
export type Difficulty = "leicht" | "mittel" | "schwer";
export type Direction = "de-foreign" | "foreign-de" | "mixed";

export interface ProfileSettings {
  autoSpeak: boolean;
  sound: boolean;
  speechRate: "slow" | "normal";
  voice?: "female" | "male" | "auto";
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  color: string;
  grade: Grade;
  difficulty: Difficulty;
  xp: number;
  stars: number;
  streak: number;
  bestStreak: number;
  lastPlayedDate?: string;
  todayDate?: string;
  todayCount: number;
  dailyGoal: number;
  unlockedItems: string[];
  equippedItem?: string;
  settings: ProfileSettings;
  createdAt: number;
  updatedAt: number;
}

export interface VocabList {
  id: string;
  profileId: string;
  title: string;
  targetLang: string;
  grade: Grade;
  emoji: string;
  createdAt: number;
  updatedAt: number;
}

export interface Word {
  id: string;
  listId: string;
  de: string;
  foreign: string;
  hint?: string;
  order: number;
}

export interface Progress {
  profileId: string;
  wordId: string;
  box: number;
  correct: number;
  wrong: number;
  nextDue: number;
  lastSeen: number;
}

export interface Achievement {
  profileId: string;
  key: string;
  unlockedAt: number;
}

export type GameMode =
  | "karten"
  | "quiz"
  | "memory"
  | "salat"
  | "schreiben"
  | "hoeren"
  | "blitz";

export interface GameSession {
  id: string;
  profileId: string;
  listId: string;
  mode: GameMode;
  difficulty: Difficulty;
  correct: number;
  total: number;
  xp: number;
  stars: number;
  durationMs: number;
  date: number;
}

export interface WordPair {
  de: string;
  foreign: string;
  hint?: string;
}
