// 공개 필터 시험 (작업 2). 노션 내용·토큰은 출력하지 않는다.
// 사용법:  npm.cmd run test:filter            → 가짜 데이터로 시험
//          npm.cmd run test:filter -- --live → 실제 노션 데이터로도 시험 (개수만 출력)

import assert from "node:assert/strict";
import fs from "node:fs";
import {
  filterForViewer,
  isLocked,
  sortRaw,
  toCourse,
  toEntry,
  toEvent,
  toGuestbook,
  toProfile,
  toTrip,
} from "../lib/transform.ts";

// ---- 가짜 노션 페이지 만들기 ----
const t = (s) => ({ title: [{ plain_text: s }] });
const r = (s) => ({ rich_text: [{ plain_text: s }] });
const d = (start, end = null) => ({ date: { start, end } });
const c = (v) => ({ checkbox: v });

const raw = sortRaw({
  events: [
    toEvent({ id: "e1", properties: { 이름: t("공개 일정"), 날짜: d("2027-03-10"), 공개: c(true), 장소: r("A") } }),
    toEvent({ id: "e2", properties: { 이름: t("비밀 일정"), 날짜: d("2027-03-05"), 공개: c(false), 장소: r("B") } }),
    toEvent({ id: "e3", properties: { 이름: t("공개 열 없음"), 날짜: d("2027-03-01") } }),
  ],
  courses: [toCourse({ id: "c1", properties: { 과목명: t("수업"), 요일: { multi_select: [{ name: "월" }] }, 강의실: r("A101") } })],
  trips: [
    toTrip({ id: "t1", properties: { 제목: t("공개 여행"), 기간: d("2027-04-01", "2027-04-03"), 나라: { multi_select: [{ name: "포르투갈" }, { name: "없는나라" }] }, 공개: c(true), "대표 사진": { files: [{}] } } }),
    toTrip({ id: "t2", properties: { 제목: t("비밀 여행"), 기간: d("2027-05-01"), 공개: c(false) } }),
  ],
  entries: [
    toEntry({ id: "d1", properties: { 제목: t("공개 일기"), 날짜: d("2027-03-02"), 공개: c(true), 태그: { multi_select: [{ name: "일상" }] } } }),
    toEntry({ id: "d2", properties: { 제목: t("비밀 일기 제목"), 날짜: d("2027-03-03"), 나라: { select: { name: "프랑스" } }, 공개: c(false), 장소: r("비밀 장소"), 기분: { select: { name: "😢 힘듦" } } } }),
  ],
  profile: toProfile([
    { id: "p-old", last_edited_time: "2027-03-01T00:00:00Z", properties: { "상태 메시지": t("옛 상태") } },
    { id: "p-new", last_edited_time: "2027-03-05T00:00:00Z", properties: { "상태 메시지": t("새 상태"), "오늘 기분": { select: { name: "맑음" } } } },
  ]),
  guestbook: [
    toGuestbook({ id: "g1", created_time: "2027-03-01T10:00:00Z", properties: { 이름: t("엄마"), 내용: r("밥 잘 먹어"), 승인: c(true) } }),
    toGuestbook({ id: "g2", created_time: "2027-03-02T10:00:00Z", properties: { 이름: t("스팸봇"), 내용: r("승인 대기 광고글"), 승인: c(false) } }),
    toGuestbook({ id: "g3", created_time: "2027-03-03T10:00:00Z", properties: { 이름: t("민지"), 내용: r("사진 최고"), 승인: c(true) } }),
  ],
});

// ---- 변환 확인 ----
assert.equal(raw.events[0].id, "e3", "일정은 빠른 날짜부터");
assert.equal(raw.entries[0].id, "d2", "일기는 최근 것부터");
assert.equal(raw.trips[0].id, "t2", "여행은 최근 것부터");
assert.deepEqual(raw.trips[1].period, { start: "2027-04-01", end: "2027-04-03" });
assert.equal(raw.trips[1].hasCover, true);
assert.deepEqual(raw.courses[0].days, ["월"]);
assert.equal(raw.events.find((e) => e.id === "e3").isPublic, false, "공개 열이 없으면 비공개");
assert.deepEqual(raw.trips[1].countries, ["PT"], "나라 이름 → 코드, 목록에 없는 나라는 빠짐");
assert.deepEqual(raw.trips[0].countries, [], "나라를 안 적은 여행");
assert.equal(raw.entries.find((e) => e.id === "d1").country, "ES", "일기 나라를 비우면 스페인");
assert.equal(raw.entries.find((e) => e.id === "d2").country, "FR");
assert.equal(raw.profile.status, "새 상태", "프로필은 가장 최근 줄");
assert.equal(raw.profile.mood, "맑음");
assert.deepEqual(raw.guestbook.map((g) => g.id), ["g3", "g2", "g1"], "방명록은 최신 글부터");

