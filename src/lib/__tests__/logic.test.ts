import { describe, expect, it } from "vitest";
import { generateCode, isValidCode, normalizeCode } from "../codes";
import { comboBonus, levelFromXp, starsForAccuracy, updateStreak, visibleStreak } from "../gamification";
import { buildQuestion, letterTiles } from "../game-engine";
import { applyAnswer, emptyProgress, pickForRound } from "../leitner";
import { DIFFICULTIES } from "../levels";
import { parsePairs, splitLine } from "../parse-pairs";
import { migrateProfile, SHOP_ITEMS, toggleEquipChanges } from "../shop";
import { checkAnswer, levenshtein } from "../text";
import type { Word } from "../types";

const words: Word[] = [
  ["the dog", "der Hund"],
  ["the cat", "die Katze"],
  ["the house", "das Haus"],
  ["to run", "rennen, laufen"],
  ["big", "groß"],
  ["small", "klein"],
].map(([foreign, de], i) => ({ id: `w${i}`, listId: "l", foreign, de, order: i }));

describe("checkAnswer", () => {
  const leicht = DIFFICULTIES.leicht;
  const mittel = DIFFICULTIES.mittel;
  const schwer = DIFFICULTIES.schwer;

  it("akzeptiert exakte Antworten unabhängig von Groß/Klein", () => {
    expect(checkAnswer("Der Hund", "der Hund", schwer)).toBe("correct");
  });
  it("akzeptiert Antworten ohne Artikel bzw. ohne 'to'", () => {
    expect(checkAnswer("Hund", "der Hund", mittel)).toBe("correct");
    expect(checkAnswer("run", "to run", mittel)).toBe("correct");
  });
  it("akzeptiert eine von mehreren Bedeutungen", () => {
    expect(checkAnswer("laufen", "rennen, laufen", schwer)).toBe("correct");
  });
  it("Tippfehler-Toleranz je Schwierigkeit", () => {
    expect(checkAnswer("elefant", "elephant", leicht)).toBe("almost"); // 2 Fehler
    expect(checkAnswer("elefant", "elephant", mittel)).toBe("wrong");
    expect(checkAnswer("elephnt", "elephant", mittel)).toBe("almost");
    expect(checkAnswer("elephnt", "elephant", schwer)).toBe("wrong");
  });
  it("kurze Wörter bekommen höchstens einen Fehler Toleranz", () => {
    expect(checkAnswer("bg", "big", leicht)).toBe("almost");
    expect(checkAnswer("b", "big", leicht)).toBe("wrong");
  });
  it("Akzente zählen nur auf Schwer", () => {
    expect(checkAnswer("ecole", "école", mittel)).toBe("correct");
    expect(checkAnswer("ecole", "école", schwer)).toBe("wrong");
    expect(checkAnswer("gross", "groß", mittel)).toBe("correct");
  });
  it("leere Eingabe ist falsch", () => {
    expect(checkAnswer("  ", "dog", leicht)).toBe("wrong");
  });
  it("levenshtein", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
  });
});

describe("Leitner", () => {
  it("steigt bei richtig auf und fällt bei falsch auf Box 1", () => {
    let p = emptyProgress("p", "w");
    p = applyAnswer(p, true, 0);
    p = applyAnswer(p, true, 0);
    expect(p.box).toBe(3);
    p = applyAnswer(p, false, 0);
    expect(p.box).toBe(1);
    expect(p.correct).toBe(2);
    expect(p.wrong).toBe(1);
  });
  it("Box ist auf 5 begrenzt", () => {
    let p = emptyProgress("p", "w");
    for (let i = 0; i < 10; i++) p = applyAnswer(p, true, 0);
    expect(p.box).toBe(5);
  });
  it("wählt fällige, schwache Wörter vor gut gelernten", () => {
    const now = 1_000_000_000;
    const prog = new Map(
      words.map((w, i) => [w.id, { ...emptyProgress("p", w.id), box: i < 3 ? 5 : 1, lastSeen: 1, nextDue: i < 3 ? now + 1e9 : now - 1 }]),
    );
    const round = pickForRound(words, prog, 3, now);
    expect(round.map((w) => w.id).sort()).toEqual(["w3", "w4", "w5"]);
  });
});

