"use client";
import { useState } from "react";
import { canSpeak, speak } from "@/lib/speech";

export function SpeakButton({
  text,
  lang,
  rate = "normal",
  size = "md",
  className = "",
}: {
  text: string;
  lang: string;
  rate?: "slow" | "normal";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [bump, setBump] = useState(0);
  if (!canSpeak(lang)) return null;
  const dim = size === "lg" ? "h-16 w-16 text-3xl" : size === "sm" ? "h-10 w-10 text-lg" : "h-12 w-12 text-2xl";
  return (
    <button
      type="button"
      aria-label={`„${text}“ vorlesen`}
      onClick={(e) => {
        e.stopPropagation();
        speak(text, lang, rate);
        setBump((b) => b + 1);
      }}
      className={`inline-flex items-center justify-center rounded-full bg-sky/15 border-2 border-sky/40 active:scale-95 transition ${dim} ${className}`}
    >
      <span key={bump} className={bump ? "anim-wiggle" : ""} aria-hidden>
        🔊
      </span>
    </button>
  );
}
