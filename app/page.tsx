// 홈 (DESIGN §1) — 큰 제목, 학기 진행률, 이번 주, 가장 최근 여행 1건, 최근 일기 3건
import Link from "next/link";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { REVALIDATE_SECONDS, SCHOOL } from "@/lib/config";
import { getDiaryData } from "@/lib/diary-data";
import { covers, dayOf, rangeLabel, semesterState, short, todayIn, weekOf, weekdayOf } from "@/lib/dates";
import { isLocked } from "@/lib/transform";
import { isUnlocked } from "@/lib/viewer";
import type { Course, EventItem, Trip } from "@/lib/types";

export default function HomePage() {
  return (
    <Suspense fallback={<p className="py-24 text-sm text-muted">불러오는 중…</p>}>
      <HomeLoader />
    </Suspense>
  );
}

async function HomeLoader() {
  return <HomeContent unlocked={await isUnlocked()} />;
}

// 노션 데이터와 "오늘" 계산을 함께 REVALIDATE_SECONDS 동안 재사용한다
async function HomeContent({ unlocked }: { unlocked: boolean }) {
  "use cache";
  cacheLife({ stale: 60, revalidate: REVALIDATE_SECONDS, expire: 3600 });

  const data = await getDiaryData(unlocked);
  const today = todayIn(SCHOOL.timeZone);
  const week = weekOf(today);
  const trip = pickTrip(data.trips, today);
  const recent = data.entries.slice(0, 3);

  return (
    <div className="flex flex-col gap-16 pt-6 sm:gap-24 sm:pt-12">
      <Hero today={today} />

      <section>
        <SectionHead en="This Week" ko="이번 주" />
        <Week days={week} today={today} events={data.events} courses={data.courses} />
        {!unlocked && <p className="mt-3 text-xs text-muted">수업과 비공개 일정은 잠금 해제 후 보입니다.</p>}
      </section>

      <section>
        <SectionHead en={trip && dayOf(trip.period?.start ?? "") > today ? "Next Trip" : "Latest Trip"} ko="여행" more="/trips" />
        {trip ? <TripFeature trip={trip} /> : <Empty>아직 공개된 여행이 없습니다.</Empty>}
      </section>

      <section>
        <SectionHead en="Recent Diary" ko="최근 일기" more="/diary" />
        {recent.length === 0 ? (
          <Empty>아직 일기가 없습니다.</Empty>
        ) : (
          <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-3">
            {recent.map((e) => (
              <li key={e.id}>
                <Link href={`/diary/${e.id}`} className="group block">
                  {isLocked(e) ? (
                    <>
                      <div className="flex aspect-[4/3] items-center justify-center rounded-[2px] bg-soft text-2xl">🔒</div>
                      <p className="eyebrow mt-4 !text-accent">{e.date ? short(dayOf(e.date.start)) : ""}</p>
                      <p className="mt-1 text-muted">비공개 일기</p>
                    </>
                  ) : (
                    <>
                      <Cover label={e.title} />
                      <p className="eyebrow mt-4 !text-accent">
                        {e.date ? short(dayOf(e.date.start)) : ""}
                        {e.mood ? `  ·  ${e.mood}` : ""}
                      </p>
                      <p className="mt-1 text-lg font-semibold leading-snug group-hover:text-accent">{e.title}</p>
                      {e.place && <p className="mt-1 text-sm text-muted">{e.place}</p>}
                    </>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ---- 큰 제목 + 학기 진행률 ----
function Hero({ today }: { today: string }) {
  const s = semesterState(SCHOOL.semesterStart, SCHOOL.semesterEnd, today);
  const percent = s.phase === "during" ? s.percent : s.phase === "after" ? 100 : 0;
  return (
    <section>
      <p className="eyebrow">
        {SCHOOL.name}
        {SCHOOL.country ? ` · ${SCHOOL.country}` : ""}
      </p>
      <h1 className="display mt-4 text-[clamp(3rem,11vw,8.5rem)]">
        ONE
        <br />
        SEMESTER<span className="text-accent">.</span>
      </h1>
      <div className="mt-10 flex items-end justify-between gap-4 border-b border-ink pb-3">
        <p className="tabular text-sm">
          {short(SCHOOL.semesterStart)} — {short(SCHOOL.semesterEnd)}
        </p>
        <p className="tabular text-sm">
          {s.phase === "before" && (
            <>
              출발까지 <b className="text-accent">D-{s.daysLeft}</b>
            </>
          )}
          {s.phase === "during" && (
            <>
              <b className="text-accent">{s.day}</b>일째 / {s.total}일 · {s.percent}%
            </>
          )}
          {s.phase === "after" && "학기 끝 · 수고했어요"}
        </p>
      </div>
      <div className="h-[3px] bg-line">
        <div className="h-full bg-accent" style={{ width: `${percent}%` }} />
      </div>
    </section>
  );
}

// ---- 이번 주 (월~일) ----
function Week({ days, today, events, courses }: { days: string[]; today: string; events: EventItem[]; courses: Course[] }) {
  return (
    <ol className="grid border-t border-line sm:grid-cols-7">
      {days.map((day) => {
        const wd = weekdayOf(day);
        const dayEvents = events.filter((e) => e.date && covers(e.date.start, e.date.end, day));
        const dayCourses = courses.filter((c) => c.days.includes(wd)).sort((a, b) => a.start.localeCompare(b.start));
        const isToday = day === today;
        return (
          <li
            key={day}
            className="flex gap-4 border-b border-line py-3 sm:min-h-40 sm:flex-col sm:gap-2 sm:border-b-0 sm:border-r sm:px-3 sm:py-4 sm:last:border-r-0"
          >
            <p className={`w-24 shrink-0 whitespace-nowrap sm:w-auto ${isToday ? "text-accent" : ""}`}>
              <span className="tabular text-lg font-bold">{short(day)}</span>{" "}
              <span className="text-xs">{wd}</span>
              {isToday && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle" aria-label="오늘" />}
            </p>
            <ul className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm">
              {dayEvents.map((e) => (
                <li key={e.id} className="border-l-2 border-accent pl-2 leading-snug">
                  {e.name}
                  {e.kind && <span className="ml-1 text-xs text-muted">{e.kind}</span>}
                </li>
              ))}
              {dayCourses.map((c) => (
                <li key={c.id} className="border-l-2 border-line pl-2 leading-snug text-muted">
                  <span className="tabular text-xs">{c.start}</span> {c.name}
                </li>
              ))}
              {dayEvents.length + dayCourses.length === 0 && <li className="text-line sm:hidden">—</li>}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}

// ---- 여행 1건 (오늘 이전에 시작한 것 중 가장 최근, 없으면 가장 가까운 예정) ----
function pickTrip(trips: Trip[], today: string): Trip | null {
  const dated = trips.filter((t) => t.period);
  const past = dated.find((t) => dayOf(t.period!.start) <= today);
  if (past) return past;
  return [...dated].sort((a, b) => a.period!.start.localeCompare(b.period!.start))[0] ?? trips[0] ?? null;
}

function TripFeature({ trip }: { trip: Trip }) {
  return (
    <Link href={`/trips/${trip.id}`} className="group grid gap-6 sm:grid-cols-[3fr_2fr] sm:gap-10">
      <Cover label={trip.place || trip.title} wide />
      <div className="flex flex-col justify-end">
        <p className="eyebrow !text-accent">{trip.period ? rangeLabel(trip.period.start, trip.period.end) : ""}</p>
        <h3 className="mt-2 text-2xl font-bold leading-tight group-hover:text-accent sm:text-3xl">{trip.title}</h3>
        {trip.place && <p className="mt-2 text-muted">{trip.place}</p>}
        {trip.summary && <p className="mt-4 leading-relaxed">{trip.summary}</p>}
      </div>
    </Link>
  );
}

// ---- 공통 조각 ----
function SectionHead({ en, ko, more }: { en: string; ko: string; more?: string }) {
  return (
    <div className="mb-6 flex items-baseline justify-between">
      <h2 className="flex items-baseline gap-3">
        <span className="display text-3xl sm:text-4xl">{en}</span>
        <span className="text-sm text-muted">{ko}</span>
      </h2>
      {more && (
        <Link href={more} className="eyebrow hover:text-accent">
          All →
        </Link>
      )}
    </div>
  );
}

// 사진 자리 (실제 사진은 작업 5의 사진 경로가 생기면 넣는다)
function Cover({ label, wide = false }: { label: string; wide?: boolean }) {
  return (
    <div
      className={`flex items-end overflow-hidden rounded-[2px] bg-soft p-5 ${wide ? "aspect-[3/2]" : "aspect-[4/3]"}`}
    >
      <span className="display line-clamp-2 text-3xl text-ink/15 sm:text-4xl">{label}</span>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="border-t border-line py-8 text-sm text-muted">{children}</p>;
}
