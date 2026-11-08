import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { SCHOOL, SITE } from "@/lib/config";
import { Suspense } from "react";
import { BottomNav, BottomNavView, LockLink, SideTabs, SideTabsView } from "./site-nav";
import "./globals.css";

// 본문·제목 Pretendard, 미니홈피 글자 Galmuri (한글까지 도트, SIL OFL 무료 글꼴)
// 글꼴 파일은 빌드할 때 프로젝트에 담겨 서버가 직접 내려 준다.
const galmuri = localFont({
  src: [
    { path: "./fonts/Galmuri11.woff2", weight: "400" },
    { path: "./fonts/Galmuri11-Bold.woff2", weight: "700" },
  ],
  variable: "--font-galmuri",
  display: "swap",
});

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: SITE.title, template: `%s · ${SITE.title}` },
  // 카카오톡 등에서 링크를 공유할 때 보이는 제목 (설명 문구는 일부러 넣지 않는다)
  openGraph: { title: SITE.title, type: "website", locale: "ko_KR" },
  robots: { index: false, follow: false }, // 개인 사이트라 검색엔진에 올리지 않는다
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${galmuri.variable} ${pretendard.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="mx-auto w-full max-w-[1100px] px-2.5 pt-4 pb-28 sm:px-6 sm:pt-8 md:pb-12">
          <div className="relative">
            <div className="frame md:mr-[66px]">
              <header className="flex items-center justify-between border-b border-dashed border-sea-soft px-3 py-2 text-sea">
                <Link href="/" className="font-sans text-lg font-bold whitespace-nowrap sm:text-2xl">
                  {SITE.title}
                </Link>
                <span className="flex items-center gap-3">
                  <span className="dot hidden text-xs whitespace-nowrap text-muted sm:inline">
                    {SCHOOL.city.toUpperCase()} · {SCHOOL.semesterStart.slice(0, 4)}
                  </span>
                  <LockLink />
                </span>
              </header>
              <main className="dot p-2 text-[13px] sm:p-2.5">{children}</main>
            </div>
            <Suspense fallback={<SideTabsView />}>
              <SideTabs />
            </Suspense>
          </div>
        </div>
        <Suspense fallback={<BottomNavView />}>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  );
}
