// 노션 REST API를 fetch로 직접 부른다. (새 라이브러리 없음)
// 토큰은 환경 변수(NOTION_TOKEN)에서만 읽고, 로그나 화면에 내보내지 않는다.
// 서버 코드에서만 쓴다. (브라우저로 보내는 코드에서 불러오지 않는다)

import { DB_TITLES, type DbKey } from "./config";

const API = "https://api.notion.com/v1";
const VERSION = "2022-06-28";

export type NotionDatabase = {
  id: string;
  title: string;
  properties: Record<string, { type: string }>;
};

// 노션 페이지(= 데이터베이스의 한 줄). 열 값은 노션 원본 모양 그대로 둔다.
export type NotionPage = {
  id: string;
  created_time: string;
  last_edited_time: string;
  properties: Record<string, unknown>;
};

function token(): string {
  const value = process.env.NOTION_TOKEN;
  if (!value) throw new Error("NOTION_TOKEN이 설정되어 있지 않습니다. .env를 확인해 주세요.");
  return value;
}

async function notion<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Notion-Version": VERSION,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store", // 재사용(캐시)은 diary-data.ts에서 정한다
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    // 오류 내용에 개인 기록이 섞일 수 있어 상태 코드만 남긴다
    throw new Error(`노션 요청 실패 (HTTP ${res.status})`);
  }
  return (await res.json()) as T;
}

// 페이지 하나 등 GET으로 읽는 요청
export function notionGet<T>(path: string): Promise<T> {
  return notion<T>(path);
}

// 연동이 볼 수 있는 데이터베이스 중 이름이 맞는 것을 찾는다 (ID를 따로 적을 필요가 없다)
export async function findDatabases(): Promise<Partial<Record<DbKey, NotionDatabase>>> {
  const data = await notion<{
    results: { id: string; title?: { plain_text: string }[]; properties: Record<string, { type: string }> }[];
  }>("/search", { filter: { property: "object", value: "database" }, page_size: 100 });

  const found: Partial<Record<DbKey, NotionDatabase>> = {};
  for (const db of data.results) {
    const title = (db.title ?? []).map((t) => t.plain_text).join("").trim();
    for (const key of Object.keys(DB_TITLES) as DbKey[]) {
      if (title === DB_TITLES[key] && !found[key]) {
        found[key] = { id: db.id, title, properties: db.properties };
      }
    }
  }
  return found;
}

// 데이터베이스의 모든 줄을 가져온다 (한 번에 100개씩 이어서). filter를 주면 노션이 맞는 줄만 돌려준다.
export async function queryAll(databaseId: string, filter?: unknown): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let cursor: string | undefined;
  do {
    const data = await notion<{ results: NotionPage[]; has_more: boolean; next_cursor: string | null }>(
      `/databases/${databaseId}/query`,
      { page_size: 100, ...(filter ? { filter } : {}), ...(cursor ? { start_cursor: cursor } : {}) },
    );
    pages.push(...data.results);
    cursor = data.has_more && data.next_cursor ? data.next_cursor : undefined;
  } while (cursor);
  return pages;
}
