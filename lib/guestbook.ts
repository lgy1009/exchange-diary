// 방명록 글 검사 규칙 (DESIGN §4 /api/guestbook). 노션을 부르지 않는 순수한 함수만 둔다.

export const NAME_MAX = 20;
export const MESSAGE_MAX = 200;
export const RATE_LIMIT = { count: 3, windowMs: 10 * 60 * 1000 }; // 같은 접속에서 10분에 3건

export type GuestbookInput = { name: string; message: string };
export type CheckResult = { ok: true; value: GuestbookInput } | { ok: false; error: string } | { ok: "bot" };

// 링크처럼 보이는 글은 받지 않는다 (광고·피싱 방지)
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|kr|io|co|me|ly|xyz|info|site|shop)\b)/i;

// 보이지 않는 제어 문자 제거, 공백 정리
function clean(s: unknown, keepNewlines: boolean): string {
  if (typeof s !== "string") return "";
  // 제어 문자(줄바꿈은 글에서만 남김)와 보이지 않는 방향·폭 문자를 뺀다
  const noCtrl = [...s].filter((ch) => {
    const c = ch.codePointAt(0)!;
    if (keepNewlines && c === 10) return true;
    return !(c < 32 || c === 127 || (c >= 0x200b && c <= 0x200f) || (c >= 0x2028 && c <= 0x202e));
  }).join("");
  return keepNewlines ? noCtrl.replace(/\n{3,}/g, "\n\n").trim() : noCtrl.replace(/\s+/g, " ").trim();
}

export function checkGuestbook(body: unknown): CheckResult {
  const b = (body ?? {}) as Record<string, unknown>;
  // 숨은 칸: 사람에게는 안 보이는 칸이라, 채워져 있으면 로봇으로 본다
  if (typeof b.website === "string" && b.website.trim() !== "") return { ok: "bot" };

  const name = clean(b.name, false);
  const message = clean(b.message, true);
  if (!name) return { ok: false, error: "이름을 적어 주세요." };
  if ([...name].length > NAME_MAX) return { ok: false, error: `이름은 ${NAME_MAX}자까지 쓸 수 있어요.` };
  if (!message) return { ok: false, error: "남길 말을 적어 주세요." };
  if ([...message].length > MESSAGE_MAX) return { ok: false, error: `글은 ${MESSAGE_MAX}자까지 쓸 수 있어요.` };
  if (LINK.test(name) || LINK.test(message)) return { ok: false, error: "링크(주소)는 남길 수 없어요." };
  return { ok: true, value: { name, message } };
}

// 짧은 시간 동안 같은 접속의 글 수를 센다. 서버 메모리에만 잠깐 두고 저장하지 않는다.
// (서버가 여러 대로 나뉘면 정확하지 않지만, 승인제가 최종 방어선이다)
const hits = new Map<string, number[]>();

export function allowPost(key: string, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  if (recent.length >= RATE_LIMIT.count) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear(); // 메모리가 계속 늘지 않게
  return true;
}
