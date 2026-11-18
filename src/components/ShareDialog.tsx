"use client";
import { useEffect, useState } from "react";
import { Modal } from "./ui";

export function useServerFeatures() {
  const [features, setFeatures] = useState<{ ai: boolean; sync: boolean } | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/features")
      .then((r) => r.json())
      .then((f) => alive && setFeatures(f))
      .catch(() => alive && setFeatures({ ai: false, sync: false }));
    return () => {
      alive = false;
    };
  }, []);
  return features;
}

export function CodeDialog({
  open,
  onClose,
  title,
  code,
  error,
  hint,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  code?: string;
  error?: string;
  hint: string;
}) {
  const [copied, setCopied] = useState(false);
  const url = code && typeof window !== "undefined" ? `${window.location.origin}/teilen?code=${code}` : "";
  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="font-display text-2xl font-semibold mb-3">{title}</h2>
      {error ? (
        <p className="text-coral-dark font-semibold">{error}</p>
      ) : !code ? (
        <p className="font-semibold text-ink-soft">Code wird erstellt …</p>
      ) : (
        <>
          <div className="rounded-2xl bg-bg-soft border-2 border-dashed border-sun-dark p-4 text-center mb-3">
            <div className="font-display text-4xl font-bold tracking-wider select-all">{code}</div>
          </div>
          <p className="text-ink-soft font-semibold mb-4">{hint}</p>
          <div className="flex gap-2">
            <button
              className="btn btn-sky flex-1"
              onClick={async () => {
                try {
                  if (navigator.share) await navigator.share({ title: "VocaStar", text: `Mein VocaStar-Code: ${code}`, url });
                  else {
                    await navigator.clipboard.writeText(url);
                    setCopied(true);
                  }
                } catch {
                  /* abgebrochen */
                }
              }}
            >
              {copied ? "✓ Kopiert" : "📤 Teilen"}
            </button>
          </div>
        </>
      )}
      <button className="btn btn-ghost w-full mt-3" onClick={onClose}>
        Schließen
      </button>
    </Modal>
  );
}