// ---- 잠긴 상태(비밀번호 없음) ----
const locked = filterForViewer(raw, false);
assert.equal(locked.unlocked, false);
assert.deepEqual(locked.events.map((e) => e.id), ["e1"], "공개 일정만");
assert.deepEqual(locked.trips.map((x) => x.id), ["t1"], "공개 여행만");
assert.equal(locked.courses.length, 0, "수업은 숨김");
assert.equal(locked.entries.length, 2, "일기 자리는 그대로");
const lockedEntry = locked.entries.find((e) => e.id === "d2");
assert.ok(isLocked(lockedEntry));
assert.deepEqual(Object.keys(lockedEntry).sort(), ["date", "id", "locked"], "비공개 일기는 날짜·잠김 표시만");

// 응답 전체를 글자로 바꿔서 비공개 내용이 한 글자라도 섞였는지 확인
const text = JSON.stringify(locked);
for (const secret of ["비밀 일정", "비밀 여행", "비밀 일기 제목", "비밀 장소", "😢", "A101", "공개 열 없음", "FR", "스팸봇", "승인 대기 광고글"]) {
  assert.ok(!text.includes(secret), `잠긴 응답에 비공개 내용 "${secret}"이 들어 있음`);
}
assert.deepEqual(locked.guestbook.map((g) => g.id), ["g3", "g1"], "승인된 방명록만");
assert.equal(locked.profile.status, "새 상태", "프로필은 누구나 본다");

// ---- 열린 상태(비밀번호 확인) ----
const open = filterForViewer(raw, true);
assert.equal(open.events.length, 3);
assert.equal(open.trips.length, 2);
assert.equal(open.courses.length, 1);
assert.ok(open.entries.every((e) => !isLocked(e)));
assert.ok(!JSON.stringify(open.guestbook).includes("스팸봇"), "비밀번호를 풀어도 승인 대기 글은 안 나감");

console.log("✅ 가짜 데이터 시험 통과: 잠긴 상태에서는 공개 항목만, 비공개 일기는 날짜·자물쇠만, 방명록은 승인된 글만 나갑니다.");

// ---- 실제 노션 데이터 (--live) ----
if (process.argv.includes("--live")) {
  const env = {};
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  const notion = async (path, body) => {
    const res = await fetch("https://api.notion.com/v1" + path, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.NOTION_TOKEN}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`노션 요청 실패 HTTP ${res.status}`);
    return res.json();
  };
  const search = await notion("/search", { filter: { property: "object", value: "database" }, page_size: 100 });
  const idOf = (title) => search.results.find((db) => (db.title || []).map((x) => x.plain_text).join("").trim() === title)?.id;
  const rows = async (title) => (idOf(title) ? (await notion(`/databases/${idOf(title)}/query`, { page_size: 100 })).results : []);

  const live = sortRaw({
    events: (await rows("일정")).map(toEvent),
    courses: (await rows("수업")).map(toCourse),
    trips: (await rows("여행")).map(toTrip),
    entries: (await rows("일기")).map(toEntry),
    profile: toProfile(await rows("프로필")),
    guestbook: (await rows("방명록")).map(toGuestbook),
  });
  const a = filterForViewer(live, false);
  const b = filterForViewer(live, true);
  const lockedCount = a.entries.filter(isLocked).length;
  console.log("\n실제 노션 데이터 (개수만):");
  console.log(`  일정    전체 ${b.events.length} → 잠긴 상태 ${a.events.length}`);
  console.log(`  수업    전체 ${b.courses.length} → 잠긴 상태 ${a.courses.length}`);
  console.log(`  여행    전체 ${b.trips.length} → 잠긴 상태 ${a.trips.length} (나라 적힌 여행 ${b.trips.filter((x) => x.countries.length).length})`);
  console.log(`  일기    전체 ${b.entries.length} → 잠긴 상태 ${a.entries.length} (그중 자물쇠 ${lockedCount})`);
  console.log(`  프로필  ${live.profile ? "있음" : "없음"}`);
  console.log(`  방명록  전체 ${live.guestbook.length} → 보이는 글 ${a.guestbook.length} (승인된 것만)`);
  const empties = b.entries.filter((e) => !e.title || !e.date).length + b.trips.filter((x) => !x.title).length;
  console.log(empties ? `  ⚠️ 제목이나 날짜가 빈 항목 ${empties}개` : "  ✅ 제목·날짜가 모두 채워져 있습니다");
}
