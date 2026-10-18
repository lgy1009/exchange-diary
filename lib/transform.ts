// 노션 원본 → 사이트 데이터 모양으로 바꾸기, 그리고 공개/비공개 거르기.
// 노션을 부르지 않는 순수한 함수만 둔다. (가짜 데이터로 시험할 수 있게: scripts/test-filter.mjs)
// 열 이름은 DESIGN §3과 같다.

import type {
  Course,
  DateRange,
  DiaryData,
  Entry,
  EventItem,
  LockedEntry,
  RawDiaryData,
  Trip,
} from "./types";

type Props = Record<string, unknown>;
type PageLike = { id: string; properties: Props };

// ---- 노션 열 값 읽기 (열이 없거나 형식이 달라도 오류 대신 빈 값) ----
type TextPiece = { plain_text?: string };

function textOf(props: Props, name: string): string {
  const p = props[name] as { type?: string; title?: TextPiece[]; rich_text?: TextPiece[] } | undefined;
  const pieces = p?.title ?? p?.rich_text ?? [];
  return pieces.map((t) => t.plain_text ?? "").join("").trim();
}

function dateOf(props: Props, name: string): DateRange | null {
  const p = props[name] as { date?: { start?: string; end?: string | null } | null } | undefined;
  if (!p?.date?.start) return null;
  return { start: p.date.start, end: p.date.end ?? null };
}

function selectOf(props: Props, name: string): string | null {
  const p = props[name] as { select?: { name?: string } | null } | undefined;
  return p?.select?.name ?? null;
}

function multiOf(props: Props, name: string): string[] {
  const p = props[name] as { multi_select?: { name?: string }[] } | undefined;
  return (p?.multi_select ?? []).map((o) => o.name ?? "").filter(Boolean);
}

function numberOf(props: Props, name: string): number | null {
  const p = props[name] as { number?: number | null } | undefined;
  return typeof p?.number === "number" ? p.number : null;
}

function checkOf(props: Props, name: string): boolean {
  const p = props[name] as { checkbox?: boolean } | undefined;
  return p?.checkbox === true; // 체크가 확실할 때만 공개
}

function hasFiles(props: Props, name: string): boolean {
  const p = props[name] as { files?: unknown[] } | undefined;
  return (p?.files ?? []).length > 0;
}

// ---- 데이터베이스별 변환 ----
export function toEvent(page: PageLike): EventItem {
  const p = page.properties;
  return {
    id: page.id,
    name: textOf(p, "이름"),
    date: dateOf(p, "날짜"),
    kind: selectOf(p, "종류"),
    place: textOf(p, "장소"),
    isPublic: checkOf(p, "공개"),
  };
}

export function toCourse(page: PageLike): Course {
  const p = page.properties;
  return {
    id: page.id,
    name: textOf(p, "과목명"),
    days: multiOf(p, "요일"),
    start: textOf(p, "시작"),
    end: textOf(p, "종료"),
    room: textOf(p, "강의실"),
    professor: textOf(p, "교수"),
  };
}

export function toTrip(page: PageLike): Trip {
  const p = page.properties;
  return {
    id: page.id,
    title: textOf(p, "제목"),
    period: dateOf(p, "기간"),
    place: textOf(p, "나라·도시"),
    lat: numberOf(p, "위도"),
    lng: numberOf(p, "경도"),
    summary: textOf(p, "한 줄 요약"),
    hasCover: hasFiles(p, "대표 사진"),
    isPublic: checkOf(p, "공개"),
  };
}

export function toEntry(page: PageLike): Entry {
  const p = page.properties;
  return {
    id: page.id,
    title: textOf(p, "제목"),
    date: dateOf(p, "날짜"),
    mood: selectOf(p, "기분"),
    place: textOf(p, "장소"),
    tags: multiOf(p, "태그"),
    hasCover: hasFiles(p, "대표 사진"),
    isPublic: checkOf(p, "공개"),
  };
}

// 날짜순 정렬 (날짜 없는 항목은 어느 쪽이든 맨 뒤)
function byDate<T>(get: (x: T) => DateRange | null, newestFirst: boolean) {
  return (a: T, b: T) => {
    const x = get(a)?.start;
    const y = get(b)?.start;
    if (!x || !y) return x ? -1 : y ? 1 : 0;
    return newestFirst ? y.localeCompare(x) : x.localeCompare(y);
  };
}

export function sortRaw(raw: RawDiaryData): RawDiaryData {
  return {
    events: [...raw.events].sort(byDate((e) => e.date, false)), // 일정은 빠른 날짜부터
    courses: [...raw.courses],
    trips: [...raw.trips].sort(byDate((t) => t.period, true)), // 여행·일기는 최근 것부터
    entries: [...raw.entries].sort(byDate((e) => e.date, true)),
  };
}

// ---- 공개 필터 (SC-4: 비공개 내용은 비밀번호 확인 전에 내려보내지 않는다) ----
// 비밀번호 없이 볼 때:
//   일정·여행 — 공개 체크된 것만
//   수업      — "공개" 열이 없어서 전부 숨긴다 (강의실·시간은 개인 동선이라서)
//   일기      — 공개는 그대로, 비공개는 날짜와 자물쇠 표시만 남긴다
export function lockEntry(e: Entry): LockedEntry {
  return { id: e.id, date: e.date, locked: true };
}

export function filterForViewer(raw: RawDiaryData, unlocked: boolean): DiaryData {
  if (unlocked) return { unlocked: true, ...raw };
  return {
    unlocked: false,
    events: raw.events.filter((e) => e.isPublic),
    courses: [],
    trips: raw.trips.filter((t) => t.isPublic),
    entries: raw.entries.map((e) => (e.isPublic ? e : lockEntry(e))),
  };
}

export function isLocked(e: Entry | LockedEntry): e is LockedEntry {
  return "locked" in e;
}
