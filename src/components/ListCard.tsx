"use client";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { isMastered } from "@/lib/leitner";
import { getLanguage } from "@/lib/languages";
import type { VocabList } from "@/lib/types";
import { ProgressBar } from "./ui";

export function ListCard({ list, profileId, href }: { list: VocabList; profileId: string; href?: string }) {
  const stats = useLiveQuery(async () => {
    const ids = await db.words.where("listId").equals(list.id).primaryKeys();
    const prog = await db.progress.where("[profileId+wordId]").anyOf(ids.map((w) => [profileId, w])).toArray();
    return { total: ids.length, mastered: prog.filter(isMastered).length };
  }, [list.id, profileId]);
  const lang = getLanguage(list.targetLang);
  return (
    <Link href={href ?? `/listen/${list.id}`} className="card p-4 flex items-center gap-3 active:scale-[0.98] transition">
      <span className="h-14 w-14 rounded-2xl bg-bg-soft flex items-center justify-center text-3xl shrink-0" aria-hidden>
        {list.emoji}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-display text-lg font-semibold truncate">{list.title}</div>
        <div className="text-sm text-ink-soft font-semibold mb-1.5">
          {lang.flag} {lang.name} · {stats?.total ?? 0} Wörter · Kl. {list.grade}
        </div>
        <ProgressBar value={stats?.mastered ?? 0} max={stats?.total ?? 0} className="!h-2.5" />
      </div>
      <span className="text-2xl text-ink-soft" aria-hidden>
        ›
      </span>
    </Link>
  );
}
