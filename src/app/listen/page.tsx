"use client";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { ListCard } from "@/components/ListCard";
import { TabBar } from "@/components/TabBar";
import { Header, Page } from "@/components/ui";
import { useProfile } from "@/hooks/useProfile";
import { db } from "@/lib/db";
import { GRADES } from "@/lib/levels";
import type { Grade } from "@/lib/types";

export default function Lists() {
  const profile = useProfile();
  const [filter, setFilter] = useState<Grade | "alle" | null>(null);
  const lists = useLiveQuery(
    async () => (profile ? db.lists.where("profileId").equals(profile.id).reverse().sortBy("updatedAt") : []),
    [profile?.id],
  );
  if (!profile || !lists) return null;
  const active = filter ?? profile.grade;
  const shown = active === "alle" ? lists : lists.filter((l) => l.grade === active);

  return (
    <>
      <Page>
        <Header
          title="📚 Meine Listen"
          right={
            <Link href="/listen/neu" className="btn btn-sun !min-h-11 !px-4 !text-base">
              ＋ Neu
            </Link>
          }
        />
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {[...GRADES, "alle" as const].map((g) => (
            <button
              key={g}
              onClick={() => setFilter(g)}
              className={`rounded-full px-4 py-2 font-display font-semibold border-2 whitespace-nowrap ${
                active === g ? "bg-primary text-white border-primary" : "bg-white border-line"
              }`}
            >
              {g === "alle" ? "Alle" : `Klasse ${g}`}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {shown.map((l) => (
            <ListCard key={l.id} list={l} profileId={profile.id} />
          ))}
          {!shown.length && (
            <div className="card p-6 text-center">
              <div className="text-5xl mb-2" aria-hidden>
                📭
              </div>
              <p className="font-semibold text-ink-soft mb-4">Hier ist noch nichts. Leg deine erste Liste an!</p>
              <Link href="/listen/neu" className="btn btn-mint">
                ＋ Liste anlegen
              </Link>
            </div>
          )}
        </div>
        <Link href="/teilen" className="btn btn-ghost w-full mt-6">
          🔑 Liste mit Code holen
        </Link>
      </Page>
      <TabBar />
    </>
  );
}
