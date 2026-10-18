// 화면(서버 컴포넌트)이 데이터를 받는 유일한 입구.
// 노션에서 4개 데이터베이스를 읽어 사이트 모양으로 바꾸고, 보는 사람에 맞게 거른 뒤 돌려준다.
// 서버 코드에서만 쓴다. 비밀번호 확인 여부(unlocked)는 부르는 쪽이 쿠키로 판단해 넘긴다. (작업 7)

import { cacheLife } from "next/cache";
import { REVALIDATE_SECONDS } from "./config";
import { findDatabases, queryAll } from "./notion";
import { filterForViewer, sortRaw, toCourse, toEntry, toEvent, toTrip } from "./transform";
import type { DiaryData, Entry, LockedEntry, RawDiaryData, Trip } from "./types";

// 노션 원본(비공개 포함)을 읽어 서버 안에서만 REVALIDATE_SECONDS 동안 재사용한다.
// 이 함수의 결과는 화면에 바로 넘기지 않는다. 반드시 아래 함수들로 거른 뒤 쓴다.
async function loadRaw(): Promise<RawDiaryData> {
  "use cache";
  cacheLife({ stale: 60, revalidate: REVALIDATE_SECONDS, expire: 3600 });

  const dbs = await findDatabases();
  const read = async (id: string | undefined) => (id ? queryAll(id) : []);
  const [events, courses, trips, entries] = await Promise.all([
    read(dbs.events?.id),
    read(dbs.courses?.id),
    read(dbs.trips?.id),
    read(dbs.entries?.id),
  ]);

  return sortRaw({
    events: events.map(toEvent),
    courses: courses.map(toCourse),
    trips: trips.map(toTrip),
    entries: entries.map(toEntry),
  });
}

// 목록 화면용 전체 데이터
export async function getDiaryData(unlocked: boolean): Promise<DiaryData> {
  return filterForViewer(await loadRaw(), unlocked);
}

// 일기 한 편. 없으면 null, 비공개인데 잠겨 있으면 잠김 표시만.
export async function getEntry(id: string, unlocked: boolean): Promise<Entry | LockedEntry | null> {
  const data = await getDiaryData(unlocked);
  return data.entries.find((e) => e.id === id) ?? null;
}

// 여행 한 건. 없거나 비공개인데 잠겨 있으면 null. (비공개 여행은 존재 자체를 알리지 않는다)
export async function getTrip(id: string, unlocked: boolean): Promise<Trip | null> {
  const data = await getDiaryData(unlocked);
  return data.trips.find((t) => t.id === id) ?? null;
}
