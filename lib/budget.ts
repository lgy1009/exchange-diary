// 여행별 가계부. 노션 「가계부」 표에서 "여행" 칸이 그 여행으로 이어진 줄만 읽는다.
// 돈 기록이라 비밀번호를 푼 사람에게만 보인다. 부르는 쪽이 반드시 unlocked일 때만 부른다.

import { cacheLife } from "next/cache";
import { REVALIDATE_SECONDS } from "./config";
import { findDatabases, queryAll, type NotionPage } from "./notion";

export type BudgetLine = {
  id: string;
  title: string;
  day: string | null; // "YYYY-MM-DD"
  category: string; // 비어 있으면 "기타"
  currency: "EUR" | "KRW";
  amount: number; // 적은 금액 (그 통화 그대로)
  krw: number | null; // 원화 환산 (EUR인데 환율이 비어 있으면 null)
};

export type TripBudget = {
  lines: BudgetLine[]; // 날짜순
  totalKrw: number; // 원화로 바꿀 수 있는 것의 합
  totalEur: number; // 유로로 쓴 금액의 합
  missingRate: number; // 환율이 비어 원화 합계에서 빠진 줄 수
  byCategory: { name: string; krw: number }[]; // 많이 쓴 순
};

type Props = Record<string, unknown>;

function text(p: Props, name: string): string {
  const v = p[name] as { title?: { plain_text?: string }[]; rich_text?: { plain_text?: string }[] } | undefined;
  return (v?.title ?? v?.rich_text ?? []).map((t) => t.plain_text ?? "").join("").trim();
}
function select(p: Props, name: string): string | null {
  return (p[name] as { select?: { name?: string } | null } | undefined)?.select?.name ?? null;
}
function num(p: Props, name: string): number | null {
  const v = p[name] as { number?: number | null; formula?: { number?: number | null } } | undefined;
  const n = v?.number ?? v?.formula?.number ?? null;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function toLine(page: NotionPage): BudgetLine | null {
  const p = page.properties;
  if (select(p, "구분") && select(p, "구분") !== "지출") return null; // 수입·이체는 여행 지출이 아니다
  const amount = num(p, "금액");
  if (amount === null) return null;
  const currency = select(p, "통화") === "EUR" ? "EUR" : "KRW";
  const rate = num(p, "환율");
  const date = (p["날짜"] as { date?: { start?: string } | null } | undefined)?.date?.start;
  return {
    id: page.id,
    title: text(p, "내용") || "(내용 없음)",
    day: date ? date.slice(0, 10) : null,
    category: select(p, "카테고리") ?? "기타",
    currency,
    amount,
    krw: currency === "KRW" ? amount : rate ? amount * rate : null,
  };
}

export async function getTripBudget(tripId: string): Promise<TripBudget | null> {
  "use cache";
  cacheLife({ stale: 60, revalidate: REVALIDATE_SECONDS, expire: 3600 });

  const db = (await findDatabases()).budget;
  if (!db || db.properties["여행"]?.type !== "relation") return null; // 가계부나 "여행" 칸이 없으면 카드를 숨긴다

  const pages = await queryAll(db.id, { property: "여행", relation: { contains: tripId } });
  const lines = pages
    .map(toLine)
    .filter((l): l is BudgetLine => l !== null)
    .sort((a, b) => (a.day ?? "9999").localeCompare(b.day ?? "9999"));

  const cats = new Map<string, number>();
  for (const l of lines) if (l.krw !== null) cats.set(l.category, (cats.get(l.category) ?? 0) + l.krw);

  return {
    lines,
    totalKrw: lines.reduce((s, l) => s + (l.krw ?? 0), 0),
    totalEur: lines.filter((l) => l.currency === "EUR").reduce((s, l) => s + l.amount, 0),
    missingRate: lines.filter((l) => l.krw === null).length,
    byCategory: [...cats.entries()].map(([name, krw]) => ({ name, krw })).sort((a, b) => b.krw - a.krw),
  };
}
