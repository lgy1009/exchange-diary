// 노션 페이지 본문(블록)을 읽어 사이트에서 그리기 쉬운 단순한 모양으로 바꾼다.
// 반드시 공개 여부를 확인한 뒤에 부른다. (비공개 일기 본문은 비밀번호 확인 전에 읽지도 않는다)

import { cacheLife } from "next/cache";
import { REVALIDATE_SECONDS } from "./config";
import { notionGet } from "./notion";

export type Span = { text: string; bold?: boolean; italic?: boolean; href?: string };

export type Block =
  | { type: "p" | "h1" | "h2" | "h3" | "quote" | "callout" | "li" | "oli" | "todo"; id: string; spans: Span[]; checked?: boolean; icon?: string; color?: string }
  | { type: "image"; id: string; caption: string }
  | { type: "divider"; id: string };

type RichText = {
  plain_text?: string;
  href?: string | null;
  annotations?: { bold?: boolean; italic?: boolean };
};
type RawBlock = {
  id: string;
  type: string;
  has_children?: boolean;
  [key: string]: unknown;
};

function spansOf(rich: RichText[] | undefined): Span[] {
  return (rich ?? []).map((r) => {
    const href = r.href && /^https?:\/\//.test(r.href) ? r.href : undefined; // 웹 주소 링크만
    return { text: r.plain_text ?? "", bold: r.annotations?.bold || undefined, italic: r.annotations?.italic || undefined, href };
  });
}

const TEXT_TYPES: Record<string, Block["type"]> = {
  paragraph: "p",
  heading_1: "h1",
  heading_2: "h2",
  heading_3: "h3",
  quote: "quote",
  callout: "callout",
  bulleted_list_item: "li",
  numbered_list_item: "oli",
  to_do: "todo",
  toggle: "p", // 접기 블록은 제목 줄만 보여 준다
};

function convert(raw: RawBlock): Block | null {
  if (raw.type === "divider") return { type: "divider", id: raw.id };
  if (raw.type === "image") {
    const img = raw.image as { caption?: RichText[] };
    return { type: "image", id: raw.id, caption: (img.caption ?? []).map((c) => c.plain_text ?? "").join("") };
  }
  const t = TEXT_TYPES[raw.type];
  if (!t) return null; // 표·임베드·데이터베이스 등은 아직 보여 주지 않는다
  const body = raw[raw.type] as { rich_text?: RichText[]; checked?: boolean; icon?: { emoji?: string }; color?: string };
  return {
    type: t,
    id: raw.id,
    spans: spansOf(body.rich_text),
    checked: t === "todo" ? body.checked === true : undefined,
    icon: t === "callout" ? body.icon?.emoji : undefined,
    // 콜아웃 색 (포스트잇 색을 고르는 데 쓴다)
    color: t === "callout" && typeof body.color === "string" ? body.color : undefined,
  } as Block;
}

// 본문 블록 전부 (한 단계만. 블록 안의 블록은 펼치지 않는다)
export async function getPageBlocks(pageId: string): Promise<Block[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: REVALIDATE_SECONDS, expire: 3600 });

  const out: Block[] = [];
  let cursor: string | undefined;
  do {
    const q = new URLSearchParams({ page_size: "100", ...(cursor ? { start_cursor: cursor } : {}) });
    const data = await notionGet<{ results: RawBlock[]; has_more: boolean; next_cursor: string | null }>(
      `/blocks/${pageId}/children?${q}`,
    );
    for (const raw of data.results) {
      const b = convert(raw);
      if (b) out.push(b);
    }
    cursor = data.has_more && data.next_cursor ? data.next_cursor : undefined;
  } while (cursor);
  return out;
}

// 본문 사진 블록 ID 목록 (사진첩용)
export function imageBlocks(blocks: Block[]): { id: string; caption: string }[] {
  return blocks.filter((b): b is Extract<Block, { type: "image" }> => b.type === "image");
}
