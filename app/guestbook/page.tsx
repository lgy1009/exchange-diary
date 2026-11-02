// 방명록 (DESIGN §1 /guestbook) — 승인된 글 목록 + 쓰기 칸
import type { Metadata } from "next";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { REVALIDATE_SECONDS, SCHOOL } from "@/lib/config";
import { getDiaryData } from "@/lib/diary-data";
import { short, todayIn } from "@/lib/dates";
import { GuestbookForm } from "./guestbook-form";

export const metadata: Metadata = { title: "방명록" };

export default function GuestbookPage() {
  return (
    <div className="grid items-start gap-2.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div className="flex flex-col gap-2.5 md:sticky md:top-4">
        <GuestbookForm />
        <p className="label px-1">남긴 글은 확인한 뒤에 보여요. 이메일·연락처는 받지 않아요.</p>
      </div>
      <Suspense fallback={<p className="card text-sm text-muted">불러오는 중…</p>}>
        <GuestbookList />
      </Suspense>
    </div>
  );
}

// 승인된 글만 들어 있다 (getDiaryData가 거른다)
async function GuestbookList() {
  "use cache";
  cacheLife({ stale: 60, revalidate: REVALIDATE_SECONDS, expire: 3600 });

  const { guestbook } = await getDiaryData(false);
  const thisYear = todayIn(SCHOOL.timeZone).slice(0, 4);

  return (
    <section className="flex flex-col gap-2">
      <h1 className="card flex items-baseline justify-between py-3">
        <span className="text-lg font-semibold">
          방명록 <span className="display text-sea">{guestbook.length}</span>
        </span>
        <span className="dot text-xs text-muted">GUESTBOOK</span>
      </h1>
      {guestbook.length === 0 && <p className="card text-sm text-muted">첫 방명록을 남겨 주세요.</p>}
      <ul className="flex flex-col gap-2">
        {guestbook.map((g) => {
          // 다른 화면과 같은 "3.14" 모양 (말라가 시간 기준). 올해가 아니면 연도도 붙인다
          const day = g.createdAt ? todayIn(SCHOOL.timeZone, new Date(g.createdAt)) : "";
          const date = day ? (day.startsWith(thisYear) ? short(day) : `${day.slice(0, 4)}.${short(day)}`) : "";
          return (
            <li key={g.id} className="card">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-sea">{g.name}</span>
                <span className="dot text-xs text-muted">{date}</span>
              </div>
              <p className="mt-1.5 whitespace-pre-line break-words leading-relaxed">{g.message}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
