// 노션 데이터베이스를 설계(DESIGN §3)대로 맞춘다. 몇 번을 실행해도 안전하다.
//   - 없는 데이터베이스는 새로 만든다 (일정·수업·여행·일기·프로필·방명록)
//   - 이미 있는 데이터베이스에는 빠진 열만 더한다 (있는 열·기록은 건드리지 않는다)
// 사용법:  npm.cmd run notion:setup            → 구조만 맞춘다
//          npm.cmd run notion:setup -- --sample → 예시 기록도 넣는다 (제목이 "예시)"로 시작, 나중에 지우면 된다)
// 필요한 .env 값: NOTION_TOKEN, NOTION_PARENT_PAGE (연결을 추가한 노션 페이지의 주소 또는 ID)
// 토큰은 출력하지 않는다.

import fs from "node:fs";
import { COUNTRIES } from "../lib/countries.ts";

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

async function notion(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, "Notion-Version": VERSION, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    let hint = "";
    if (res.status === 401) hint = " (토큰이 올바르지 않습니다)";
    if (res.status === 404) hint = " (페이지를 찾을 수 없습니다. 페이지에 연결을 추가했는지 확인해 주세요)";
    if (res.status === 403) hint = " (연결에 '콘텐츠 삽입·업데이트' 권한이 있는지 확인해 주세요)";
    console.error(`❌ 노션 요청 실패: ${method} HTTP ${res.status}${hint}`);
    process.exit(1);
  }
  return res.json();
}

const text = { rich_text: {} };
const opts = (list) => ({ options: list.map((name) => ({ name })) });
const countryNames = COUNTRIES.map((c) => c.name);

// 설계 (DESIGN §3) — 열 이름이 곧 사이트가 찾는 이름이다
const DATABASES = [
  {
    title: "일정",
    properties: {
      이름: { title: {} },
      날짜: { date: {} },
      종류: { select: opts(["시험", "과제", "행정", "기타"]) },
      장소: text,
      공개: { checkbox: {} },
    },
  },
  {
    title: "수업",
    properties: {
      과목명: { title: {} },
      요일: { multi_select: opts(["월", "화", "수", "목", "금", "토", "일"]) },
      시작: text,
      종료: text,
      강의실: text,
      교수: text,
    },
  },
  {
    title: "여행",
    properties: {
      제목: { title: {} },
      기간: { date: {} },
      나라: { multi_select: opts(countryNames) },
      "나라·도시": text,
      위도: { number: { format: "number" } },
      경도: { number: { format: "number" } },
      "한 줄 요약": text,
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
      나라: { select: opts(countryNames) },
      장소: text,
      태그: { multi_select: opts(["수업", "여행", "음식", "친구", "일상"]) },
      "대표 사진": { files: {} },
      공개: { checkbox: {} },
    },
  },
  {
    title: "프로필",
    properties: {
      "상태 메시지": { title: {} },
      "오늘 기분": { select: opts(["맑음", "흐림", "비", "설렘", "피곤", "행복"]) },
      "노래 제목": { rich_text: {} },
      "대표 사진": { files: {} },
    },
  },
  {
    title: "방명록",
    properties: {
      이름: { title: {} },
      내용: text,
      승인: { checkbox: {} },
    },
  },
];

// 이미 있는 데이터베이스 찾기
const existing = new Map();
const found = await notion("POST", "/search", { filter: { property: "object", value: "database" }, page_size: 100 });
for (const db of found.results) {
  const t = (db.title || []).map((x) => x.plain_text).join("").trim();
  if (t && !existing.has(t)) existing.set(t, db);
}
// 방금 만든 데이터베이스는 검색에 늦게 잡히므로, 상위 페이지 안을 직접 한 번 더 본다 (중복 생성 방지)
const children = await notion("GET", `/blocks/${PARENT_ID}/children?page_size=100`);
for (const block of children.results) {
  if (block.type === "child_database" && !existing.has(block.child_database.title.trim())) {
    existing.set(block.child_database.title.trim(), await notion("GET", `/databases/${block.id}`));
  }
}

