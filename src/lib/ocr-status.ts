/** Merkt sich das Ergebnis der letzten KI-Fotoerkennung (nur auf diesem Gerät). */
const KEY = "vocastar.ocrStatus";

export interface OcrStatus {
  ok: boolean;
  reason?: string;
  message?: string;
  at: number;
}

export function saveOcrStatus(status: OcrStatus) {
  try {
    localStorage.setItem(KEY, JSON.stringify(status));
  } catch {
    /* privater Modus */
  }
}

export function loadOcrStatus(): OcrStatus | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OcrStatus) : null;
  } catch {
    return null;
  }
}