describe("Spiel-Logik", () => {
  it("Anzahl Antwortoptionen folgt der Schwierigkeit", () => {
    expect(buildQuestion(words[0], words, DIFFICULTIES.leicht, "foreign-de").options).toHaveLength(3);
    expect(buildQuestion(words[0], words, DIFFICULTIES.mittel, "foreign-de").options).toHaveLength(4);
    expect(buildQuestion(words[0], words, DIFFICULTIES.schwer, "foreign-de").options).toHaveLength(5);
  });
  it("Optionen enthalten die Lösung genau einmal", () => {
    const q = buildQuestion(words[1], words, DIFFICULTIES.mittel, "de-foreign");
    expect(q.prompt).toBe("die Katze");
    expect(q.options.filter((o) => o === "the cat")).toHaveLength(1);
  });
  it("kleine Listen begrenzen die Optionen", () => {
    expect(buildQuestion(words[0], words.slice(0, 2), DIFFICULTIES.schwer, "foreign-de").options).toHaveLength(2);
  });
  it("Buchstabensalat enthält alle Buchstaben ohne Leerzeichen", () => {
    const tiles = letterTiles("the dog", 0);
    expect(tiles.map((t) => t.ch).sort().join("")).toBe("degho t".replace(" ", "").split("").sort().join(""));
    expect(letterTiles("dog", 2)).toHaveLength(5);
  });
  it("Schwierigkeitsstufen haben steigende XP-Multiplikatoren", () => {
    expect(DIFFICULTIES.leicht.xpMultiplier).toBeLessThan(DIFFICULTIES.mittel.xpMultiplier);
    expect(DIFFICULTIES.mittel.xpMultiplier).toBeLessThan(DIFFICULTIES.schwer.xpMultiplier);
    expect(DIFFICULTIES.leicht.typoTolerance).toBeGreaterThan(DIFFICULTIES.schwer.typoTolerance);
  });
});

describe("Gamification", () => {
  it("Level-Kurve: Aufwand je Level wächst proportional zum Level", () => {
    expect(levelFromXp(0)).toEqual({ level: 1, current: 0, needed: 250 });
    expect(levelFromXp(249).level).toBe(1);
    expect(levelFromXp(250)).toEqual({ level: 2, current: 0, needed: 500 });
    expect(levelFromXp(749).level).toBe(2);
    expect(levelFromXp(750).level).toBe(3);
    // bis Level n insgesamt 250 * n * (n - 1) / 2 XP
    for (const n of [5, 10, 20]) {
      const total = (250 * n * (n - 1)) / 2;
      expect(levelFromXp(total).level).toBe(n);
      expect(levelFromXp(total - 1).level).toBe(n - 1);
      expect(levelFromXp(total).needed).toBe(250 * n);
    }
  });
  it("Sterne und Combo", () => {
    expect(starsForAccuracy(1)).toBe(3);
    expect(starsForAccuracy(0.75)).toBe(2);
    expect(starsForAccuracy(0.1)).toBe(1);
    expect(starsForAccuracy(0)).toBe(0);
    expect(comboBonus(2)).toBe(0);
    expect(comboBonus(10)).toBe(5);
  });
  it("Serie zählt Tage in Folge und verfällt nach Pause", () => {
    const base = { streak: 0, bestStreak: 0, todayCount: 0, lastPlayedDate: undefined, todayDate: undefined };
    const d1 = updateStreak(base, 5, "2026-11-01");
    expect(d1.streak).toBe(1);
    const d1b = updateStreak({ ...base, ...d1 }, 5, "2026-11-01");
    expect(d1b.streak).toBe(1);
    expect(d1b.todayCount).toBe(10);
    const d2 = updateStreak({ ...base, ...d1b }, 3, "2026-11-02");
    expect(d2.streak).toBe(2);
    expect(d2.todayCount).toBe(3);
    const d5 = updateStreak({ ...base, ...d2 }, 3, "2026-11-05");
    expect(d5.streak).toBe(1);
    expect(d5.bestStreak).toBe(2);
    expect(visibleStreak({ streak: 4, lastPlayedDate: "2026-11-01" }, "2026-11-02")).toBe(4);
    expect(visibleStreak({ streak: 4, lastPlayedDate: "2026-11-01" }, "2026-11-03")).toBe(0);
  });
});

