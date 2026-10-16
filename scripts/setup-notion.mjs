// 노션에 데이터베이스 4개(일정·수업·여행·일기)를 자동으로 만든다. (처음 한 번만)
// 사용법:  npm.cmd run notion:setup            → 데이터베이스만 만든다
//          npm.cmd run notion:setup -- --sample → 예시 기록도 몇 개 넣는다 (나중에 지우면 된다)
// 필요한 .env 값: NOTION_TOKEN, NOTION_PARENT_PAGE (연동에 공유한 노션 페이지의 주소 또는 ID)
// 토큰은 출력하지 않는다. 이미 같은 이름의 데이터베이스가 있으면 새로 만들지 않는다.

import fs from "node:fs";

const VERSION = "2022-06-28";
const API = "https://api.notion.com/v1";

function readEnv() {
  const env = {};
  if (!fs.existsSync(".env")) return env;
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = readEnv();
const TOKEN = env.NOTION_TOKEN;
const PARENT_RAW = env.NOTION_PARENT_PAGE || "";
const WITH_SAMPLE = process.argv.includes("--sample");

if (!TOKEN) {
  console.error("❌ .env의 NOTION_TOKEN이 비어 있습니다. 노션에서 발급한 토큰을 붙여 넣어 주세요.");
  process.exit(1);
}
const idMatch = PARENT_RAW.replace(/-/g, "").match(/[0-9a-f]{32}/i);
if (!idMatch) {
  console.error("❌ .env의 NOTION_PARENT_PAGE가 비어 있거나 형식이 맞지 않습니다. 노션 페이지 주소를 붙여 넣어 주세요.");
  process.exit(1);
}
const PARENT_ID = idMatch[0];

async function notion(path, body) {
  const res = await fetch(API + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Notion-Version": VERSION, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    let hint = "";
    if (res.status === 401) hint = " (토큰이 올바르지 않습니다)";
    if (res.status === 404) hint = " (페이지를 찾을 수 없습니다. 페이지에 연동을 '연결'했는지 확인해 주세요)";
    if (res.status === 403) hint = " (연동에 '콘텐츠 삽입(만들기)' 권한이 있는지 확인해 주세요)";
    console.error(`❌ 노션 요청 실패: HTTP ${res.status}${hint}`);
    process.exit(1);
  }
  return res.json();
}

const text = (name) => ({ [name]: { rich_text: {} } });
const opts = (list) => ({ options: list.map((name) => ({ name })) });

const DATABASES = [
  {
    title: "일정",
    properties: {
      이름: { title: {} },
      날짜: { date: {} },
      종류: { select: opts(["시험", "과제", "행정", "기타"]) },
      ...text("장소"),
      공개: { checkbox: {} },
    },
  },
  {
    title: "수업",
    properties: {
      과목명: { title: {} },
      요일: { multi_select: opts(["월", "화", "수", "목", "금", "토", "일"]) },
      ...text("시작"),
      ...text("종료"),
      ...text("강의실"),
      ...text("교수"),
    },
  },
  {
    title: "여행",
    properties: {
      제목: { title: {} },
      기간: { date: {} },
      ...text("나라·도시"),
      위도: { number: { format: "number" } },
      경도: { number: { format: "number" } },
      ...text("한 줄 요약"),
      "대표 사진": { files: {} },
      공개: { checkbox: {} },
    },
  },
  {
    title: "일기",
    properties: {
      제목: { title: {} },
      날짜: { date: {} },
      기분: { select: opts(["😀 좋음", "🙂 보통", "😐 그저 그럼", "😢 힘듦"]) },
      ...text("장소"),
      태그: { multi_select: opts(["수업", "여행", "음식", "친구", "일상"]) },
      "대표 사진": { files: {} },
      공개: { checkbox: {} },
    },
  },
];

// 이미 있는 데이터베이스 이름 찾기
const existing = new Map();
const found = await notion("/search", { filter: { property: "object", value: "database" }, page_size: 100 });
for (const db of found.results) {
  const t = (db.title || []).map((x) => x.plain_text).join("").trim();
  if (t) existing.set(t, db.id);
}

const ids = {};
for (const db of DATABASES) {
  if (existing.has(db.title)) {
    ids[db.title] = existing.get(db.title);
    console.log(`↪ "${db.title}" 데이터베이스는 이미 있어서 건너뜁니다.`);
    continue;
  }
  const created = await notion("/databases", {
    parent: { type: "page_id", page_id: PARENT_ID },
    title: [{ type: "text", text: { content: db.title } }],
    properties: db.properties,
  });
  ids[db.title] = created.id;
  console.log(`✅ "${db.title}" 데이터베이스를 만들었습니다.`);
}

// 예시 기록 (--sample)
if (WITH_SAMPLE) {
  const day = (offset) => {
    const d = new Date(Date.now() + offset * 86400000);
    return d.toISOString().slice(0, 10);
  };
  const rt = (content) => ({ rich_text: [{ type: "text", text: { content } }] });
  const ttl = (content) => ({ title: [{ type: "text", text: { content } }] });
  const add = (title, properties) =>
    notion("/pages", { parent: { database_id: ids[title] }, properties });

  await add("수업", { 과목명: ttl("예시) 국제경제학"), 요일: { multi_select: [{ name: "월" }, { name: "수" }] }, ...{ 시작: rt("09:00"), 종료: rt("10:30"), 강의실: rt("A101"), 교수: rt("Prof. Example") } });
  await add("수업", { 과목명: ttl("예시) 현지 언어 회화"), 요일: { multi_select: [{ name: "화" }, { name: "목" }] }, 시작: rt("14:00"), 종료: rt("15:30"), 강의실: rt("B203"), 교수: rt("Prof. Sample") });
  await add("일정", { 이름: ttl("예시) 중간고사"), 날짜: { date: { start: day(14) } }, 종류: { select: { name: "시험" } }, 장소: rt("대강당"), 공개: { checkbox: false } });
  await add("일정", { 이름: ttl("예시) 기숙사 서류 제출"), 날짜: { date: { start: day(3) } }, 종류: { select: { name: "행정" } }, 장소: rt("국제교류처"), 공개: { checkbox: true } });
  await add("여행", { 제목: ttl("예시) 주말 근교 여행"), 기간: { date: { start: day(7), end: day(9) } }, "나라·도시": rt("예시 도시"), 위도: { number: 48.8566 }, 경도: { number: 2.3522 }, "한 줄 요약": rt("예시로 넣어 둔 여행입니다."), 공개: { checkbox: true } });
  await add("일기", { 제목: ttl("예시) 공개 일기 — 첫 주"), 날짜: { date: { start: day(-1) } }, 기분: { select: { name: "😀 좋음" } }, 장소: rt("기숙사"), 태그: { multi_select: [{ name: "일상" }] }, 공개: { checkbox: true } });
  await add("일기", { 제목: ttl("예시) 비공개 일기 — 나만 보기"), 날짜: { date: { start: day(0) } }, 기분: { select: { name: "🙂 보통" } }, 장소: rt("카페"), 태그: { multi_select: [{ name: "일상" }] }, 공개: { checkbox: false } });
  console.log("✅ 예시 기록 7개를 넣었습니다. (제목이 '예시)'로 시작합니다. 노션에서 지워도 됩니다)");
}

console.log("\n끝났습니다. 이어서 연결을 확인해 보세요:  npm.cmd run notion:check");
