"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { CodeDialog, useServerFeatures } from "@/components/ShareDialog";
import { Header, Modal, Page } from "@/components/ui";
import { db } from "@/lib/db";
import { setCurrentProfileId, useCurrentProfileId } from "@/lib/current-profile";
import { levelFromXp } from "@/lib/gamification";
import { loadOcrStatus } from "@/lib/ocr-status";
import { deleteProfile } from "@/lib/repo";
import { exportProfile, importProfile, type ProfileSnapshot } from "@/lib/snapshot";
import type { Profile } from "@/lib/types";

function ParentGate({ onPass }: { onPass: () => void }) {
  const [task] = useState(() => {
    const a = 6 + Math.floor(Math.random() * 7);
    const b = 6 + Math.floor(Math.random() * 7);
    return { a, b };
  });
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);
  return (
    <form
      className="card p-5 text-center"
      onSubmit={(e) => {
        e.preventDefault();
        if (Number(value) === task.a * task.b) onPass();
        else {
          setWrong(true);
          setValue("");
        }
      }}
    >
      <div className="text-5xl mb-2">🔐</div>
      <h2 className="font-display text-xl font-semibold mb-1">Nur für Erwachsene</h2>
      <p className="font-semibold text-ink-soft mb-4">Bitte löse die Aufgabe:</p>
      <div className="font-display text-4xl font-bold mb-4">
        {task.a} × {task.b} = ?
      </div>
      <input
        className={`input text-center font-display !text-2xl mb-3 ${wrong ? "anim-shake !border-coral" : ""}`}
        inputMode="numeric"
        value={value}
        autoFocus
        aria-label="Ergebnis"
        onChange={(e) => {
          setValue(e.target.value.replace(/\D/g, ""));
          setWrong(false);
        }}
      />
      <button className="btn w-full" disabled={!value}>
        Öffnen
      </button>
    </form>
  );
}