describe("Paare aus Text", () => {
  it("erkennt typische Trennzeichen", () => {
    expect(splitLine("the dog - der Hund")).toEqual(["the dog", "der Hund"]);
    expect(splitLine("la maison\tdas Haus")).toEqual(["la maison", "das Haus"]);
    expect(splitLine("to run     rennen, laufen")).toEqual(["to run", "rennen, laufen"]);
    expect(splitLine("big = groß")).toEqual(["big", "groß"]);
    expect(splitLine("1. small: klein")).toEqual(["small", "klein"]);
  });
  it("ignoriert Zeilen ohne Paar", () => {
    const pairs = parsePairs("Unit 3\n\nthe dog - der Hund\n42\nthe cat – die Katze");
    expect(pairs).toEqual([
      { foreign: "the dog", de: "der Hund" },
      { foreign: "the cat", de: "die Katze" },
    ]);
  });
});

describe("Codes", () => {
  it("erzeugt gültige, normalisierbare Codes", () => {
    for (let i = 0; i < 50; i++) {
      const c = generateCode();
      expect(isValidCode(c)).toBe(true);
      expect(normalizeCode(c.toLowerCase().replace("-", " "))).toBe(c);
    }
    expect(normalizeCode("löwe 123")).toBe("LOEWE-123");
    expect(isValidCode("x")).toBe(false);
  });
});

describe("Schatzladen", () => {
  const base = {
    id: "p",
    name: "Mia",
    avatar: "🦊",
    color: "#000",
    grade: 5 as const,
    difficulty: "mittel" as const,
    xp: 0,
    stars: 3,
    streak: 0,
    bestStreak: 0,
    todayCount: 0,
    dailyGoal: 20,
    settings: { autoSpeak: false, sound: true, speechRate: "normal" as const },
    createdAt: 0,
    updatedAt: 0,
  };

  it("überträgt alte Käufe und erstattet nicht übertragbare", () => {
    const old = { ...base, unlockedItems: ["cap", "glasses", "rocket", "unicorn"], equippedItem: "glasses" };
    const p = migrateProfile(old);
    expect(p.unlockedItems.sort()).toEqual(["cap", "sunglasses"]);
    expect(p.stars).toBe(3 + 60 + 80);
    expect(p.outfit).toEqual({ eyes: "sunglasses" });
    expect("equippedItem" in p).toBe(false);
  });

  it("lässt neue Profile unverändert", () => {
    const p = { ...base, unlockedItems: ["cap"], outfit: { head: "cap" } };
    expect(migrateProfile(p)).toBe(p);
  });

  it("Anziehen ersetzt nur den passenden Platz", () => {
    const p = { ...base, unlockedItems: [], outfit: { head: "cap", eyes: "glasses" } };
    const crown = SHOP_ITEMS.find((i) => i.id === "crown")!;
    expect(toggleEquipChanges(p, crown, "🦊")).toEqual({ outfit: { head: "crown", eyes: "glasses" } });
    const glasses = SHOP_ITEMS.find((i) => i.id === "glasses")!;
    expect(toggleEquipChanges(p, glasses, "🦊")).toEqual({ outfit: { head: "cap", eyes: undefined } });
  });

  it("teurere Schätze brauchen höhere Level", () => {
    for (const cat of ["voki", "rahmen", "tiere"] as const) {
      const items = SHOP_ITEMS.filter((i) => i.category === cat);
      for (let i = 1; i < items.length; i++) {
        expect(items[i].price).toBeGreaterThanOrEqual(items[i - 1].price);
        expect(items[i].minLevel ?? 1).toBeGreaterThanOrEqual(items[i - 1].minLevel ?? 1);
      }
    }
  });
});
