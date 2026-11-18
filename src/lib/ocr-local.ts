import { parsePairs } from "./parse-pairs";
import type { WordPair } from "./types";

const TESS_LANG: Record<string, string> = {
  "en-GB": "eng",
  "fr-FR": "fra",
  "es-ES": "spa",
  la: "lat",
  "it-IT": "ita",
  "nl-NL": "nld",
  "ru-RU": "rus",
  "tr-TR": "tur",
};

/** Texterkennung direkt im Browser (Fallback ohne KI). */
export async function ocrLocal(
  dataUrl: string,
  targetLang: string,
  onProgress?: (p: number) => void,
): Promise<{ pairs: WordPair[]; text: string }> {
  const { createWorker } = await import("tesseract.js");
  const langs = ["deu", TESS_LANG[targetLang] ?? "eng"].join("+");
  const worker = await createWorker(langs, 1, {
    // Worker und Engine liegen in /public/tesseract (scripts/copy-ocr-assets.cjs)
    workerPath: "/tesseract/worker.min.js",
    corePath: "/tesseract",
    // Sprachdaten: Standard ist das jsDelivr-CDN, kann per Umgebungsvariable umgelenkt werden
    ...(process.env.NEXT_PUBLIC_TESSDATA_URL ? { langPath: process.env.NEXT_PUBLIC_TESSDATA_URL } : {}),
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") onProgress?.(m.progress);
    },
  });
  try {
    await worker.setParameters({ preserve_interword_spaces: "1" });
    const { data } = await worker.recognize(dataUrl);
    return { pairs: parsePairs(data.text, true), text: data.text };
  } finally {
    await worker.terminate();
  }
}
