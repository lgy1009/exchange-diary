// 내 일정 (DESIGN §1 /calendar) — 수업(요일 반복)·일정·여행 달력, 수업과 여행이 겹치는 날 강조.
// 비밀번호를 푼 경우에만 데이터를 읽는다. 잠긴 상태에서는 노션을 부르지도 않는다.
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { REVALIDATE_SECONDS, SCHOOL } from "@/lib/config";
import { monthDays, parseMonth, shiftMonth } from "@/lib/calendar";
import { getDiaryData } from "@/lib/diary-data";
import { dayOf, rangeLabel, short, todayIn } from "@/lib/dates";
import { isUnlocked } from "@/lib/viewer";

export const metadata: Metadata = { title: "내 일정" };

export default function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  return (
    <Suspense fallback={<p className="card text-sm text-muted">불러오는 중…</p>}>
      <CalendarLoader searchParams={searchParams} />
    </Suspense>
  );
}

async function CalendarLoader({ searchParams }: { searchParams: PageProps<"/calendar">["searchParams"] }) {
  if (!(await isUnlocked())) {
    return (
      <div className="card mx-auto flex max-w-xl flex-col items-center py-14 text-center">
        <p className="text-4xl">🔒</p>
        <h1 className="mt-3 text-lg font-semibold">내 일정은 비공개예요</h1>
        <p className="label mt-1">비밀번호를 입력하면 볼 수 있어요.</p>
        <Link href="/unlock?next=/calendar" className="mt-6 rounded-full bg-sea px-5 py-2 text-sm text-white hover:bg-sea/90">
          비밀번호 입력
        </Link>
      </div>
    );
  }
  const m = (await searchParams).m;
  const ym = parseMonth(typeof m === "string" ? m : null) ?? todayIn(SCHOOL.timeZone).slice(0, 7);
  return <CalendarContent ym={ym} />;
}

const WEEK = ["월", "화", "수", "목", "금", "토", "일"];

// 이 함수는 비밀번호가 확인된 뒤에만 불린다 (위 Loader에서 확인)
async function CalendarContent({ ym }: { ym: string }) {
  "use cache";
  cacheLife({ stale: 60, revalidate: REVALIDATE_SECONDS, expire: 3600 });

  const data = await getDiaryData(true);
  const weeks = monthDays(ym, data, { start: SCHOOL.semesterStart, end: SCHOOL.semesterEnd });
  const today = todayIn(SCHOOL.timeZone);
  const [y, mo] = ym.split("-").map(Number);
  const inMonth = (start: string, end: string | null) => dayOf(start).slice(0, 7) <= ym && dayOf(end ?? start).slice(0, 7) >= ym;
  const monthEvents = data.events.filter((e) => e.date && inMonth(e.date.start, e.date.end));
  const monthTrips = data.trips.filter((t) => t.period && inMonth(t.period.start, t.period.end));
  const clashDays = weeks.flat().filter((d) => d.inMonth && d.clash);

  return (
    <div className="flex flex-col gap-2.5">
      <section className="card">
        <div className="flex items-center justify-between">
          <Link href={`/calendar?m=${shiftMonth(ym, -1)}`} className="dot rounded-full px-3 py-1 text-sm text-sea hover:bg-paper" aria-label="이전 달">
            ←
          </Link>
          <h1 className="text-center">
            <span className="display text-2xl text-sea">{y}.{String(mo).padStart(2, "0")}</span>
            <span className="label ml-2">내 일정</span>
          </h1>
          <Link href={`/calendar?m=${shiftMonth(ym, 1)}`} className="dot rounded-full px-3 py-1 text-sm text-sea hover:bg-paper" aria-label="다음 달">
            →
          </Link>
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-muted">
          <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-sea-soft" />수업</span>
          <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-sea" />일정</span>
          <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-terracotta" />여행</span>
          <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-pink" />수업·여행 겹침</span>
        </div>

        <div className="mt-4 grid grid-cols-7 text-center text-xs text-muted">
          {WEEK.map((w) => (
            <div key={w} className="pb-1">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((d) => (
            <div
              key={d.day}
              className={`min-h-14 rounded-lg p-1 text-left sm:min-h-24 sm:p-1.5 ${d.inMonth ? "bg-paper" : "bg-paper/40 text-muted/60"} ${
                d.clash ? "ring-2 ring-pink" : ""
              }`}
            >
              <p className={`dot text-xs ${d.day === today ? "inline-block rounded-full bg-sea px-1.5 text-white" : ""}`}>
                {Number(d.day.slice(8))}
              </p>
              {/* 휴대폰: 점 / 큰 화면: 이름 */}
              <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                {d.courses.length > 0 && <i className="h-1.5 w-1.5 rounded-full bg-sea-soft" />}
                {d.events.length > 0 && <i className="h-1.5 w-1.5 rounded-full bg-sea" />}
                {d.trips.length > 0 && <i className="h-1.5 w-1.5 rounded-full bg-terracotta" />}
              </div>
              <ul className="mt-1 hidden flex-col gap-0.5 text-[11px] leading-tight sm:flex">
                {d.trips.map((t) => (
                  <li key={t.id} className="truncate rounded bg-terracotta px-1 text-white">{t.title}</li>
                ))}
                {d.events.map((e) => (
                  <li key={e.id} className="truncate rounded bg-sea px-1 text-white">{e.name}</li>
                ))}
                {d.courses.slice(0, 2).map((c) => (
                  <li key={c.id} className="truncate text-sea">{c.start} {c.name}</li>
                ))}
                {d.courses.length > 2 && <li className="text-muted">+{d.courses.length - 2}</li>}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {clashDays.length > 0 && (
        <section className="card border-2 border-pink">
          <h2 className="text-sm font-semibold text-pink">수업과 여행이 겹치는 날 {clashDays.length}일</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {clashDays.map((d) => (
              <li key={d.day}>
                <span className="dot text-terracotta">{short(d.day)}</span> — {d.trips.map((t) => t.title).join(", ")} / 수업{" "}
                {d.courses.map((c) => `${c.start} ${c.name}`).join(", ")}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2 className="label mb-2">이번 달 일정·여행</h2>
        {monthEvents.length + monthTrips.length === 0 && <p className="text-sm text-muted">이번 달에는 일정이 없어요.</p>}
        <ul className="flex flex-col gap-1.5 text-sm">
          {monthTrips.map((t) => (
            <li key={t.id} className="flex gap-2">
              <span className="dot w-24 shrink-0 text-terracotta">{rangeLabel(t.period!.start, t.period!.end)}</span>
              <Link href={`/trips/${t.id}`} className="hover:text-sea">✈ {t.title}</Link>
              {!t.isPublic && <span className="label">🔒</span>}
            </li>
          ))}
          {monthEvents.map((e) => (
            <li key={e.id} className="flex gap-2">
              <span className="dot w-24 shrink-0 text-sea">{rangeLabel(e.date!.start, e.date!.end)}</span>
              <span>
                {e.name}
                {e.kind && <span className="label ml-1">{e.kind}</span>}
                {e.place && <span className="label ml-1">· {e.place}</span>}
              </span>
              {!e.isPublic && <span className="label">🔒</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
