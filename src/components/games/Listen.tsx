"use client";
import { canSpeak } from "@/lib/speech";
import Quiz from "./Quiz";
import type { GameProps } from "./shared";

export default function Listen(props: GameProps) {
  if (!canSpeak(props.list.targetLang)) {
    return (
      <div className="card p-6 text-center mt-10">
        <div className="text-5xl mb-3">🔇</div>
        <p className="font-display text-xl font-semibold mb-2">Keine Stimme gefunden</p>
        <p className="text-ink-soft font-semibold">Dieses Gerät kann die Sprache leider nicht vorlesen. Probier ein anderes Spiel!</p>
      </div>
    );
  }
  return <Quiz {...props} listen />;
}
