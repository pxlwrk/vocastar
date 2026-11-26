import { z } from "zod";
import { clientKey, rateLimit } from "@/lib/server/redis";
import { errorResponse, putWithCode } from "@/lib/server/store";

const ListSnapshot = z.object({
  version: z.literal(1),
  list: z.object({
    title: z.string().min(1).max(60),
    targetLang: z.string().max(10),
    grade: z.number().int(),
    emoji: z.string().max(16),
  }),
  words: z
    .array(z.object({ de: z.string().max(200), foreign: z.string().max(200), hint: z.string().max(200).optional() }))
    .min(1)
    .max(1000),
});

export async function POST(req: Request) {
  try {
    if (!(await rateLimit(`share:${clientKey(req)}`, 30, 3600))) {
      return Response.json({ error: "Bitte kurz warten und dann nochmal." }, { status: 429 });
    }
    const parsed = ListSnapshot.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "Ungültige Liste." }, { status: 400 });
    const code = await putWithCode("list", parsed.data);
    return Response.json({ code });
  } catch (e) {
    return errorResponse(e);
  }
}
