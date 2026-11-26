import "server-only";
import { Redis } from "@upstash/redis";

let client: Redis | null | undefined;

/** Upstash Redis, falls konfiguriert (Vercel Marketplace setzt KV_* oder UPSTASH_*). */
export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}

const memoryHits = new Map<string, { count: number; reset: number }>();

/** Einfaches Rate-Limit pro Schlüssel und Zeitfenster. */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const redis = getRedis();
  if (redis) {
    const k = `rl:${key}:${Math.floor(Date.now() / 1000 / windowSec)}`;
    const n = await redis.incr(k);
    if (n === 1) await redis.expire(k, windowSec);
    return n <= limit;
  }
  const now = Date.now();
  const cur = memoryHits.get(key);
  if (!cur || cur.reset < now) {
    memoryHits.set(key, { count: 1, reset: now + windowSec * 1000 });
    return true;
  }
  cur.count++;
  return cur.count <= limit;
}

export function clientKey(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
}
