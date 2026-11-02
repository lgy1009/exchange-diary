// 여권 도장 (DESIGN §1 /stamps) — 나라별 첫 방문 도장과 한 학기 숫자
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { REVALIDATE_SECONDS, SCHOOL } from "@/lib/config";
import { getDiaryData } from "@/lib/diary-data";
import { travelStats } from "@/lib/stats";
import { isUnlocked } from "@/lib/viewer";
import { PassportStamp } from "../passport-stamp";

export const metadata: Metadata = { title: "여권 도장" };

export default function StampsPage() {
  return (
    <Suspense fallback={<p className="card text-sm text-muted">불러오는 중…</p>}>
      <StampsLoader />
    </Suspense>
  );
}

async function StampsLoader() {
  return <StampsContent unlocked={await isUnlocked()} />;
}

async function StampsContent({ unlocked }: { unlocked: boolean }) {
  "use cache";
  cacheLife({ stale: 60, revalidate: REVALIDATE_SECONDS, expire: 3600 });

  const stats = travelStats(await getDiaryData(unlocked));

  return (
    <div className="flex flex-col gap-2.5">
      <section className="card">
        <p className="dot text-xs text-muted">PASSPORT · {SCHOOL.city.toUpperCase()} {SCHOOL.semesterStart.slice(0, 4)}</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            [stats.countryCount, "countries", "나라"],
            [stats.cityCount, "cities", "도시"],
            [stats.entryCount, "diaries", "일기"],
          ].map(([n, en, ko]) => (
            <div key={en} className="border border-line bg-paper py-3">
              <p className="display text-3xl text-sea">{n}</p>
              <p className="dot text-[10px] text-muted">{en}</p>
              <p className="label">{ko}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card min-h-64 bg-[repeating-linear-gradient(0deg,transparent,transparent_27px,var(--line)_28px)]">
        {stats.stamps.length === 0 && <p className="text-sm text-muted">아직 찍힌 도장이 없어요. 첫 여행을 떠나 보세요!</p>}
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 py-2 sm:grid-cols-3 md:grid-cols-4">
          {stats.stamps.map((s) => (
            <li key={s.code} className="flex justify-center">
              <Link
                href={`/map/${s.code.toLowerCase()}`}
                className="transition-transform hover:scale-105"
                title={`${s.name} — 여행 ${s.trips} · 일기 ${s.entries}`}
              >
                <PassportStamp code={s.code} name={s.name} date={s.firstVisit} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
