// 학기 달력 계산 (내 일정). 노션을 부르지 않는 순수한 함수만 둔다.
import { addDays, covers, weekdayOf } from "./dates";
import type { Course, EventItem, Trip } from "./types";

export type CalendarDay = {
  day: string; // YYYY-MM-DD
  inMonth: boolean;
  courses: Course[];
  events: EventItem[];
  trips: Trip[];
  clash: boolean; // 수업이 있는 날에 여행이 겹침
};

// "2027-03" 같은 글자가 맞는지 확인하고, 아니면 null
export function parseMonth(raw: string | null | undefined): string | null {
  return raw && /^\d{4}-(0[1-9]|1[0-2])$/.test(raw) ? raw : null;
}

export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

// 월요일로 시작하는 주 단위 달력 (앞뒤 달 날짜로 칸을 채운다)
export function monthDays(
  ym: string,
  data: { courses: Course[]; events: EventItem[]; trips: Trip[] },
  semester: { start: string; end: string },
): CalendarDay[][] {
  const first = `${ym}-01`;
  const offset = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
  let day = addDays(first, -offset);
  const weeks: CalendarDay[][] = [];
  do {
    const week: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const inSemester = semester.start <= day && day <= semester.end;
      const courses = inSemester ? data.courses.filter((c) => c.days.includes(weekdayOf(day))) : [];
      const events = data.events.filter((e) => e.date && covers(e.date.start, e.date.end, day));
      const trips = data.trips.filter((t) => t.period && covers(t.period.start, t.period.end, day));
      week.push({
        day,
        inMonth: day.startsWith(ym),
        courses: [...courses].sort((a, b) => a.start.localeCompare(b.start)),
        events,
        trips,
        clash: courses.length > 0 && trips.length > 0,
      });
      day = addDays(day, 1);
    }
    weeks.push(week);
  } while (day.startsWith(ym));
  return weeks;
}
