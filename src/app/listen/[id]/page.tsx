"use client";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { ListMetaForm } from "@/components/ListMetaForm";
import { CodeDialog, useServerFeatures } from "@/components/ShareDialog";
import { SpeakButton } from "@/components/SpeakButton";
import { AccentBar, WordEntry } from "@/components/WordEntry";
import { Header, Modal, Page } from "@/components/ui";
import { useProfile } from "@/hooks/useProfile";
import { db } from "@/lib/db";
import { GERMAN_ACCENTS, getLanguage } from "@/lib/languages";
import { addWords, deleteList, deleteWord, updateList, updateWord } from "@/lib/repo";
import { exportList } from "@/lib/snapshot";
import type { Word } from "@/lib/types";

function BoxDots({ box }: { box: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`Lernstand ${box} von 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`h-2 w-2 rounded-full ${i <= box ? "bg-mint" : "bg-black/10"}`} />
      ))}
    </span>
  );
}

export default function ListDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const profile = useProfile();
  const features = useServerFeatures();
  const search = useSearchParams();
  const [entryToggle, setEntryToggle] = useState<boolean | null>(null);
  const showEntry = entryToggle ?? search.has("neu");
  const [editMeta, setEditMeta] = useState(false);
  const [editWord, setEditWord] = useState<Word | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [share, setShare] = useState<{ open: boolean; code?: string; error?: string }>({ open: false });

  const data = useLiveQuery(async () => {
    const list = await db.lists.get(id);
    if (!list) return { list: null, words: [] as Word[], boxes: new Map<string, number>() };
    const words = await db.words.where("listId").equals(id).sortBy("order");
    const prog = profile
      ? await db.progress.where("[profileId+wordId]").anyOf(words.map((w) => [profile.id, w.id])).toArray()
      : [];
    return { list, words, boxes: new Map(prog.map((p) => [p.wordId, p.box])) };
  }, [id, profile?.id]);

  if (!profile || !data) return null;
  const { list, words, boxes } = data;
  if (!list) {
    return (
      <Page tabs={false}>
        <Header title="Liste nicht gefunden" back="/listen" />
      </Page>
    );
  }
  const lang = getLanguage(list.targetLang);

  async function doShare() {
    setShare({ open: true });
    try {
      const snap = await exportList(id);
      const res = await fetch("/api/share", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(snap) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Fehler");
      setShare({ open: true, code: json.code });
    } catch (e) {
      setShare({ open: true, error: e instanceof Error ? e.message : "Das hat leider nicht geklappt." });
    }
  }

  return (
    <Page tabs={false}>
      <Header
        title={
          <>
            {list.emoji} {list.title}
          </>
        }
        back="/listen"
        right={
          <button className="btn btn-ghost !min-h-11 !px-3" onClick={() => setEditMeta(true)} aria-label="Liste bearbeiten">
            ✏️
          </button>
        }
      />
      <p className="-mt-3 mb-4 text-ink-soft font-semibold">
        {lang.flag} {lang.name} · Klasse {list.grade} · {words.length} Wörter
      </p>

      <Link
        href={`/spielen/${list.id}`}
        className={`btn btn-mint w-full !text-2xl !min-h-16 mb-3 ${words.length < 2 ? "pointer-events-none opacity-50" : ""}`}
        aria-disabled={words.length < 2}
      >
        🎮 Spielen!
      </Link>
      {words.length < 2 && <p className="text-center text-sm text-ink-soft mb-3 font-semibold">Füge mindestens 2 Wörter hinzu, dann geht&apos;s los.</p>}

      <div className="grid grid-cols-3 gap-2 mb-5">
        <button className={`btn ${showEntry ? "btn-sun" : "btn-ghost"} !text-base !px-2`} onClick={() => setEntryToggle(!showEntry)}>
          ✏️ Tippen
        </button>
        <Link href={`/listen/${list.id}/foto`} className="btn btn-ghost !text-base !px-2">
          📸 Foto
        </Link>
        <button className="btn btn-ghost !text-base !px-2" onClick={doShare} disabled={features?.sync === false || !words.length}>
          📤 Teilen
        </button>
      </div>

      {showEntry && (
        <div className="mb-5">
          <WordEntry targetLang={list.targetLang} onAdd={(p) => addWords(list.id, [p]).then(() => undefined)} />
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {words.map((w) => (
          <li key={w.id} className="card p-3 flex items-center gap-3">
            <SpeakButton text={w.foreign} lang={list.targetLang} size="sm" rate={profile.settings.speechRate} />
            <button className="flex-1 min-w-0 text-left" onClick={() => setEditWord(w)}>
              <div className="font-display text-lg font-semibold truncate">{w.foreign}</div>
              <div className="text-ink-soft font-semibold truncate">{w.de}</div>
            </button>
            <BoxDots box={boxes.get(w.id) ?? 0} />
          </li>
        ))}
      </ul>

      <button className="mt-8 w-full text-coral-dark font-semibold underline" onClick={() => setConfirmDelete(true)}>
        Liste löschen
      </button>

      <Modal open={editMeta} onClose={() => setEditMeta(false)}>
        <h2 className="font-display text-2xl font-semibold mb-4">Liste bearbeiten</h2>
        <ListMetaForm
          initial={{ title: list.title, targetLang: list.targetLang, grade: list.grade, emoji: list.emoji }}
          submitLabel="Speichern"
          onSubmit={async (m) => {
            await updateList(list.id, m);
            setEditMeta(false);
          }}
        />
      </Modal>

      <EditWordModal word={editWord} targetLang={list.targetLang} onClose={() => setEditWord(null)} />

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <h2 className="font-display text-2xl font-semibold mb-2">Liste wirklich löschen?</h2>
        <p className="text-ink-soft font-semibold mb-4">Alle {words.length} Wörter und der Lernstand gehen verloren.</p>
        <div className="flex gap-2">
          <button className="btn btn-ghost flex-1" onClick={() => setConfirmDelete(false)}>
            Abbrechen
          </button>
          <button
            className="btn btn-coral flex-1"
            onClick={async () => {
              await deleteList(list.id);
              router.replace("/listen");
            }}
          >
            Löschen
          </button>
        </div>
      </Modal>

      <CodeDialog
        open={share.open}
        onClose={() => setShare({ open: false })}
        title="📤 Liste teilen"
        code={share.code}
        error={share.error}
        hint="Auf einem anderen Gerät „Code eingeben“ wählen und diesen Code eintippen. Der Code gilt 180 Tage."
      />
    </Page>
  );
}

function EditWordModal({ word, targetLang, onClose }: { word: Word | null; targetLang: string; onClose: () => void }) {
  const [foreign, setForeign] = useState("");
  const [de, setDe] = useState("");
  const [lastId, setLastId] = useState<string | null>(null);
  if (word && word.id !== lastId) {
    setLastId(word.id);
    setForeign(word.foreign);
    setDe(word.de);
  }
  const lang = getLanguage(targetLang);
  return (
    <Modal open={!!word} onClose={onClose}>
      <h2 className="font-display text-2xl font-semibold mb-4">Wort bearbeiten</h2>
      <label className="text-sm font-bold text-ink-soft">
        {lang.flag} {lang.name}
      </label>
      <input className="input mb-2" value={foreign} onChange={(e) => setForeign(e.target.value)} />
      <AccentBar chars={lang.accents} onPick={(c) => setForeign((f) => f + c)} />
      <label className="text-sm font-bold text-ink-soft mt-3 block">🇩🇪 Deutsch</label>
      <input className="input mb-2" value={de} onChange={(e) => setDe(e.target.value)} />
      <AccentBar chars={GERMAN_ACCENTS} onPick={(c) => setDe((f) => f + c)} />
      <div className="flex gap-2 mt-5">
        <button
          className="btn btn-coral"
          aria-label="Wort löschen"
          onClick={async () => {
            if (word) await deleteWord(word.id);
            onClose();
          }}
        >
          🗑️
        </button>
        <button
          className="btn btn-mint flex-1"
          disabled={!foreign.trim() || !de.trim()}
          onClick={async () => {
            if (word) await updateWord(word.id, { foreign: foreign.trim(), de: de.trim() });
            onClose();
          }}
        >
          Speichern
        </button>
      </div>
    </Modal>
  );
}
