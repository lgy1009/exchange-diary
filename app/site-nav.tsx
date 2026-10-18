"use client";

// 미니홈피식 오른쪽 세로 탭(큰 화면)과 아래 고정 메뉴(휴대폰). 지금 보는 메뉴를 진하게 표시한다.
import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU = [
  { href: "/", label: "홈", en: "HOME" },
  { href: "/map", label: "지도", en: "MAP" },
  { href: "/diary", label: "일기", en: "DIARY" },
  { href: "/photos", label: "사진", en: "PHOTO" },
  { href: "/guestbook", label: "방명록", en: "GUEST" },
] as const;

type IsActive = (href: string) => boolean;
const NONE: IsActive = () => false;

function useActive(): IsActive {
  const path = usePathname();
  return (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
}

// 지금 주소(usePathname)는 요청 때만 알 수 있어서, 미리 그리는 화면에는 "선택 없음" 메뉴를 먼저 넣는다.
// layout.tsx에서 <Suspense fallback={<SideTabsView />}>로 감싼다.
export function SideTabs() {
  return <SideTabsView isActive={useActive()} />;
}

export function BottomNav() {
  return <BottomNavView isActive={useActive()} />;
}

export function SideTabsView({ isActive = NONE }: { isActive?: IsActive }) {
  return (
    <nav className="absolute top-5 right-0 hidden w-[72px] md:block">
      <ul className="flex flex-col gap-1.5">
        {MENU.map((m) => {
          const on = isActive(m.href);
          return (
            <li key={m.href}>
              <Link
                href={m.href}
                className={`dot block rounded-r-lg px-2.5 py-1.5 text-xs text-white transition-colors ${
                  on ? "bg-sea" : "bg-sea-soft hover:bg-sea/80"
                }`}
              >
                {m.en}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function BottomNavView({ isActive = NONE }: { isActive?: IsActive }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card/95 backdrop-blur md:hidden">
      <ul className="grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {MENU.map((m) => {
          const on = isActive(m.href);
          return (
            <li key={m.href}>
              <Link href={m.href} className={`flex flex-col items-center gap-0.5 py-2.5 ${on ? "text-sea" : "text-muted"}`}>
                <span className="dot text-[10px]">{m.en}</span>
                <span className={`text-xs ${on ? "font-semibold" : ""}`}>{m.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
