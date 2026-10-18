// 지도·여권 도장용 숫자 계산. 화면에 넘어가는(이미 걸러진) 데이터만 받는다.
// 그래서 비밀번호 없이 볼 때는 공개된 여행·일기만 숫자에 들어간다.

import { nameOf, type CountryCode } from "./countries";
import { dayOf } from "./dates";
import { isLocked } from "./transform";
import type { DiaryData } from "./types";

export type Stamp = {
  code: CountryCode;
  name: string;
  firstVisit: string | null; // "YYYY-MM-DD"
  trips: number;
  entries: number;
};

export type TravelStats = {
  stamps: Stamp[]; // 처음 간 날짜 순
  countryCount: number;
  cityCount: number;
  entryCount: number; // 공개(또는 열린) 일기 수
};

export function travelStats(data: Pick<DiaryData, "trips" | "entries">): TravelStats {
  const map = new Map<CountryCode, Stamp>();
  const touch = (code: CountryCode, day: string | null, kind: "trips" | "entries") => {
    const s = map.get(code) ?? { code, name: nameOf(code), firstVisit: null, trips: 0, entries: 0 };
    s[kind] += 1;
    if (day && (!s.firstVisit || day < s.firstVisit)) s.firstVisit = day;
    map.set(code, s);
  };

  const cities = new Set<string>();
  for (const t of data.trips) {
    const day = t.period ? dayOf(t.period.start) : null;
    for (const code of t.countries) touch(code, day, "trips");
    // "리스본, 포르투"처럼 쉼표로 여러 도시를 적어도 하나씩 센다
    for (const city of t.place.split(/[,·/]/)) if (city.trim()) cities.add(city.trim());
  }
  let entryCount = 0;
  for (const e of data.entries) {
    if (isLocked(e)) continue;
    entryCount += 1;
    touch(e.country, e.date ? dayOf(e.date.start) : null, "entries");
  }

  const stamps = [...map.values()].sort((a, b) => (a.firstVisit ?? "9999").localeCompare(b.firstVisit ?? "9999"));
  return { stamps, countryCount: stamps.length, cityCount: cities.size, entryCount };
}
