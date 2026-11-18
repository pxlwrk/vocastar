"use client";
import { useEffect, useState } from "react";
import { canSpeak, loadVoices, speak } from "@/lib/speech";

export function useSpeech(lang: string, rate: "slow" | "normal" = "normal") {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    loadVoices().then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);
  const available = ready && canSpeak(lang);
  return {
    available,
    say: (text: string, l: string = lang) => speak(text, l, rate),
  };
}
