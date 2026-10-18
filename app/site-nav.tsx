"use client";

// 머리글(큰 화면)과 아래 고정 메뉴(휴대폰). 지금 보고 있는 메뉴를 포인트 색으로 표시한다.
import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU = [
  { href: "/", label: "홈", en: "Home" },
  { href: "/calendar", label: "달력", en: "Calendar" },
  { href: "/trips", label: "여행", en: "Trips" },
  { href: "/diary", label: "일기", en: "Diary" },
] as const;

function useActive() {
  const path = usePathname();
  return (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
}

export function SiteHeader() {
  const isActive = useActive();
  return (
    <header className="mx-auto flex w-full max-w-[1100px] items-center justify-between px-5 pt-6 pb-4 sm:px-8 sm:pt-8">
      <Link href="/" className="display text-lg sm:text-xl">
        EXCHANGE<span className="text-accent">.</span>DIARY
      </Link>
      <nav className="hidden gap-8 sm:flex">
        {MENU.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className={`eyebrow transition-colors hover:text-ink ${isActive(m.href) ? "!text-accent" : ""}`}
          >
            {m.en}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function BottomNav() {
  const isActive = useActive();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper/95 backdrop-blur sm:hidden">
      <ul className="grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
        {MENU.map((m) => {
          const on = isActive(m.href);
          return (
            <li key={m.href}>
              <Link href={m.href} className={`flex flex-col items-center gap-1 py-3 text-xs ${on ? "text-accent" : "text-muted"}`}>
                <span className={`h-1 w-1 rounded-full ${on ? "bg-accent" : "bg-transparent"}`} />
                <span className={on ? "font-semibold" : ""}>{m.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