export default function ParentArea() {
  const router = useRouter();
  const currentId = useCurrentProfileId();
  const features = useServerFeatures();
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Profile | null>(null);
  const [code, setCode] = useState<{ open: boolean; code?: string; error?: string }>({ open: false });
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [ocrStatus] = useState(loadOcrStatus);
  const profiles = useLiveQuery(() => db.profiles.orderBy("name").toArray(), []);

  async function makeSyncCode(p: Profile) {
    setCode({ open: true });
    try {
      const snap = await exportProfile(p.id);
      const res = await fetch("/api/sync", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(snap) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCode({ open: true, code: json.code });
    } catch (e) {
      setCode({ open: true, error: e instanceof Error ? e.message : "Fehler" });
    }
  }

  async function download(p: Profile) {
    const snap = await exportProfile(p.id);
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `vocastar-${p.name.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function upload(file: File) {
    try {
      const snap = JSON.parse(await file.text()) as ProfileSnapshot;
      const r = await importProfile(snap);
      setNotice(r.replaced ? `Profil „${snap.profile.name}“ wurde aktualisiert.` : `Profil „${snap.profile.name}“ wurde hinzugefügt.`);
    } catch {
      setNotice("Die Datei konnte nicht gelesen werden.");
    }
  }

  return (
    <Page tabs={false}>
      <Header title="🔐 Elternbereich" back />
      {!open ? (
        <ParentGate onPass={() => setOpen(true)} />
      ) : (
        <>
          {notice && <div className="card p-3 mb-4 !bg-mint/15 !border-mint font-semibold">{notice}</div>}
          <h2 className="font-display text-xl font-semibold mb-3">Profile auf diesem Gerät</h2>
          <div className="flex flex-col gap-3 mb-6">
            {profiles?.map((p) => (
              <div key={p.id} className="card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar profile={p} size={52} />
                  <div className="flex-1">
                    <div className="font-display text-lg font-semibold">{p.name}</div>
                    <div className="text-sm text-ink-soft font-semibold">
                      Klasse {p.grade} · Level {levelFromXp(p.xp).level} · {p.stars} ⭐
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    className="btn btn-sky !text-sm !px-2 !min-h-11"
                    disabled={features?.sync === false}
                    onClick={() => makeSyncCode(p)}
                    title={features?.sync === false ? "Sync ist auf diesem Server nicht eingerichtet" : undefined}
                  >
                    🔑 Sync-Code
                  </button>
                  <button className="btn btn-ghost !text-sm !px-2 !min-h-11" onClick={() => download(p)}>
                    💾 Sichern
                  </button>
                  <button className="btn btn-coral !text-sm !px-2 !min-h-11" onClick={() => setToDelete(p)}>
                    🗑️ Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = "";
            }}
          />
          <button className="btn btn-ghost w-full mb-3" onClick={() => fileRef.current?.click()}>
            📂 Sicherung einspielen
          </button>
          <button className="btn btn-ghost w-full mb-6" onClick={() => router.push("/teilen")}>
            🔑 Sync-Code von anderem Gerät eingeben
          </button>

          <div className="card p-4 text-sm font-semibold text-ink-soft">
            <h3 className="font-display text-base text-ink mb-1">Datenschutz</h3>
            <p className="mb-2">
              VocaStar braucht keine Anmeldung. Alle Profile, Listen und Lernstände werden nur im Browser dieses Geräts gespeichert.
            </p>
            <p className="mb-2">
              Erst wenn Sie einen Sync-Code oder einen Teilen-Code erzeugen, wird eine Kopie (Vorname, Listen, Lernstand) für 180 Tage auf dem Server abgelegt, damit ein anderes Gerät sie abrufen kann.
            </p>
            <p>
              Beim Foto-Import mit KI wird das Foto einmalig zur Texterkennung übertragen und nicht gespeichert. Ohne KI läuft die Erkennung komplett auf dem Gerät.
            </p>
            {features && (
              <p className="mt-2">
                Status: KI-Fotoerkennung {features.ai ? "✅ eingerichtet" : "➖ aus (Erkennung auf dem Gerät)"} · Sync {features.sync ? "✅ aktiv" : "➖ nicht eingerichtet"}
              </p>
            )}
            {ocrStatus && (
              <p className={`mt-2 ${ocrStatus.ok ? "" : "text-coral-dark"}`}>
                Letzte KI-Fotoerkennung ({new Date(ocrStatus.at).toLocaleString("de-DE")}):{" "}
                {ocrStatus.ok ? "✅ erfolgreich" : `❌ ${ocrStatus.message ?? "fehlgeschlagen"}`}
                {ocrStatus.reason === "billing" && " Bitte in der Anthropic Console unter „Plans & Billing“ Guthaben aufladen."}
                {ocrStatus.reason === "auth" && " Bitte den API-Key in den Vercel-Umgebungsvariablen prüfen."}
              </p>
            )}
          </div>
        </>
      )}

      <Modal open={!!toDelete} onClose={() => setToDelete(null)}>
        <h2 className="font-display text-2xl font-semibold mb-2">„{toDelete?.name}“ löschen?</h2>
        <p className="font-semibold text-ink-soft mb-4">Alle Listen, Sterne und Abzeichen dieses Profils werden von diesem Gerät gelöscht.</p>
        <div className="flex gap-2">
          <button className="btn btn-ghost flex-1" onClick={() => setToDelete(null)}>
            Abbrechen
          </button>
          <button
            className="btn btn-coral flex-1"
            onClick={async () => {
              if (!toDelete) return;
              await deleteProfile(toDelete.id);
              if (toDelete.id === currentId) setCurrentProfileId(null);
              setToDelete(null);
            }}
          >
            Löschen
          </button>
        </div>
      </Modal>
      <CodeDialog
        open={code.open}
        onClose={() => setCode({ open: false })}
        title="🔑 Sync-Code"
        code={code.code}
        error={code.error}
        hint="Auf dem anderen Gerät „Code eingeben“ wählen. Das Profil wird mit allen Listen und dem Lernstand übertragen."
      />
    </Page>
  );
}
