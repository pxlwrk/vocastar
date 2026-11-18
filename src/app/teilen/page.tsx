"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { useServerFeatures } from "@/components/ShareDialog";
import { Header, Page } from "@/components/ui";
import { SpeechBubble, Voki } from "@/components/Voki";
import { normalizeCode } from "@/lib/codes";
import { setCurrentProfileId, useCurrentProfileId } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { getLanguage } from "@/lib/languages";
import { createList } from "@/lib/repo";
import { importProfile, type ListSnapshot, type ProfileSnapshot } from "@/lib/snapshot";
import { sfx } from "@/lib/sound";
import type { Grade } from "@/lib/types";

type Found = { kind: "list"; data: ListSnapshot } | { kind: "profile"; data: ProfileSnapshot };

export default function EnterCode() {
  const router = useRouter();
  const features = useServerFeatures();
  const currentId = useCurrentProfileId();
  const profiles = useLiveQuery(() => db.profiles.orderBy("name").toArray(), []);
  const search = useSearchParams();
  const [codeInput, setCode] = useState<string | null>(null);
  const code = codeInput ?? search.get("code") ?? "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<Found | null>(null);
  const [target, setTarget] = useState<string | null>(null);

  async function lookup() {
    setLoading(true);
    setError(null);
    const c = normalizeCode(code);
    try {
      let res = await fetch(`/api/share/${encodeURIComponent(c)}`);
      if (res.ok) {
        setFound({ kind: "list", data: await res.json() });
        sfx.coin();
        return;
      }
      res = await fetch(`/api/sync/${encodeURIComponent(c)}`);
      if (res.ok) {
        setFound({ kind: "profile", data: await res.json() });
        sfx.coin();
        return;
      }
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Diesen Code gibt es nicht.");
    } catch {
      setError("Keine Verbindung. Bist du online?");
    } finally {
      setLoading(false);
    }
  }

  async function acceptList(data: ListSnapshot, profileId: string) {
    const list = await createList({
      profileId,
      title: data.list.title,
      targetLang: data.list.targetLang,
      grade: data.list.grade as Grade,
      emoji: data.list.emoji,
      words: data.words,
    });
    sfx.win();
    setCurrentProfileId(profileId);
    router.replace(`/listen/${list.id}`);
  }

  async function acceptProfile(data: ProfileSnapshot) {
    const r = await importProfile(data);
    sfx.win();
    setCurrentProfileId(r.profileId);
    router.replace("/home");
  }

  const chosen = target ?? currentId ?? profiles?.[0]?.id ?? null;

  return (
    <Page tabs={false}>
      <Header title="🔑 Code eingeben" back />
      {!found ? (
        <>
          <div className="flex items-center gap-2 mb-5">
            <Voki mood="think" size={80} className="shrink-0" />
            <SpeechBubble>Hast du einen Code bekommen? Tipp ihn hier ein, z. B. TIGER-123.</SpeechBubble>
          </div>
          <form
            className="card p-5 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void lookup();
            }}
          >
            <input
              className={`input text-center font-display !text-3xl uppercase tracking-wider ${error ? "anim-shake !border-coral" : ""}`}
              value={code}
              autoFocus
              autoCapitalize="characters"
              autoComplete="off"
              aria-label="Code"
              placeholder="TIGER-123"
              onChange={(e) => {
                setCode(e.target.value);
                setError(null);
              }}
            />
            {error && <p className="text-coral-dark font-semibold text-center">{error}</p>}
            <button className="btn btn-mint" disabled={!code.trim() || loading || features?.sync === false}>
              {loading ? "Suche …" : "Abrufen"}
            </button>
            {features?.sync === false && (
              <p className="text-sm text-ink-soft font-semibold text-center">Teilen ist auf diesem Server noch nicht eingerichtet.</p>
            )}
          </form>
        </>
      ) : found.kind === "list" ? (
        <div className="card p-5">
          <div className="text-center mb-4">
            <div className="text-6xl mb-1 anim-pop">{found.data.list.emoji}</div>
            <h2 className="font-display text-2xl font-semibold">{found.data.list.title}</h2>
            <p className="font-semibold text-ink-soft">
              {getLanguage(found.data.list.targetLang).flag} {getLanguage(found.data.list.targetLang).name} · Klasse {found.data.list.grade} ·{" "}
              {found.data.words.length} Wörter
            </p>
          </div>
          <ul className="max-h-48 overflow-y-auto mb-4 rounded-2xl bg-bg-soft p-3 text-sm font-semibold">
            {found.data.words.slice(0, 50).map((w, i) => (
              <li key={i} className="flex justify-between gap-2 py-0.5">
                <span>{w.foreign}</span>
                <span className="text-ink-soft">{w.de}</span>
              </li>
            ))}
          </ul>
          {profiles && profiles.length > 0 ? (
            <>
              <p className="font-display text-lg font-semibold mb-2">Für wen?</p>
              <div className="flex gap-3 overflow-x-auto pb-2 mb-4">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setTarget(p.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-2xl border-2 min-w-20 ${chosen === p.id ? "border-primary bg-primary/10" : "border-transparent"}`}
                  >
                    <Avatar profile={p} size={48} />
                    <span className="font-display font-semibold text-sm">{p.name}</span>
                  </button>
                ))}
              </div>
              <button className="btn btn-mint w-full" disabled={!chosen} onClick={() => chosen && acceptList(found.data, chosen)}>
                ✓ Liste übernehmen
              </button>
            </>
          ) : (
            <p className="text-center font-semibold text-ink-soft">Lege zuerst ein Profil an, dann kannst du die Liste übernehmen.</p>
          )}
        </div>
      ) : (
        <div className="card p-5 text-center">
          <div className="flex justify-center mb-2">
            <Avatar profile={found.data.profile} size={84} />
          </div>
          <h2 className="font-display text-2xl font-semibold">{found.data.profile.name}</h2>
          <p className="font-semibold text-ink-soft mb-4">
            {found.data.lists.length} Listen · {found.data.words.length} Wörter · {found.data.profile.stars} ⭐
          </p>
          <p className="text-sm font-semibold text-ink-soft mb-4">
            Das Profil wird auf dieses Gerät übertragen. Gibt es es hier schon, wird der neuere Stand übernommen.
          </p>
          <button className="btn btn-mint w-full" onClick={() => acceptProfile(found.data)}>
            ✓ Profil übernehmen
          </button>
        </div>
      )}
    </Page>
  );
}
