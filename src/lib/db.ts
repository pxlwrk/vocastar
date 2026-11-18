import Dexie, { type EntityTable } from "dexie";
import type {
  Achievement,
  GameSession,
  Profile,
  Progress,
  VocabList,
  Word,
} from "./types";

export class VocaDB extends Dexie {
  profiles!: EntityTable<Profile, "id">;
  lists!: EntityTable<VocabList, "id">;
  words!: EntityTable<Word, "id">;
  progress!: Dexie.Table<Progress, [string, string]>;
  achievements!: Dexie.Table<Achievement, [string, string]>;
  sessions!: EntityTable<GameSession, "id">;

  constructor() {
    super("vocastar");
    this.version(1).stores({
      profiles: "id, name",
      lists: "id, profileId, grade, updatedAt",
      words: "id, listId",
      progress: "[profileId+wordId], profileId, wordId, nextDue",
      achievements: "[profileId+key], profileId",
      sessions: "id, profileId, date",
    });
  }
}

export const db = new VocaDB();

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
