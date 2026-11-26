import { z } from "zod";
import { clientKey, rateLimit } from "@/lib/server/redis";
import { errorResponse, putWithCode } from "@/lib/server/store";

const ProfileSnapshot = z
  .object({
    version: z.literal(1),
    profile: z.object({ id: z.string().max(64), name: z.string().max(40) }).passthrough(),
    lists: z.array(z.object({ id: z.string() }).passthrough()).max(500),
    words: z.array(z.object({ id: z.string(), listId: z.string() }).passthrough()).max(20000),
  })
  .passthrough();

export async function POST(req: Request) {
  try {
    if (!(await rateLimit(`sync:${clientKey(req)}`, 20, 3600))) {
      return Response.json({ error: "Bitte kurz warten und dann nochmal." }, { status: 429 });
    }
    const parsed = ProfileSnapshot.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "Ungültige Daten." }, { status: 400 });
    const code = await putWithCode("profile", parsed.data);
    return Response.json({ code });
  } catch (e) {
    return errorResponse(e);
  }
}
