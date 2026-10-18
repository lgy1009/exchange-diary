// 날짜 계산 도우미. 날짜는 "YYYY-MM-DD" 글자로 다룬다. (시간대 오차를 피하려고 하루 단위만 쓴다)

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

// 노션 날짜("2027-03-14" 또는 "2027-03-14T09:00:00.000+01:00")에서 날짜 부분만
export function dayOf(value: string): string {
  return value.slice(0, 10);
}

// 그 시간대의 오늘 날짜
export function todayIn(timeZone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function toUtc(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(day: string, n: number): string {
  return new Date(toUtc(day) + n * 86400000).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / 86400000);
}

export function weekdayOf(day: string): (typeof WEEKDAYS)[number] {
  return WEEKDAYS[new Date(toUtc(day)).getUTCDay()];
}

// 그 주의 월요일~일요일 7일
export function weekOf(day: string): string[] {
  const offset = (new Date(toUtc(day)).getUTCDay() + 6) % 7; // 월요일 = 0
  const monday = addDays(day, -offset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

// "3.14" 모양
export function short(day: string): string {
  const [, m, d] = day.split("-").map(Number);
  return `${m}.${d}`;
}

// "3.14 – 3.16" 또는 "3.14"
export function rangeLabel(start: string, end: string | null): string {
  const s = dayOf(start);
  const e = end ? dayOf(end) : null;
  return e && e !== s ? `${short(s)} – ${short(e)}` : short(s);
}

// 날짜(기간)가 그 날을 포함하는지
export function covers(start: string, end: string | null, day: string): boolean {
  const s = dayOf(start);
  const e = end ? dayOf(end) : s;
  return s <= day && day <= e;
}

// 학기 진행 상태
export type SemesterState =
  | { phase: "before"; daysLeft: number }
  | { phase: "during"; percent: number; day: number; total: number }
  | { phase: "after" };

export function semesterState(start: string, end: string, today: string): SemesterState {
  if (today < start) return { phase: "before", daysLeft: daysBetween(today, start) };
  if (today > end) return { phase: "after" };
  const total = daysBetween(start, end) + 1;
  const day = daysBetween(start, today) + 1;
  return { phase: "during", percent: Math.round((day / total) * 100), day, total };
}
