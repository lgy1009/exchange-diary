import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import localFont from "next/font/local";
import { SCHOOL } from "@/lib/config";
import { SiteHeader, BottomNav } from "./site-nav";
import "./globals.css";

// 영문·숫자는 Manrope, 한글은 Pretendard (글꼴 파일은 프로젝트 안에 두고 서버가 직접 내려 준다)
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Exchange Diary", template: "%s · Exchange Diary" },
  description: `${SCHOOL.name} 교환학생 한 학기의 일정·여행·일기`,
  robots: { index: false, follow: false }, // 개인 사이트라 검색엔진에 올리지 않는다
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${manrope.variable} ${pretendard.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-[1100px] flex-1 px-5 pb-28 sm:px-8 sm:pb-20">{children}</main>
        <footer className="mx-auto hidden w-full max-w-[1100px] border-t border-line px-8 py-8 text-xs text-muted sm:block">
          기록은 노션에, 보기는 여기에.
        </footer>
        <BottomNav />
      </body>
    </html>
  );
}
