// 노션 연결이 잘 되었는지 확인한다. (읽기만 한다. 토큰·기록 내용은 출력하지 않는다)
// 사용법:  npm.cmd run notion:check
// 확인하는 것: 토큰이 맞는지 / 데이터베이스 4개를 찾는지 / 열 이름·형식이 설계와 같은지 / 줄(기록) 수

import fs from "node:fs";

function readEnv() {
  const env = {};
  if (!fs.existsSync(".env")) return env;
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}
const TOKEN = readEnv().NOTION_TOKEN;
if (!TOKEN) {
  console.error("❌ .env의 NOTION_TOKEN이 비어 있습니다.");
  process.exit(1);
}

const EXPECT = {
  일정: { 이름: "title", 날짜: "date", 종류: "select", 장소: "rich_text", 공개: "checkbox" },
  수업: { 과목명: "title", 요일: "multi_select", 시작: "rich_text", 종료: "rich_text", 강의실: "rich_text", 교수: "rich_text" },
  여행: { 제목: "title", 기간: "date", 나라: "multi_select", "나라·도시": "rich_text", 위도: "number", 경도: "number", "한 줄 요약": "rich_text", "대표 사진": "files", 공개: "checkbox" },
  일기: { 제목: "title", 날짜: "date", 기분: "select", 나라: "select", 장소: "rich_text", 태그: "multi_select", "대표 사진": "files", 공개: "checkbox" },
  프로필: { "상태 메시지": "title", "오늘 기분": "select", "대표 사진": "files" },
  방명록: { 이름: "title", 내용: "rich_text", 승인: "checkbox" },
};

async function notion(path, body) {
  const res = await fetch("https://api.notion.com/v1" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    console.error(`❌ 노션 요청 실패: HTTP ${res.status}${res.status === 401 ? " (토큰이 올바르지 않습니다)" : ""}`);
    process.exit(1);
  }
  return res.json();
}

const search = await notion("/search", { filter: { property: "object", value: "database" }, page_size: 100 });
const byTitle = new Map();
for (const db of search.results) {
  const t = (db.title || []).map((x) => x.plain_text).join("").trim();
  if (t && !byTitle.has(t)) byTitle.set(t, db);
}
// 방금 만든 데이터베이스는 검색에 늦게 잡히므로 상위 페이지 안도 직접 본다
const parentId = (readEnv().NOTION_PARENT_PAGE || "").replace(/-/g, "").match(/[0-9a-f]{32}/i)?.[0];
if (parentId) {
  const children = await notion(`/blocks/${parentId}/children?page_size=100`);
  for (const block of children.results) {
    const t = block.type === "child_database" ? block.child_database.title.trim() : "";
    if (t && !byTitle.has(t)) byTitle.set(t, await notion(`/databases/${block.id}`));
  }
}

let ok = true;
for (const [title, cols] of Object.entries(EXPECT)) {
  const db = byTitle.get(title);
  if (!db) {
    ok = false;
    console.log(`❌ "${title}" 데이터베이스를 찾지 못했습니다. (연동에 공유했는지, 이름이 똑같은지 확인)`);
    continue;
  }
  const problems = [];
  for (const [name, type] of Object.entries(cols)) {
    const prop = db.properties[name];
    if (!prop) problems.push(`열 "${name}" 없음`);
    else if (prop.type !== type) problems.push(`열 "${name}" 형식이 ${prop.type} (필요: ${type})`);
  }
  const rows = await notion(`/databases/${db.id}/query`, { page_size: 100 });
  const count = rows.results.length + (rows.has_more ? "+" : "");
  if (problems.length) {
    ok = false;
    console.log(`⚠️ "${title}" — 줄 ${count}개, 문제: ${problems.join(" / ")}`);
  } else {
    console.log(`✅ "${title}" — 열 이름·형식 맞음, 줄 ${count}개`);
  }
}

console.log(ok ? "\n🎉 노션 연결이 정상입니다. 다음 작업(데이터 형태)으로 넘어갈 수 있습니다." : "\n위 ❌/⚠️ 항목을 고친 뒤 다시 실행해 주세요.");
process.exit(ok ? 0 : 1);
