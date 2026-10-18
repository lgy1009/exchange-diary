// 노션 사진을 사이트에서 보여 주기 위한 도우미. (DESIGN §4 /api/image)
// 노션이 주는 사진 주소는 약 1시간 뒤 만료되므로, 화면에는 우리 경로(/api/image?…)만 적고
// 그 경로가 요청될 때마다 서버가 노션에서 "지금 유효한 주소"를 받아 이동시킨다.

import { cacheLife } from "next/cache";
import { findDatabases, notionGet } from "./notion";

// 사진을 꺼낼 수 있는 열 (그 밖의 열 이름은 거절)
export const IMAGE_PROPS = ["대표 사진"] as const;
export type ImageProp = (typeof IMAGE_PROPS)[number];

// 화면에서 쓰는 사진 주소 만들기
export function imageSrc(pageId: string, prop: ImageProp = "대표 사진", index = 0): string {
  const q = new URLSearchParams({ page: pageId, prop, i: String(index) });
  return `/api/image?${q}`;
}

// 노션 페이지 ID 검사: 32자리 16진수(하이픈 있어도 됨)만 받아서 하이픈 넣은 모양으로 맞춘다
export function normalizeId(raw: string): string | null {
  const hex = raw.replace(/-/g, "").toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(hex)) return null;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export type ImageLookup =
  | { ok: true; url: string; isPublic: boolean }
  | { ok: false; reason: "not-found" };

type NotionFile = { type?: string; file?: { url?: string }; external?: { url?: string } };
type NotionPageResponse = {
  parent?: { type?: string; database_id?: string };
  properties?: Record<string, { type?: string; files?: NotionFile[]; checkbox?: boolean }>;
};

// 노션에서 사진 주소를 찾는다. 결과는 30분 재사용 (노션 주소 유효 시간 1시간보다 짧게).
// 이 결과에는 공개 여부도 들어 있어서, 비공개 판단은 부르는 쪽(경로)이 한다.
export async function lookupImage(pageId: string, prop: ImageProp, index: number): Promise<ImageLookup> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 1800, expire: 2700 });

  // 없는 페이지(404·400)만 "없음"으로 저장하고, 노션 일시 장애는 오류로 올려 보내 저장하지 않는다
  const page = await notionGet<NotionPageResponse>(`/pages/${pageId}`).catch((e: unknown) => {
    if (/HTTP (400|404)/.test(String(e))) return null;
    throw e;
  });
  if (!page) return { ok: false, reason: "not-found" };

  // 우리 사이트의 여행·일기·프로필 데이터베이스에 속한 페이지만 허용한다
  const dbs = await findDatabases();
  const allowed = [dbs.trips?.id, dbs.entries?.id, dbs.profile?.id].filter(Boolean).map((id) => id!.replace(/-/g, ""));
  const parent = page.parent?.database_id?.replace(/-/g, "");
  if (!parent || !allowed.includes(parent)) return { ok: false, reason: "not-found" };

  const file = page.properties?.[prop]?.files?.[index];
  const url = file?.type === "external" ? file.external?.url : file?.file?.url;
  if (!url || !url.startsWith("https://")) return { ok: false, reason: "not-found" };

  // "공개" 열이 없는 데이터베이스(프로필)는 공개로 본다. 있으면 체크된 것만 공개.
  const publicProp = page.properties?.["공개"];
  const isPublic = publicProp ? publicProp.checkbox === true : true;
  return { ok: true, url, isPublic };
}
