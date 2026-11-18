"use client";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { useRef, useState } from "react";
import { useServerFeatures } from "@/components/ShareDialog";
import { Header, Page, ProgressBar } from "@/components/ui";
import { SpeechBubble, Voki } from "@/components/Voki";
import { useProfile } from "@/hooks/useProfile";
import { db } from "@/lib/db";
import { downscaleImage } from "@/lib/image";
import { getLanguage } from "@/lib/languages";
import { parsePairs } from "@/lib/parse-pairs";
import { addWords, unlockAchievement } from "@/lib/repo";
import { sfx } from "@/lib/sound";
import type { WordPair } from "@/lib/types";

interface Photo {
  id: string;
  dataUrl: string;
  base64: string;
}

type Phase = "pick" | "working" | "review";

export default function PhotoImport() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const profile = useProfile();
  const features = useServerFeatures();
  const list = useLiveQuery(() => db.lists.get(id), [id]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [phase, setPhase] = useState<Phase>("pick");
  const [progress, setProgress] = useState({ done: 0, total: 0, label: "" });
  const [rows, setRows] = useState<WordPair[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState("");

  if (!profile || !list) return null;
  const lang = getLanguage(list.targetLang);

  async function onFiles(files: FileList | null) {
    if (!files) return;
    const next: Photo[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      const img = await downscaleImage(f);
      next.push({ id: Math.random().toString(36).slice(2), ...img });
    }
    setPhotos((p) => [...p, ...next].slice(0, 6));
  }

  async function recognize() {
    setPhase("working");
    setMessage(null);
    const all: WordPair[] = [];
    let usedFallback = false;
    let failed = false;
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      setProgress({ done: i, total: photos.length, label: `Foto ${i + 1} von ${photos.length}` });
      let pairs: WordPair[] | null = null;
      if (features?.ai) {
        try {
          const res = await fetch("/api/ocr", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ image: photo.base64, mediaType: "image/jpeg", targetLang: list!.targetLang }),
          });
          const json = await res.json();
          if (res.ok) pairs = json.pairs;
        } catch {
          /* Fallback unten */
        }
      }
      if (!pairs) {
        usedFallback = true;
        try {
          const { ocrLocal } = await import("@/lib/ocr-local");
          const r = await withTimeout(
            ocrLocal(photo.dataUrl, list!.targetLang, (p) =>
              setProgress({ done: i + p, total: photos.length, label: `Foto ${i + 1} von ${photos.length} wird gelesen …` }),
            ),
            120_000,
          );
          pairs = r.pairs;
        } catch (e) {
          console.error("Lokale Texterkennung fehlgeschlagen", e);
          failed = true;
          pairs = [];
        }
      }
      all.push(...pairs);
    }
    setProgress({ done: photos.length, total: photos.length, label: "Fertig!" });
    setRows(dedupe(all));
    setMessage(
      failed && !all.length
        ? "Oh je, die Texterkennung konnte nicht starten. Bist du online? Du kannst die Wörter auch eintippen oder als Text einfügen."
        : all.length
        ? usedFallback
          ? "Ich habe mein Bestes gegeben! Bitte prüfe die Wörter, bevor du speicherst."
          : "Super, das habe ich gefunden! Stimmt alles?"
        : "Hm, ich konnte leider keine Vokabeln erkennen. Versuch ein schärferes Foto oder tippe sie ein.",
    );
    setPhase("review");
  }

  function fromPaste() {
    const pairs = parsePairs(pasteText, true);
    setRows(dedupe(pairs));
    setMessage(pairs.length ? "Das habe ich aus deinem Text gelesen:" : "Ich habe keine Paare gefunden. Schreib pro Zeile: Wort - Übersetzung");
    setPhase("review");
  }

  async function save() {
    const valid = rows.filter((r) => r.de.trim() && r.foreign.trim());
    if (!valid.length) return;
    await addWords(list!.id, valid);
    if (photos.length) await unlockAchievement(profile!.id, "photo");
    sfx.win();
    router.replace(`/listen/${list!.id}`);
  }

  return (
    <Page tabs={false}>
      <Header title="📸 Wörter fotografieren" back={`/listen/${id}`} />

      {phase === "pick" && (
        <>
          <div className="flex items-center gap-2 mb-5">
            <Voki mood="happy" size={80} className="shrink-0" />
            <SpeechBubble>
              Fotografiere die Vokabelseite aus deinem Buch. Ich lese die Wörter für dich ab!
            </SpeechBubble>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => {
              void onFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button className="btn btn-sky w-full !min-h-20 !text-xl mb-3" onClick={() => fileRef.current?.click()}>
            📷 Foto aufnehmen oder auswählen
          </button>

          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {photos.map((p) => (
                <div key={p.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-line bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.dataUrl} alt="Vokabelfoto" className="h-full w-full object-cover" />
                  <button
                    className="absolute top-1 right-1 h-8 w-8 rounded-full bg-white/90 font-bold"
                    aria-label="Foto entfernen"
                    onClick={() => setPhotos((ps) => ps.filter((x) => x.id !== p.id))}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <button className="btn btn-mint w-full !text-xl" disabled={!photos.length || !features} onClick={recognize}>
            ✨ Wörter erkennen
          </button>
          <p className="text-xs text-ink-soft text-center mt-2 font-semibold">
            {features?.ai
              ? "Die Fotos werden zur Erkennung kurz an die KI geschickt und nicht gespeichert."
              : "Die Erkennung läuft direkt auf deinem Gerät. Bei Fotos klappt das am besten mit gerader, gut beleuchteter Seite."}
          </p>

          <details className="card p-4 mt-6">
            <summary className="font-display text-lg font-semibold cursor-pointer">📋 Oder Text einfügen</summary>
            <p className="text-sm text-ink-soft font-semibold my-2">
              Pro Zeile ein Paar, zuerst {lang.name}, dann Deutsch. Zum Beispiel: <code>the dog - der Hund</code>
            </p>
            <textarea
              className="input min-h-36 font-mono text-base"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={"the cat - die Katze\nthe house - das Haus"}
            />
            <button className="btn w-full mt-3" disabled={!pasteText.trim()} onClick={fromPaste}>
              Übernehmen
            </button>
          </details>
        </>
      )}

      {phase === "working" && (
        <div className="flex flex-col items-center gap-4 mt-10">
          <Voki mood="think" size={120} className="anim-float" />
          <p className="font-display text-2xl font-semibold">Ich lese …</p>
          <ProgressBar value={progress.done} max={progress.total || 1} color="var(--sky)" className="w-full" />
          <p className="text-ink-soft font-semibold">{progress.label}</p>
        </div>
      )}

      {phase === "review" && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Voki mood={rows.length ? "cheer" : "sad"} size={72} className="shrink-0" />
            {message && <SpeechBubble>{message}</SpeechBubble>}
          </div>
          <div className="flex gap-2 mb-3">
            <button
              className="btn btn-ghost flex-1 !text-base"
              onClick={() => setRows((rs) => rs.map((r) => ({ ...r, de: r.foreign, foreign: r.de })))}
            >
              ⇄ Spalten tauschen
            </button>
            <button className="btn btn-ghost flex-1 !text-base" onClick={() => setRows((rs) => [...rs, { de: "", foreign: "" }])}>
              ＋ Zeile
            </button>
          </div>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-sm font-bold text-ink-soft px-1 mb-1">
            <span>
              {lang.flag} {lang.name}
            </span>
            <span>🇩🇪 Deutsch</span>
            <span className="w-9" />
          </div>
          <ul className="flex flex-col gap-2 mb-5">
            {rows.map((r, i) => (
              <li key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                <input
                  className="input !min-h-11 !py-2 !text-base"
                  value={r.foreign}
                  aria-label={`${lang.name} Zeile ${i + 1}`}
                  onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, foreign: e.target.value } : x)))}
                />
                <input
                  className="input !min-h-11 !py-2 !text-base"
                  value={r.de}
                  aria-label={`Deutsch Zeile ${i + 1}`}
                  onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, de: e.target.value } : x)))}
                />
                <button
                  className="h-9 w-9 rounded-full bg-coral/15 text-coral-dark font-bold"
                  aria-label={`Zeile ${i + 1} entfernen`}
                  onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button
              className="btn btn-ghost"
              onClick={() => {
                setPhase("pick");
                setRows([]);
              }}
            >
              Nochmal
            </button>
            <button className="btn btn-mint flex-1" disabled={!rows.some((r) => r.de.trim() && r.foreign.trim())} onClick={save}>
              ✓ {rows.filter((r) => r.de.trim() && r.foreign.trim()).length} Wörter speichern
            </button>
          </div>
        </>
      )}
    </Page>
  );
}

function dedupe(pairs: WordPair[]): WordPair[] {
  const seen = new Set<string>();
  return pairs.filter((p) => {
    const k = `${p.foreign.toLowerCase()}|${p.de.toLowerCase()}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Zeitüberschreitung")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}
