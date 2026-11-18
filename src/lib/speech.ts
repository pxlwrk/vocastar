/** Sprachausgabe über die Web Speech API. */

let voicesCache: SpeechSynthesisVoice[] = [];

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!speechSupported()) return Promise.resolve([]);
  const v = window.speechSynthesis.getVoices();
  if (v.length) {
    voicesCache = v;
    return Promise.resolve(v);
  }
  return new Promise((resolve) => {
    const done = () => {
      voicesCache = window.speechSynthesis.getVoices();
      resolve(voicesCache);
    };
    window.speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 1500);
  });
}

export function findVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = voicesCache.length ? voicesCache : speechSupported() ? window.speechSynthesis.getVoices() : [];
  const lower = lang.toLowerCase();
  const base = lower.split("-")[0];
  return (
    voices.find((v) => v.lang.toLowerCase() === lower && v.localService) ??
    voices.find((v) => v.lang.toLowerCase() === lower) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(base))
  );
}

export function canSpeak(lang: string): boolean {
  if (!speechSupported()) return false;
  // Latein hat praktisch nie eine eigene Stimme: italienisch klingt am ehesten passend
  if (lang === "la") return !!findVoice("it-IT") || !!findVoice("la");
  return !!findVoice(lang) || voicesCache.length === 0;
}

export function speak(text: string, lang: string, rate: "slow" | "normal" = "normal") {
  if (!speechSupported() || !text) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/\(.*?\)/g, ""));
  const effectiveLang = lang === "la" && !findVoice("la") ? "it-IT" : lang;
  u.lang = effectiveLang;
  const voice = findVoice(effectiveLang);
  if (voice) u.voice = voice;
  u.rate = rate === "slow" ? 0.7 : 0.95;
  u.pitch = 1.05;
  synth.speak(u);
}
