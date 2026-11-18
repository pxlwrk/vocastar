import "server-only";
import { generateCode, isValidCode, normalizeCode } from "@/lib/codes";
import { getRedis } from "./redis";

const TTL = 60 * 60 * 24 * 180; // 180 Tage
const MAX_BYTES = 900_000;

export class StoreError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function putWithCode(prefix: "list" | "profile", payload: unknown): Promise<string> {
  const redis = getRedis();
  if (!redis) throw new StoreError("Teilen ist auf diesem Server nicht eingerichtet.", 501);
  const body = JSON.stringify(payload);
  if (body.length > MAX_BYTES) throw new StoreError("Das ist leider zu groß zum Teilen.", 413);
  for (let i = 0; i < 8; i++) {
    const code = generateCode();
    const ok = await redis.set(`${prefix}:${code}`, body, { nx: true, ex: TTL });
    if (ok) return code;
  }
  throw new StoreError("Kein freier Code gefunden, bitte nochmal versuchen.", 503);
}

export async function getByCode(prefix: "list" | "profile", rawCode: string): Promise<unknown> {
  const redis = getRedis();
  if (!redis) throw new StoreError("Teilen ist auf diesem Server nicht eingerichtet.", 501);
  const code = normalizeCode(rawCode);
  if (!isValidCode(code)) throw new StoreError("Diesen Code gibt es nicht.", 404);
  const data = await redis.get(`${prefix}:${code}`);
  if (!data) throw new StoreError("Diesen Code gibt es nicht (mehr).", 404);
  return typeof data === "string" ? JSON.parse(data) : data;
}

export function errorResponse(e: unknown) {
  if (e instanceof StoreError) return Response.json({ error: e.message }, { status: e.status });
  console.error(e);
  return Response.json({ error: "Da ist etwas schiefgegangen." }, { status: 500 });
}
