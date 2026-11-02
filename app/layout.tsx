import type { Metadata } from "next";
import { DotGothic16, Manrope } from "next/font/google";
import localFont from "next/font/local";
import Link from "next/link";
import { OWNER, SCHOOL } from "@/lib/config";
import { Suspense } from "react";
import { BottomNav, BottomNavView, LockLink, SideTabs, SideTabsView } from "./site-nav";
import "./globals.css";

// 본문 한글 Pretendard, 영문 제목·숫자 Manrope, 미니홈피 장식 DotGothic16 (영문·숫자만 들어 있다)
// 글꼴 파일은 빌드할 때 프로젝트에 담겨 서버가 직접 내려 준다.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  display: "swap",
});

const dotGothic = DotGothic16({
  variable: "--font-dotgothic",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${OWNER.name}의 말라가 다이어리`, template: `%s · ${OWNER.name}의 말라가 다이어리` },
  description: `${SCHOOL.nameKo} 교환학생 한 학기의 여행·일기·사진`,
  robots: { index: false, follow: false }, // 개인 사이트라 검색엔진에 올리지 않는다
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${manrope.variable} ${dotGothic.variable} ${pretendard.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="mx-auto w-full max-w-[1100px] px-2.5 pt-4 pb-28 sm:px-6 sm:pt-8 md:pb-12">
          <div className="relative">
            <div className="frame md:mr-[72px]">
              <header className="flex items-center justify-between border-b-2 border-ink bg-sea px-3 py-2 text-white">
                <Link href="/" className="dot text-base sm:text-lg">
                  {OWNER.en}.MÁLAGA
                </Link>
                <span className="flex items-center gap-3">
                  <span className="dot text-xs">
                    {SCHOOL.city.toUpperCase()} · {SCHOOL.semesterStart.slice(0, 4)}
                  </span>
                  <LockLink />
                </span>
              </header>
              <main className="p-2 sm:p-2.5">{children}</main>
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
