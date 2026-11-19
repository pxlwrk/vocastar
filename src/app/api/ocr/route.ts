import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { getLanguage } from "@/lib/languages";
import { clientKey, rateLimit } from "@/lib/server/redis";

export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_OCR_MODEL ?? "claude-opus-5-5";
const MAX_BASE64 = 5_000_000;

const OcrBody = z.object({
  image: z.string().min(100).max(MAX_BASE64),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]).default("image/jpeg"),
  targetLang: z.string().max(10),
});

const Pairs = z.object({
  pairs: z.array(
    z.object({
      foreign: z.string().describe("Wort oder Ausdruck in der Fremdsprache, so wie im Buch"),
      de: z.string().describe("Deutsche Übersetzung, mehrere Bedeutungen mit Komma getrennt"),
    }),
  ),
});

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "KI-Erkennung ist nicht eingerichtet." }, { status: 501 });
  }
  if (!(await rateLimit(`ocr:${clientKey(req)}`, 30, 3600))) {
    return Response.json({ error: "Zu viele Fotos in kurzer Zeit. Bitte später nochmal versuchen." }, { status: 429 });
  }
  const parsed = OcrBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Ungültiges Bild." }, { status: 400 });
  }
  const { image, mediaType, targetLang } = parsed.data;
  const lang = getLanguage(targetLang);

  const client = new Anthropic();
  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 8000,
      output_config: { effort: "low", format: zodOutputFormat(Pairs) },
      system:
        "Du liest Vokabeln aus Fotos von Schulbüchern, Arbeitsblättern und Heften für Kinder der Klassen 5 bis 7. " +
        "Gib nur Vokabelpaare zurück, die wirklich auf dem Bild stehen. Ignoriere Seitenzahlen, Überschriften, Lautschrift in eckigen Klammern, Beispielsätze und Grammatikhinweise. " +
        "Übernimm die Schreibweise exakt (inklusive Akzenten, Artikeln wie 'the', 'le', 'la' und 'to' bei Verben). " +
        "Bei mehreren deutschen Bedeutungen trenne sie mit Komma. Erfinde nichts und übersetze nicht selbst, wenn eine Spalte fehlt.",
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
            {
              type: "text",
              text: `Lies alle Vokabelpaare ${lang.name} ↔ Deutsch aus diesem Foto. Typisch ist links ${lang.name}, rechts Deutsch; erkenne die Spalten aber selbst.`,
            },
          ],
        },
      ],
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return Response.json({ error: "Das Foto konnte nicht gelesen werden." }, { status: 422 });
    }
    const pairs = response.parsed_output.pairs
      .map((p) => ({ foreign: p.foreign.trim(), de: p.de.trim() }))
      .filter((p) => p.foreign && p.de)
      .slice(0, 200);
    return Response.json({ pairs });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      const reason = classify(error);
      console.error("OCR API error", error.status, reason, error.message);
      return Response.json({ error: REASON_TEXT[reason], reason }, { status: reason === "rate" ? 429 : 502 });
    }
    throw error;
  }
}

type OcrFailure = "billing" | "auth" | "rate" | "overloaded" | "other";

const REASON_TEXT: Record<OcrFailure, string> = {
  billing: "Das Guthaben des Anthropic-Kontos ist aufgebraucht.",
  auth: "Der Anthropic-API-Key ist ungültig oder fehlt.",
  rate: "Die KI bekommt gerade zu viele Anfragen.",
  overloaded: "Die KI ist gerade überlastet.",
  other: "Die KI-Erkennung ist fehlgeschlagen.",
};

function classify(error: InstanceType<typeof Anthropic.APIError>): OcrFailure {
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) return "auth";
  if (error instanceof Anthropic.RateLimitError) return "rate";
  if (error instanceof Anthropic.InternalServerError) return "overloaded";
  // Fehlendes Guthaben kommt als 400 invalid_request_error; nur der Text unterscheidet es
  if (error instanceof Anthropic.BadRequestError && /credit balance/i.test(error.message)) return "billing";
  return "other";
}
