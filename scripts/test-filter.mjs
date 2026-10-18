// 공개 필터 시험 (작업 2). 노션 내용·토큰은 출력하지 않는다.
// 사용법:  npm.cmd run test:filter            → 가짜 데이터로 시험
//          npm.cmd run test:filter -- --live → 실제 노션 데이터로도 시험 (개수만 출력)

import assert from "node:assert/strict";
import fs from "node:fs";
import { filterForViewer, isLocked, sortRaw, toCourse, toEntry, toEvent, toTrip } from "../lib/transform.ts";

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
    toTrip({ id: "t1", properties: { 제목: t("공개 여행"), 기간: d("2027-04-01", "2027-04-03"), 공개: c(true), "대표 사진": { files: [{}] } } }),
    toTrip({ id: "t2", properties: { 제목: t("비밀 여행"), 기간: d("2027-05-01"), 공개: c(false) } }),
  ],
  entries: [
    toEntry({ id: "d1", properties: { 제목: t("공개 일기"), 날짜: d("2027-03-02"), 공개: c(true), 태그: { multi_select: [{ name: "일상" }] } } }),
    toEntry({ id: "d2", properties: { 제목: t("비밀 일기 제목"), 날짜: d("2027-03-03"), 공개: c(false), 장소: r("비밀 장소"), 기분: { select: { name: "😢 힘듦" } } } }),
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
for (const secret of ["비밀 일정", "비밀 여행", "비밀 일기 제목", "비밀 장소", "😢", "A101", "공개 열 없음"]) {
  assert.ok(!text.includes(secret), `잠긴 응답에 비공개 내용 "${secret}"이 들어 있음`);
}

// ---- 열린 상태(비밀번호 확인) ----
const open = filterForViewer(raw, true);
assert.equal(open.events.length, 3);
assert.equal(open.trips.length, 2);
assert.equal(open.courses.length, 1);
assert.ok(open.entries.every((e) => !isLocked(e)));

console.log("✅ 가짜 데이터 시험 통과: 잠긴 상태에서는 공개 항목만, 비공개 일기는 날짜·자물쇠만 나갑니다.");

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
  });
  const a = filterForViewer(live, false);
  const b = filterForViewer(live, true);
  const lockedCount = a.entries.filter(isLocked).length;
  console.log("\n실제 노션 데이터 (개수만):");
  console.log(`  일정  전체 ${b.events.length} → 잠긴 상태 ${a.events.length}`);
  console.log(`  수업  전체 ${b.courses.length} → 잠긴 상태 ${a.courses.length}`);
  console.log(`  여행  전체 ${b.trips.length} → 잠긴 상태 ${a.trips.length}`);
  console.log(`  일기  전체 ${b.entries.length} → 잠긴 상태 ${a.entries.length} (그중 자물쇠 ${lockedCount})`);
  const empties = b.entries.filter((e) => !e.title || !e.date).length + b.trips.filter((x) => !x.title).length;
  console.log(empties ? `  ⚠️ 제목이나 날짜가 빈 항목 ${empties}개` : "  ✅ 제목·날짜가 모두 채워져 있습니다");
}
