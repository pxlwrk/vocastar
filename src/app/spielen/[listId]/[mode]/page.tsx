"use client";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import Blitz from "@/components/games/Blitz";
import Flashcards from "@/components/games/Flashcards";
import Listen from "@/components/games/Listen";
import Memory from "@/components/games/Memory";
import Quiz from "@/components/games/Quiz";
import Scramble from "@/components/games/Scramble";
import { type GameProps, useTracker } from "@/components/games/shared";
import Typing from "@/components/games/Typing";
import { ResultScreen } from "@/components/ResultScreen";
import { Page } from "@/components/ui";
import { useProfile } from "@/hooks/useProfile";
import { db } from "@/lib/db";
import { pickForRound } from "@/lib/leitner";
import { getDifficulty } from "@/lib/levels";
import { getMode } from "@/lib/modes";
import { progressMap, recordRound, type RoundResult } from "@/lib/repo";
import type { Direction, GameMode, VocabList, Word } from "@/lib/types";

const GAMES: Record<GameMode, ComponentType<GameProps>> = {
  karten: Flashcards,
  quiz: Quiz,
  memory: Memory,
  salat: Scramble,
  schreiben: Typing,
  hoeren: Listen,
  blitz: Blitz,
};

function invert(d: Direction): Direction {
  return d === "foreign-de" ? "de-foreign" : d === "de-foreign" ? "foreign-de" : "mixed";
}

export default function PlayGame() {
  const { listId, mode } = useParams<{ listId: string; mode: string }>();
  const info = getMode(mode);
  const profile = useProfile();
  const tracker = useTracker();
  const [data, setData] = useState<{ list: VocabList; pool: Word[] } | null>(null);
  const [round, setRound] = useState<{ key: number; words: Word[]; start: number } | null>(null);
  const [result, setResult] = useState<{ r: RoundResult; wrong: Word[]; score?: number } | null>(null);
  const reverse = useSearchParams().get("r") === "1";
  const saving = useRef(false);

  if (!info) notFound();
  const cfg = getDifficulty(profile?.difficulty);
  const profileId = profile?.id;

  const prepareRound = useCallback(async () => {
    if (!profileId) return null;
    const list = await db.lists.get(listId);
    if (!list) return null;
    const pool = await db.words.where("listId").equals(listId).toArray();
    const prog = await progressMap(profileId, pool.map((w) => w.id));
    const size = mode === "memory" ? cfg.memoryPairs : mode === "blitz" ? pool.length : cfg.roundSize;
    return { list, pool, words: pickForRound(pool, prog, size) };
  }, [profileId, listId, mode, cfg.memoryPairs, cfg.roundSize]);

  const { reset } = tracker;
  const applyRound = useCallback(
    (prepared: Awaited<ReturnType<typeof prepareRound>>) => {
      if (!prepared) return;
      setData({ list: prepared.list, pool: prepared.pool });
      reset();
      saving.current = false;
      setResult(null);
      setRound((r) => ({ key: (r?.key ?? 0) + 1, words: prepared.words, start: Date.now() }));
    },
    [reset],
  );

  const newRound = useCallback(() => {
    void prepareRound().then(applyRound);
  }, [prepareRound, applyRound]);

  const started = useRef(false);
  useEffect(() => {
    if (!profileId || started.current) return;
    started.current = true;
    prepareRound().then(applyRound);
  }, [profileId, prepareRound, applyRound]);

  // Spiele rufen onDone oft per Timeout auf: immer den neuesten Stand lesen
  const trackerRef = useRef(tracker);
  useEffect(() => {
    trackerRef.current = tracker;
  });

  const finish = useCallback(
    async (extra?: { score?: number }) => {
      if (saving.current || !profile || !data || !round || !info) return;
      saving.current = true;
      // auf das letzte Re-Render warten, damit die letzte Antwort enthalten ist
      await new Promise((r) => setTimeout(r, 0));
      const t = trackerRef.current;
      const perfect = t.answers.length >= 5 && t.answers.every((a) => a.correct);
      const r = await recordRound({
        profileId: profile.id,
        listId: data.list.id,
        mode: info.id,
        difficulty: profile.difficulty,
        answers: t.answers,
        xp: (t.xp + (perfect ? 20 : 0)) * cfg.xpMultiplier,
        maxCombo: t.maxCombo,
        durationMs: Date.now() - round.start,
        score: extra?.score,
      });
      const wrongIds = new Set(t.answers.filter((a) => !a.correct).map((a) => a.wordId));
      setResult({ r, wrong: data.pool.filter((w) => wrongIds.has(w.id)), score: extra?.score });
    },
    [profile, data, round, info, cfg.xpMultiplier],
  );

  if (!profile || !data || !round || !info) return null;
  const Game = GAMES[info.id];
  const direction = reverse ? invert(cfg.direction) : cfg.direction;

  return (
    <Page tabs={false}>
      {result ? (
        <ResultScreen
          result={result.r}
          wrongWords={result.wrong}
          listId={data.list.id}
          onAgain={newRound}
          score={info.id === "blitz" ? result.score : info.id === "memory" ? result.score : undefined}
          scoreLabel={info.id === "blitz" ? "Treffer" : info.id === "memory" ? "Züge" : undefined}
        />
      ) : (
        <Game
          key={round.key}
          words={round.words}
          pool={data.pool}
          list={data.list}
          cfg={cfg}
          direction={direction}
          speechRate={profile.settings.speechRate}
          autoSpeak={profile.settings.autoSpeak || cfg.autoSpeak}
          tracker={tracker}
          onDone={finish}
        />
      )}
    </Page>
  );
}
