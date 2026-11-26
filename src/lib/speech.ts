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

export type VoicePreference = "female" | "male" | "auto";

let voicePreference: VoicePreference = "female";

export function setVoicePreference(pref: VoicePreference | undefined) {
  voicePreference = pref ?? "female";
}

// Browser verraten kein Geschlecht, nur Namen. Typische Stimmnamen von iOS, macOS, Windows, Android und Chrome:
const FEMALE =
  /female|weiblich|woman|samantha|karen|moira|tessa|fiona|veena|victoria|allison|\bava\b|susan|serena|kate|stephanie|martha|libby|sonia|maisie|hazel|zira|aria|jenny|emma|michelle|\banna\b|helena|petra|katja|hedda|marlene|vicki|amala|seraphina|am[ée]lie|audrey|aur[ée]lie|marie|julie|denise|hortense|virginie|c[ée]line|m[óo]nica|paulina|laura|elvira|luc[ií]a|alice|federica|elsa|isabella|paola|claire|ellen|milena|katya|yelda|filiz|flo\b|sandy|shelley/i;
const MALE =
  /\bmale\b|m[äa]nnlich|daniel|\balex\b|fred|\btom\b|oliver|arthur|george|ryan|\bguy\b|david|mark|james|thomas|markus|yannick|conrad|stefan|klaus|nicolas|henri|jorge|diego|pablo|[áa]lvaro|luca|cosimo|xander|maxim|yuri|\bcem\b|tolga|rishi|aaron|gordon|reed|eddy|grandpa|rocko|ralph|albert|jacques|juan|carlos/i;

function genderScore(v: SpeechSynthesisVoice): number {
  if (voicePreference === "auto") return 0;
  const wanted = voicePreference === "female" ? FEMALE : MALE;
  const other = voicePreference === "female" ? MALE : FEMALE;
  // "female" enthält "male": weibliche Treffer zuerst prüfen
  if (voicePreference === "male" && /female/i.test(v.name)) return -2;
  if (wanted.test(v.name)) return 2;
  if (other.test(v.name)) return -2;
  return 0;
}

export function findVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = voicesCache.length ? voicesCache : speechSupported() ? window.speechSynthesis.getVoices() : [];
  const lower = lang.toLowerCase();
  const base = lower.split("-")[0];
  const score = (v: SpeechSynthesisVoice) => {
    const l = v.lang.toLowerCase().replace("_", "-");
    const langScore = l === lower ? 4 : l.startsWith(base) ? 1 : -100;
    return langScore + genderScore(v) * 2 + (v.localService ? 0.5 : 0);
  };
  let best: SpeechSynthesisVoice | undefined;
  let bestScore = -50;
  for (const v of voices) {
    const sc = score(v);
    if (sc > bestScore) {
      best = v;
      bestScore = sc;
    }
  }
  return best;
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
