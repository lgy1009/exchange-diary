// 여권 도장 (DESIGN §1 /stamps) — 나라별 첫 방문 도장과 한 학기 숫자
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { REVALIDATE_SECONDS, SCHOOL } from "@/lib/config";
import { getDiaryData } from "@/lib/diary-data";
import { travelStats } from "@/lib/stats";
import { isUnlocked } from "@/lib/viewer";

export const metadata: Metadata = { title: "여권 도장" };

// 도장마다 살짝 다른 기울기와 색 (같은 나라는 항상 같은 모양)
const TILTS = [-10, 6, -4, 12, -14, 3, 9, -7];
const INKS = ["var(--terracotta)", "var(--sea)", "var(--pink)"];

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
              <p className="dot text-xs text-muted">{en}</p>
              <p className="label">{ko}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card min-h-64 bg-[repeating-linear-gradient(0deg,transparent,transparent_27px,var(--line)_28px)]">
        {stats.stamps.length === 0 && <p className="text-sm text-muted">아직 찍힌 도장이 없어요. 첫 여행을 떠나 보세요!</p>}
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 py-2 sm:grid-cols-3 md:grid-cols-4">
          {stats.stamps.map((s, i) => {
            const ink = INKS[i % INKS.length];
            return (
              <li key={s.code} className="flex justify-center">
                <Link
                  href={`/map/${s.code.toLowerCase()}`}
                  className="flex h-32 w-32 flex-col items-center justify-center rounded-full border-[3px] border-double bg-card/70 text-center transition-transform hover:scale-105"
                  style={{ borderColor: ink, color: ink, transform: `rotate(${TILTS[i % TILTS.length]}deg)` }}
                  title={`${s.name} — 여행 ${s.trips} · 일기 ${s.entries}`}
                >
                  <span className="dot text-xs">ENTRY</span>
                  <span className="display text-3xl leading-none">{s.code}</span>
                  <span className="mt-1 text-xs font-semibold">{s.name}</span>
                  <span className="dot mt-0.5 text-xs">{s.firstVisit?.replaceAll("-", ".") ?? ""}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
