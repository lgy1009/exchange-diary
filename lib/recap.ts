// 한 학기 결산 숫자 계산. 화면에 넘어가는(이미 걸러진) 데이터만 받는다.
// 그래서 비밀번호 없이 볼 때는 공개된 여행·일기만 결산에 들어간다.

import { dayOf, daysBetween } from "./dates";
import { travelStats, type TravelStats } from "./stats";
import { isLocked } from "./transform";
import type { DiaryData, Entry, Trip } from "./types";

export type Ranked = { name: string; count: number };

export type Recap = {
  stats: TravelStats;
  tripCount: number;
  photoCount: number; // 대표 사진이 있는 여행·일기 수
  guestCount: number; // 승인된 방명록 수
  travelDays: number; // 여행 기간을 모두 더한 날 수
  moods: Ranked[]; // 가장 많이 쓴 기분 (최대 3개)
  tags: Ranked[]; // 가장 많이 쓴 태그 (최대 5개)
  months: { month: string; count: number }[]; // 달마다 쓴 일기 수 (학기 달 전부)
  longestTrip: { trip: Trip; days: number } | null;
  firstTrip: Trip | null;
  lastTrip: Trip | null;
};

function lengthOf(t: Trip): number {
  if (!t.period) return 0;
  return daysBetween(dayOf(t.period.start), dayOf(t.period.end ?? t.period.start)) + 1;
}

function rank(names: string[], limit: number): Ranked[] {
  const counts = new Map<string, number>();
  for (const n of names) counts.set(n, (counts.get(n) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

// 학기 시작 달부터 끝 달까지 "YYYY-MM" 목록
function monthsBetween(start: string, end: string): string[] {
  const out: string[] = [];
  let [y, m] = start.slice(0, 7).split("-").map(Number);
  const last = end.slice(0, 7);
  while (out.length < 24) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    out.push(key);
    if (key >= last) break;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

export function recapOf(data: DiaryData, semesterStart: string, semesterEnd: string): Recap {
  const entries = data.entries.filter((e): e is Entry => !isLocked(e));
  const dated = data.trips.filter((t) => t.period).sort((a, b) => a.period!.start.localeCompare(b.period!.start));

  let longestTrip: Recap["longestTrip"] = null;
  for (const t of dated) {
    const days = lengthOf(t);
    if (!longestTrip || days > longestTrip.days) longestTrip = { trip: t, days };
  }

  const perMonth = new Map<string, number>();
  for (const e of entries) if (e.date) perMonth.set(e.date.start.slice(0, 7), (perMonth.get(e.date.start.slice(0, 7)) ?? 0) + 1);

  return {
    stats: travelStats(data),
    tripCount: data.trips.length,
    photoCount: data.trips.filter((t) => t.hasCover).length + entries.filter((e) => e.hasCover).length,
    guestCount: data.guestbook.length,
    travelDays: dated.reduce((sum, t) => sum + lengthOf(t), 0),
    moods: rank(entries.flatMap((e) => (e.mood ? [e.mood] : [])), 3),
    tags: rank(entries.flatMap((e) => e.tags), 5),
    months: monthsBetween(semesterStart, semesterEnd).map((month) => ({ month, count: perMonth.get(month) ?? 0 })),
    longestTrip,
    firstTrip: dated[0] ?? null,
    lastTrip: dated[dated.length - 1] ?? null,
  };
}
