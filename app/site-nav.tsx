"use client";

// 미니홈피식 오른쪽 세로 탭(큰 화면)과 아래 고정 메뉴(휴대폰). 지금 보는 메뉴를 진하게 표시한다.
// 비밀번호를 푼 기기에서는 "내 일정" 메뉴가 더 보인다. (보이기만 할 뿐, 내용은 서버가 다시 확인한다)
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUnlockedHint } from "./unlock-hint";

const MENU = [
  { href: "/", label: "홈", en: "HOME" },
  { href: "/map", label: "지도", en: "MAP" },
  { href: "/diary", label: "일기", en: "DIARY" },
  { href: "/photos", label: "사진", en: "PHOTO" },
  { href: "/guestbook", label: "방명록", en: "GUEST" },
];
const PRIVATE_MENU = { href: "/calendar", label: "일정", en: "MINE" };

type IsActive = (href: string) => boolean;
const NONE: IsActive = () => false;

function useActive(): IsActive {
  const path = usePathname();
  return (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
}

// 지금 주소(usePathname)는 요청 때만 알 수 있어서, 미리 그리는 화면에는 "선택 없음" 메뉴를 먼저 넣는다.
// layout.tsx에서 <Suspense fallback={<SideTabsView />}>로 감싼다.
export function SideTabs() {
  return <SideTabsView isActive={useActive()} unlocked={useUnlockedHint()} />;
}

export function BottomNav() {
  return <BottomNavView isActive={useActive()} unlocked={useUnlockedHint()} />;
}

export function SideTabsView({ isActive = NONE, unlocked = false }: { isActive?: IsActive; unlocked?: boolean }) {
  const items = unlocked ? [...MENU, PRIVATE_MENU] : MENU;
  return (
    <nav className="absolute top-14 right-0 hidden w-[66px] md:block">
      <ul className="flex flex-col gap-0.5">
        {items.map((m) => {
          const on = isActive(m.href);
          const mine = m === PRIVATE_MENU;
          return (
            <li key={m.href}>
              <Link
                href={m.href}
                className={`dot block rounded-r-md border border-l-0 border-sea px-2 py-1.5 text-xs ${
                  on ? "bg-card font-bold text-sea" : mine ? "bg-terracotta text-white" : "bg-sea text-white hover:bg-terracotta"
                }`}
              >
                {m.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function BottomNavView({ isActive = NONE, unlocked = false }: { isActive?: IsActive; unlocked?: boolean }) {
  const items = unlocked ? [...MENU, PRIVATE_MENU] : MENU;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-sea bg-card md:hidden">
      <ul className={`grid pb-[env(safe-area-inset-bottom)] ${unlocked ? "grid-cols-6" : "grid-cols-5"}`}>
        {items.map((m) => {
          const on = isActive(m.href);
          return (
            <li key={m.href}>
              <Link href={m.href} className={`flex flex-col items-center gap-0.5 py-2.5 ${on ? "bg-sea text-white" : "text-ink"}`}>
                <span className="dot text-xs">{m.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// 머리글 오른쪽 자물쇠: 잠김 🔒 / 열림 🔓 → 누르면 비밀번호 화면(열림이면 잠그기)
export function LockLink() {
  const unlocked = useUnlockedHint();
  return (
    <Link href="/unlock" className="dot text-xs" aria-label={unlocked ? "잠그기" : "비공개 기록 열기"}>
      {unlocked ? "🔓" : "🔒"}
    </Link>
  );
}