const ids = {};
const created = new Set();
for (const db of DATABASES) {
  const old = existing.get(db.title);
  if (!old) {
    const made = await notion("POST", "/databases", {
      parent: { type: "page_id", page_id: PARENT_ID },
      title: [{ type: "text", text: { content: db.title } }],
      properties: db.properties,
    });
    ids[db.title] = made.id;
    created.add(db.title);
    console.log(`✅ "${db.title}" 데이터베이스를 만들었습니다.`);
    continue;
  }
  ids[db.title] = old.id;
  const missing = Object.fromEntries(Object.entries(db.properties).filter(([name]) => !old.properties[name]));
  // 제목 열은 데이터베이스마다 하나뿐이라 새로 더할 수 없다 (이름이 다르면 확인 스크립트가 알려 준다)
  for (const [name, def] of Object.entries(missing)) if (def.title) delete missing[name];
  if (Object.keys(missing).length === 0) {
    console.log(`↪ "${db.title}" — 이미 설계와 같습니다.`);
    continue;
  }
  await notion("PATCH", `/databases/${old.id}`, { properties: missing });
  console.log(`✅ "${db.title}" — 열 추가: ${Object.keys(missing).join(", ")}`);
}

// 예시 기록 (--sample)
if (WITH_SAMPLE) {
  const day = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
  const rt = (content) => ({ rich_text: [{ type: "text", text: { content } }] });
  const ttl = (content) => ({ title: [{ type: "text", text: { content } }] });
  const add = (title, properties) => notion("POST", "/pages", { parent: { database_id: ids[title] }, properties });
  let count = 0;

  // 작업 1에서 만든 데이터베이스는 이미 예시가 있으므로, 처음 만든 경우에만 넣는다
  if (created.has("수업")) {
    await add("수업", { 과목명: ttl("예시) 국제경제학"), 요일: { multi_select: [{ name: "월" }, { name: "수" }] }, 시작: rt("09:00"), 종료: rt("10:30"), 강의실: rt("A101"), 교수: rt("Prof. Example") });
    count++;
  }
  if (created.has("일정")) {
    await add("일정", { 이름: ttl("예시) 기숙사 서류 제출"), 날짜: { date: { start: day(3) } }, 종류: { select: { name: "행정" } }, 장소: rt("국제교류처"), 공개: { checkbox: true } });
    count++;
  }
  if (created.has("여행")) {
    await add("여행", { 제목: ttl("예시) 주말 근교 여행"), 기간: { date: { start: day(7), end: day(9) } }, 나라: { multi_select: [{ name: "포르투갈" }] }, "나라·도시": rt("리스본"), 위도: { number: 38.7223 }, 경도: { number: -9.1393 }, "한 줄 요약": rt("예시로 넣어 둔 여행입니다."), 공개: { checkbox: true } });
    count++;
  }
  if (created.has("일기")) {
    await add("일기", { 제목: ttl("예시) 공개 일기 — 첫 주"), 날짜: { date: { start: day(-1) } }, 기분: { select: { name: "😀 좋음" } }, 나라: { select: { name: "스페인" } }, 장소: rt("말라게타 해변"), 공개: { checkbox: true } });
    count++;
  }
  if (created.has("프로필")) {
    await add("프로필", { "상태 메시지": ttl("예시) 말라가 첫 봄 ☀"), "오늘 기분": { select: { name: "맑음" } } });
    count++;
  }
  if (created.has("방명록")) {
    await add("방명록", { 이름: ttl("예시) 엄마"), 내용: rt("밥 잘 챙겨 먹어~"), 승인: { checkbox: true } });
    await add("방명록", { 이름: ttl("예시) 승인 대기"), 내용: rt("승인 체크를 하기 전에는 사이트에 안 보이는 글입니다."), 승인: { checkbox: false } });
    count += 2;
  }

  // 이미 있던 예시 여행·일기에 "나라"가 비어 있으면 채운다
  const fill = async (title, prop, value) => {
    if (created.has(title)) return;
    const rows = await notion("POST", `/databases/${ids[title]}/query`, { page_size: 100 });
    for (const row of rows.results) {
      const name = (row.properties["제목"]?.title || []).map((x) => x.plain_text).join("");
      const cur = row.properties[prop];
      const empty = cur && (cur.multi_select ? cur.multi_select.length === 0 : !cur.select);
      if (name.startsWith("예시)") && empty) {
        await notion("PATCH", `/pages/${row.id}`, { properties: { [prop]: value } });
        count++;
      }
    }
  };
  await fill("여행", "나라", { multi_select: [{ name: "포르투갈" }] });
  await fill("일기", "나라", { select: { name: "스페인" } });

  console.log(`✅ 예시 기록 ${count}건을 넣거나 채웠습니다. (제목이 '예시)'로 시작합니다. 노션에서 지워도 됩니다)`);
}

console.log("\n끝났습니다. 노션 검색에 새 데이터베이스가 잡히기까지 1분쯤 걸릴 수 있습니다.");
console.log("이어서 연결을 확인해 보세요:  npm.cmd run notion:check");
