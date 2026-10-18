// 지금 보는 사람이 비밀번호를 확인했는지.
// 작업 7(접근 보호)에서 서명 쿠키를 확인하도록 바꾼다. 그 전까지는 항상 "잠김"으로 본다. (안전한 쪽)
export async function isUnlocked(): Promise<boolean> {
  return false;
}
