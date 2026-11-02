// 유럽 지도 (DESIGN §1 /map) — 다녀온 나라 색칠, 나라를 누르면 나라 페이지
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { REVALIDATE_SECONDS } from "@/lib/config";
import { getDiaryData } from "@/lib/diary-data";
import { short } from "@/lib/dates";
import { travelStats, tripPoints, visitsOf } from "@/lib/stats";
import { isUnlocked } from "@/lib/viewer";
import { EuropeMap } from "../europe-map";
import { PassportStamp } from "../passport-stamp";

export const metadata: Metadata = { title: "지도" };

export default function MapPage() {
  return (
    <Suspense fallback={<p className="card text-sm text-muted">불러오는 중…</p>}>
      <MapLoader />
    </Suspense>
  );
}

async function MapLoader() {
  return <MapContent unlocked={await isUnlocked()} />;
}

async function MapContent({ unlocked }: { unlocked: boolean }) {
  "use cache";
  cacheLife({ stale: 60, revalidate: REVALIDATE_SECONDS, expire: 3600 });

  const data = await getDiaryData(unlocked);
  const stats = travelStats(data);

  return (
    <div className="grid items-start gap-2.5 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <section className="card">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-lg font-semibold">
            다녀온 나라 <span className="display text-sea">{stats.countryCount}</span>
          </h1>
          <p className="label">진한 색은 두 번 이상 · 나라를 누르면 기록이 나와요</p>
        </div>
        <EuropeMap visits={visitsOf(stats)} points={tripPoints(data.trips)} labels />
      </section>

      <section className="card">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="label">나라별 기록</h2>
          <Link href="/stamps" className="label hover:text-sea">
            여권 도장 →
          </Link>
        </div>
        {stats.stamps.length === 0 && <p className="text-sm text-muted">아직 다녀온 나라가 없어요.</p>}
        <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
          {stats.stamps.map((s) => (
            <li key={s.code}>
              <Link href={`/map/${s.code.toLowerCase()}`} className="flex items-center gap-3 border border-line bg-paper p-3 hover:bg-sand-pale">
                <PassportStamp code={s.code} name={s.name} date={s.firstVisit} size={46} mini />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{s.name}</span>
                  <span className="label">
                    {s.firstVisit ? `${short(s.firstVisit)} 첫 방문 · ` : ""}여행 {s.trips} · 일기 {s.entries}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
