// POST /api/lock — 잠금 해제 쿠키를 지운다 (DESIGN §4)
import { cookies } from "next/headers";
import { HINT_COOKIE, UNLOCK_COOKIE } from "@/lib/auth";

export async function POST() {
  const jar = await cookies();
  jar.delete(UNLOCK_COOKIE);
  jar.delete(HINT_COOKIE);
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
