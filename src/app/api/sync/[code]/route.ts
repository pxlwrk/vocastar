import { clientKey, rateLimit } from "@/lib/server/redis";
import { errorResponse, getByCode } from "@/lib/server/store";

export async function GET(req: Request, ctx: RouteContext<"/api/sync/[code]">) {
  try {
    if (!(await rateLimit(`get:${clientKey(req)}`, 60, 600))) {
      return Response.json({ error: "Bitte kurz warten und dann nochmal." }, { status: 429 });
    }
    const { code } = await ctx.params;
    return Response.json(await getByCode("profile", code));
  } catch (e) {
    return errorResponse(e);
  }
}
