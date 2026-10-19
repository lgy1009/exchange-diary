// POST /api/unlock { password }  (DESIGN §4)
// 비밀번호가 맞으면 서명 쿠키를 심는다. 비밀번호는 URL·로그에 남기지 않는다.
//   200 성공 / 400 형식 오류 / 401 틀림(1초 늦게 답함) / 403 다른 사이트 / 429 너무 많은 시도 / 503 비밀번호 미설정
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { allowAttempt, checkPassword, clearAttempts, HINT_COOKIE, issueToken, UNLOCK_COOKIE, UNLOCK_DAYS } from "@/lib/auth";

const json = (status: number, body: object) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) {
    let host = "";
    try {
      host = new URL(origin).host;
    } catch {}
    if (host !== request.headers.get("host")) return json(403, { error: "허용되지 않은 요청이에요." });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allowAttempt(ip)) return json(429, { error: "시도가 너무 많아요. 10분 뒤에 다시 해 주세요." });

  const raw = await request.text();
  if (raw.length > 1000) return json(400, { error: "형식이 올바르지 않아요." });
  let password: unknown;
  try {
    password = (JSON.parse(raw) as { password?: unknown }).password;
  } catch {
    return json(400, { error: "형식이 올바르지 않아요." });
  }
  if (typeof password !== "string" || password.length === 0) return json(400, { error: "비밀번호를 입력해 주세요." });

  if (!checkPassword(password)) {
    await sleep(1000); // 하나씩 맞혀 보는 공격을 느리게 한다
    return json(401, { error: "비밀번호가 맞지 않아요." });
  }

  const token = issueToken();
  if (!token) return json(503, { error: "비밀번호가 아직 설정되지 않았어요." });

  clearAttempts(ip);
  const jar = await cookies();
  const base = {
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: UNLOCK_DAYS * 86400,
  };
  jar.set(UNLOCK_COOKIE, token, { ...base, httpOnly: true });
  jar.set(HINT_COOKIE, "1", { ...base, httpOnly: false }); // 메뉴에 "내 일정"을 보여 줄지 정하는 표시일 뿐
  return json(200, { ok: true });
}
