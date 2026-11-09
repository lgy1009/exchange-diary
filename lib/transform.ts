// 노션 원본 → 사이트 데이터 모양으로 바꾸기, 그리고 공개/비공개 거르기.
// 노션을 부르지 않는 순수한 함수만 둔다. (가짜 데이터로 시험할 수 있게: scripts/test-filter.mjs)
// 열 이름은 DESIGN §3과 같다.

import { codeOf, HOME_COUNTRY, type CountryCode } from "./countries.ts";
import type {
  Course,
  DateRange,
  DiaryData,
  Entry,
  EventItem,
  GuestbookEntry,
  BucketItem,
  LockedEntry,
  Profile,
  RawDiaryData,
  Trip,
} from "./types";

type Props = Record<string, unknown>;
type PageLike = { id: string; properties: Props; created_time?: string; last_edited_time?: string };

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

// 네이버 블로그 글 주소만 받는다. 다른 주소나 이상한 값은 버린다 (사이트에 엉뚱한 링크가 걸리지 않게).
const BLOG_HOSTS = new Set(["blog.naver.com", "m.blog.naver.com"]);
export function safeBlogUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const u = new URL(value.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (!BLOG_HOSTS.has(u.hostname.toLowerCase())) return null;
    if (u.username || u.password || u.port) return null;
    u.protocol = "https:";
    return u.toString();
  } catch {
    return null;
  }
}

function urlOf(props: Props, name: string): string | null {
  const p = props[name] as { url?: string | null } | undefined;
  return typeof p?.url === "string" ? p.url : null;
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
    countries: multiOf(p, "나라")
      .map(codeOf)
      .filter((c): c is CountryCode => c !== null),
    place: textOf(p, "나라·도시"),
    lat: numberOf(p, "위도"),
    lng: numberOf(p, "경도"),
    summary: textOf(p, "한 줄 요약"),
    hasCover: hasFiles(p, "대표 사진"),
    blog: safeBlogUrl(urlOf(p, "블로그")),
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
    country: codeOf(selectOf(p, "나라") ?? "") ?? HOME_COUNTRY,
    place: textOf(p, "장소"),
    tags: multiOf(p, "태그"),
    hasCover: hasFiles(p, "대표 사진"),
    blog: safeBlogUrl(urlOf(p, "블로그")),
    isPublic: checkOf(p, "공개"),
  };
}

// 프로필은 가장 최근에 고친 줄 하나만 쓴다
export function toProfile(pages: PageLike[]): Profile | null {
  const latest = [...pages].sort((a, b) => (b.last_edited_time ?? "").localeCompare(a.last_edited_time ?? ""))[0];
  if (!latest) return null;
  const p = latest.properties;
  return {
    id: latest.id,
    status: textOf(p, "상태 메시지"),
    mood: selectOf(p, "오늘 기분"),
    song: textOf(p, "노래 제목"),
    hasPhoto: hasFiles(p, "대표 사진"),
    updatedAt: latest.last_edited_time ?? "",
  };
}

export function toGuestbook(page: PageLike): GuestbookEntry {
  const p = page.properties;
  return {
    id: page.id,
    name: textOf(p, "이름"),
    message: textOf(p, "내용"),
    createdAt: page.created_time ?? "",
    approved: checkOf(p, "승인"),
  };
}

export function toBucket(page: PageLike): BucketItem {
  const p = page.properties;
  const done = dateOf(p, "완료한 날");
  return {
    id: page.id,
    title: textOf(p, "할 일"),
    done: checkOf(p, "완료"),
    doneAt: done ? done.start.slice(0, 10) : null,
    category: selectOf(p, "분류"),
    memo: textOf(p, "메모"),
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
    profile: raw.profile,
    guestbook: [...raw.guestbook].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), // 최신 글부터
    // 버킷리스트: 아직 못 한 것 먼저, 해낸 것은 최근에 해낸 것부터
    bucket: [...raw.bucket].sort((a, b) =>
      a.done !== b.done ? (a.done ? 1 : -1) : (b.doneAt ?? "").localeCompare(a.doneAt ?? ""),
    ),
  };
}

// ---- 공개 필터 (SC-4: 비공개 내용은 비밀번호 확인 전에 내려보내지 않는다) ----
// 비밀번호 없이 볼 때:
//   일정·여행 — 공개 체크된 것만
//   수업      — "공개" 열이 없어서 전부 숨긴다 (강의실·시간은 개인 동선이라서)
//   일기      — 공개는 그대로, 비공개는 날짜와 자물쇠 표시만 남긴다
// 누구에게나:
//   프로필    — 그대로 (홈에 보이는 공개 정보)
//   방명록    — 승인된 글만 (비밀번호를 풀어도 승인 대기 글은 노션에서만 본다)
//   버킷리스트 — 비밀번호 없이 볼 때는 공개 체크된 것만
export function lockEntry(e: Entry): LockedEntry {
  return { id: e.id, date: e.date, locked: true };
}

export function filterForViewer(raw: RawDiaryData, unlocked: boolean): DiaryData {
  const guestbook = raw.guestbook.filter((g) => g.approved);
  if (unlocked) return { unlocked: true, ...raw, guestbook };
  return {
    unlocked: false,
    events: raw.events.filter((e) => e.isPublic),
    courses: [],
    trips: raw.trips.filter((t) => t.isPublic),
    entries: raw.entries.map((e) => (e.isPublic ? e : lockEntry(e))),
    profile: raw.profile,
    guestbook,
    bucket: raw.bucket.filter((b) => b.isPublic),
  };
}

export function isLocked(e: Entry | LockedEntry): e is LockedEntry {
  return "locked" in e;
}
