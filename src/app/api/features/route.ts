import { connection } from "next/server";
import { getRedis } from "@/lib/server/redis";

export async function GET() {
  await connection();
  return Response.json({
    ai: Boolean(process.env.ANTHROPIC_API_KEY),
    sync: Boolean(getRedis()),
  });
}
