"use client";

// 메뉴 표시용: 브라우저 쿠키에 "열림 표시"(diary_unlocked=1)가 있는지.
// 화면을 바꾸는 데만 쓰고, 비공개 내용을 보여 줄지는 언제나 서버가 서명 쿠키로 판단한다.
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const read = () => document.cookie.split("; ").includes("diary_unlocked=1");

export function useUnlockedHint(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}
