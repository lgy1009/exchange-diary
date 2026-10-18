// POST /api/guestbook  { name, message, website(숨은 칸) }  (DESIGN §4)
// 검사를 통과한 글만 노션 "방명록"에 "승인 대기"(승인 체크 안 됨)로 넣는다.
// 쓰기는 방명록 데이터베이스에만 연결된 별도 토큰(NOTION_GUESTBOOK_TOKEN)으로 한다.
//   201 접수 / 400 형식 오류 / 403 다른 사이트에서 보낸 요청 / 413 너무 큼 / 429 너무 잦음 / 503 준비 안 됨
import type { NextRequest } from "next/server";
import { allowPost, checkGuestbook } from "@/lib/guestbook";
import { findDatabases } from "@/lib/notion";

const json = (status: number, body: object) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: NextRequest) {
  // 우리 사이트 화면에서 보낸 요청만 받는다
  const origin = request.headers.get("origin");
  if (origin) {
    let host = "";
    try {
      host = new URL(origin).host;
    } catch {}
    if (host !== request.headers.get("host")) return json(403, { error: "허용되지 않은 요청이에요." });
  }

  const raw = await request.text();
  if (raw.length > 4000) return json(413, { error: "글이 너무 길어요." });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: "형식이 올바르지 않아요." });
  }

  const checked = checkGuestbook(body);
  // 로봇에게는 성공한 것처럼 답하고 아무것도 저장하지 않는다
  if (checked.ok === "bot") return json(201, { ok: true });
  if (!checked.ok) return json(400, { error: checked.error });

  // 도배 방지: 접속 주소별로 잠깐 센다 (저장하지 않음)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allowPost(ip)) return json(429, { error: "조금 뒤에 다시 남겨 주세요." });

  const token = process.env.NOTION_GUESTBOOK_TOKEN;
  if (!token) return json(503, { error: "방명록을 준비 중이에요." });

  try {
    const dbs = await findDatabases();
    if (!dbs.guestbook) return json(503, { error: "방명록을 준비 중이에요." });
    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
      body: JSON.stringify({
        parent: { database_id: dbs.guestbook.id },
        properties: {
          이름: { title: [{ type: "text", text: { content: checked.value.name } }] },
          내용: { rich_text: [{ type: "text", text: { content: checked.value.message } }] },
          승인: { checkbox: false }, // 항상 승인 대기로 넣는다
        },
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      // 글 내용이 로그에 남지 않게 상태 코드만 남긴다
      console.error(`방명록 저장 실패 HTTP ${res.status}`);
      return json(502, { error: "잠시 후 다시 시도해 주세요." });
    }
  } catch {
    return json(502, { error: "잠시 후 다시 시도해 주세요." });
  }

  return json(201, { ok: true });
}
