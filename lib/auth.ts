// 비밀번호 확인과 서명 쿠키 (DESIGN §5 보안 점검표)
// - 쿠키 값: "만료시각.서명". 서명은 DIARY_PASSWORD로 만든 HMAC-SHA256이라, 비밀번호를 바꾸면 기존 쿠키는 모두 무효가 된다.
// - 비교는 모두 상수 시간 비교(timingSafeEqual)로 한다.
// 서버 코드에서만 쓴다.

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const UNLOCK_COOKIE = "diary_unlock"; // HttpOnly, 진짜 열쇠
export const HINT_COOKIE = "diary_unlocked"; // 화면 메뉴 표시용 힌트(값 "1"). 보안 판단에는 쓰지 않는다
export const UNLOCK_DAYS = 30;

function secret(): string | null {
  const pw = process.env.DIARY_PASSWORD;
  return pw && pw.length > 0 ? pw : null;
}

function sign(payload: string, pw: string): string {
  return createHmac("sha256", `exchange-diary:unlock:${pw}`).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  // 길이가 달라도 같은 시간이 걸리도록 해시끼리 비교한다
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

// 입력한 비밀번호가 맞는지
export function checkPassword(input: unknown): boolean {
  const pw = secret();
  if (!pw || typeof input !== "string" || input.length === 0 || input.length > 200) return false;
  return safeEqual(input, pw);
}

// 새 쿠키 값 만들기
export function issueToken(now = Date.now()): string | null {
  const pw = secret();
  if (!pw) return null;
  const exp = String(now + UNLOCK_DAYS * 86400000);
  return `${exp}.${sign(exp, pw)}`;
}

// 쿠키 값 검증: 형식·서명·만료를 모두 확인한다
export function verifyToken(token: string | undefined, now = Date.now()): boolean {
  const pw = secret();
  if (!pw || !token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d{10,16}$/.test(exp) || Number(exp) < now) return false;
  return safeEqual(sig, sign(exp, pw));
}

// 비밀번호 시도 횟수 제한 (서버 메모리에만 잠깐, 저장하지 않음)
const attempts = new Map<string, number[]>();
export const UNLOCK_LIMIT = { count: 5, windowMs: 10 * 60 * 1000 };

export function allowAttempt(key: string, now = Date.now()): boolean {
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < UNLOCK_LIMIT.windowMs);
  const ok = recent.length < UNLOCK_LIMIT.count;
  if (ok) recent.push(now);
  attempts.set(key, recent);
  if (attempts.size > 5000) attempts.clear();
  return ok;
}

export function clearAttempts(key: string) {
  attempts.delete(key);
}
