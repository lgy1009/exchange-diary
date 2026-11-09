// 한 학기 결산 — 노션 기록으로 숫자를 자동 계산한다. 학기가 끝나기 전에는 "지금까지" 결산으로 보인다.
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { REVALIDATE_SECONDS, SCHOOL, SITE } from "@/lib/config";
import { getDiaryData } from "@/lib/diary-data";
import { rangeLabel, semesterState, short, todayIn } from "@/lib/dates";
import { recapOf, type Ranked } from "@/lib/recap";
import { isUnlocked } from "@/lib/viewer";
import type { Trip } from "@/lib/types";
import { Flag } from "../flag";

export const metadata: Metadata = { title: "한 학기 결산" };

export default function RecapPage() {
  return (
    <Suspense fallback={<p className="card text-sm text-muted">불러오는 중…</p>}>
      <RecapLoader />
    </Suspense>
  );
}

async function RecapLoader() {
  return <RecapContent unlocked={await isUnlocked()} />;
}

async function RecapContent({ unlocked }: { unlocked: boolean }) {
  "use cache";
  cacheLife({ stale: 60, revalidate: REVALIDATE_SECONDS, expire: 3600 });

  const data = await getDiaryData(unlocked);
  const r = recapOf(data, SCHOOL.semesterStart, SCHOOL.semesterEnd);
  const s = semesterState(SCHOOL.semesterStart, SCHOOL.semesterEnd, todayIn(SCHOOL.timeZone));
  const heading =
    s.phase === "after" ? "한 학기 결산" : s.phase === "during" ? `지금까지의 결산 · D+${s.day}` : "결산 미리보기";
  const maxMonth = Math.max(1, ...r.months.map((m) => m.count));

  return (
    <div className="flex flex-col gap-2.5">
      {/* 표지 */}
      <section className="card !bg-paper text-center">
        <p className="dot text-xs text-muted">
          SEMESTER RECAP · {SCHOOL.city.toUpperCase()} {SCHOOL.semesterStart.slice(0, 4)}
        </p>
        <h1 className="mt-2 text-xl font-bold text-sea sm:text-2xl">{heading}</h1>
        <p className="label mt-1">
          {SITE.profileName}의 {SCHOOL.semesterStart.replaceAll("-", ".")} ~ {SCHOOL.semesterEnd.replaceAll("-", ".")}
        </p>
        {s.phase === "before" && <p className="mt-3 text-sm text-muted">출발 전이에요. 기록이 쌓이면 여기 숫자가 저절로 채워져요.</p>}
        {!unlocked && <p className="label mt-2">공개한 기록만 셌어요.</p>}
      </section>

      {/* 큰 숫자 */}
      <section className="card">
        <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
          <Big n={r.stats.countryCount} en="countries" ko="나라" />
          <Big n={r.stats.cityCount} en="cities" ko="도시" />
          <Big n={r.tripCount} en="trips" ko="여행" />
          <Big n={r.travelDays} en="days" ko="여행한 날" />
          <Big n={r.stats.entryCount} en="diaries" ko="일기" />
          <Big n={r.guestCount} en="guests" ko="방명록" />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {/* 여행 하이라이트 */}
        <section className="card">
          <div className="card-head">
            <h2 className="label">여행 하이라이트</h2>
          </div>
          <dl className="flex flex-col gap-2.5 text-sm">
            <TripRow label="가장 긴 여행" trip={r.longestTrip?.trip ?? null} extra={r.longestTrip ? `${r.longestTrip.days}일` : ""} />
            <TripRow label="첫 여행" trip={r.firstTrip} />
            <TripRow label="마지막 여행" trip={r.lastTrip} />
          </dl>
        </section>

        {/* 기분·태그 */}
        <section className="card">
          <div className="card-head">
            <h2 className="label">가장 많이 느낀 기분</h2>
          </div>
          <RankList items={r.moods} empty="일기에 기분을 고르면 여기 모여요." chip="chip chip-pink" />
          <div className="card-head mt-4">
            <h2 className="label">자주 쓴 태그</h2>
          </div>
          <RankList items={r.tags} empty="일기에 태그를 달면 여기 모여요." chip="chip" prefix="#" />
        </section>
      </div>

      {/* 달마다 쓴 일기 */}
      <section className="card">
        <div className="card-head">
          <h2 className="label">달마다 쓴 일기</h2>
        </div>
        <div className="flex h-32 items-end gap-2">
          {r.months.map((m) => (
            <div key={m.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="dot text-[10px] text-terracotta">{m.count || ""}</span>
              <div className="w-full max-w-10 border border-line bg-sea" style={{ height: `${(m.count / maxMonth) * 80}%`, minHeight: 2 }} />
              <span className="dot text-[10px] text-muted">{Number(m.month.slice(5))}월</span>
            </div>
          ))}
        </div>
      </section>

      {/* 모은 우표 */}
      <section className="card">
        <div className="card-head">
          <h2 className="label">모은 우표 {r.stats.countryCount}장</h2>
          <Link href="/stamps" className="label hover:text-sea">
            more +
          </Link>
        </div>
        {r.stats.stamps.length === 0 && <p className="label">아직 모은 우표가 없어요.</p>}
        <div className="flex flex-wrap gap-1.5">
          {r.stats.stamps.map((st) => (
            <Link key={st.code} href={`/map/${st.code.toLowerCase()}`} className="stamp hover:bg-terracotta hover:text-white" title={st.name}>
              <Flag code={st.code} width={15} /> {st.name} {st.firstVisit ? short(st.firstVisit) : ""}
            </Link>
          ))}
        </div>
        <p className="label mt-3">사진 {r.photoCount}장을 남겼어요.</p>
      </section>
    </div>
  );
}

function Big({ n, en, ko }: { n: number; en: string; ko: string }) {
  return (
    <div className="border border-line bg-paper py-3">
      <p className="display text-3xl text-sea">{n}</p>
      <p className="dot text-[10px] text-muted">{en}</p>
      <p className="label">{ko}</p>
    </div>
  );
}

function TripRow({ label, trip, extra = "" }: { label: string; trip: Trip | null; extra?: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="label w-20 shrink-0">{label}</dt>
      <dd className="min-w-0 flex-1 truncate">
        {trip ? (
          <Link href={`/trips/${trip.id}`} className="hover:text-sea">
            {trip.title}
            <span className="dot ml-1.5 text-xs text-terracotta">
              {trip.period ? rangeLabel(trip.period.start, trip.period.end) : ""} {extra}
            </span>
          </Link>
        ) : (
          <span className="text-muted">아직 없어요</span>
        )}
      </dd>
    </div>
  );
}

function RankList({ items, empty, chip, prefix = "" }: { items: Ranked[]; empty: string; chip: string; prefix?: string }) {
  if (items.length === 0) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <li key={it.name} className={chip}>
          {prefix}
          {it.name} <span className="dot text-[10px] opacity-70">×{it.count}</span>
        </li>
      ))}
    </ul>
  );
}
