import { afterEach, describe, expect, it, vi } from "vitest";

type V = { name: string; lang: string; localService: boolean };
const voices: V[] = [
  // iPhone / Mac
  { name: "Daniel", lang: "en-GB", localService: true },
  { name: "Kate", lang: "en-GB", localService: true },
  { name: "Thomas", lang: "fr-FR", localService: true },
  { name: "Amélie", lang: "fr-CA", localService: true },
  { name: "Anna", lang: "de-DE", localService: true },
  // Chrome / Android / Windows
  { name: "Google UK English Male", lang: "en-GB", localService: false },
  { name: "Google UK English Female", lang: "en-GB", localService: false },
  { name: "Microsoft Pablo - Spanish (Spain)", lang: "es-ES", localService: true },
  { name: "Microsoft Helena - Spanish (Spain)", lang: "es-ES", localService: true },
];

async function load() {
  vi.resetModules();
  vi.stubGlobal("window", { speechSynthesis: { getVoices: () => voices } });
  return import("../speech");
}

afterEach(() => vi.unstubAllGlobals());

describe("Stimmenwahl", () => {
  it("wählt standardmäßig eine weibliche Stimme", async () => {
    const s = await load();
    expect(s.findVoice("en-GB")?.name).toBe("Kate");
    expect(s.findVoice("es-ES")?.name).toBe("Microsoft Helena - Spanish (Spain)");
  });
  it("erkennt „Female“ nicht als männlich", async () => {
    const s = await load();
    s.setVoicePreference("male");
    expect(s.findVoice("en-GB")?.name).toBe("Daniel");
    expect(s.findVoice("es-ES")?.name).toBe("Microsoft Pablo - Spanish (Spain)");
  });
  it("nimmt die passende Sprache vor dem Geschlecht", async () => {
    const s = await load();
    // Für fr-FR gibt es nur Thomas exakt; Amélie (fr-CA) ist weiblich und gleiche Grundsprache
    expect(s.findVoice("fr-FR")?.name).toBe("Amélie");
    s.setVoicePreference("auto");
    expect(s.findVoice("fr-FR")?.name).toBe("Thomas");
  });
  it("findet deutsche Stimme", async () => {
    const s = await load();
    expect(s.findVoice("de-DE")?.name).toBe("Anna");
  });
});
