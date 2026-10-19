// 지금 보는 사람이 비밀번호를 확인했는지 — 서명 쿠키를 서버에서 검증한다. (DESIGN §5)
// 쿠키와 현재 시각을 쓰므로 요청 때만 계산한다. 페이지에서는 <Suspense> 안의 Loader에서만 부른다.
import { cookies } from "next/headers";
import { connection } from "next/server";
import { UNLOCK_COOKIE, verifyToken } from "./auth";

export async function isUnlocked(): Promise<boolean> {
  await connection(); // 미리 그리는 단계에서는 계산하지 않고 요청 때로 미룬다
  const token = (await cookies()).get(UNLOCK_COOKIE)?.value;
  if (!token) return false;
  return verifyToken(token, Date.now());
}
