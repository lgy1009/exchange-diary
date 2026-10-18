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

// 본문 사진 블록의 주소
export function blockImageSrc(blockId: string): string {
  return `/api/image?block=${encodeURIComponent(blockId)}`;
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

  const page = await ourPage(pageId);
  if (!page) return { ok: false, reason: "not-found" };

  const file = page.properties?.[prop]?.files?.[index];
  const url = fileUrl(file);
  if (!url) return { ok: false, reason: "not-found" };
  return { ok: true, url, isPublic: isPublicPage(page) };
}

// 본문 사진 블록. 블록이 속한 페이지가 우리 데이터베이스의 페이지일 때만, 그 페이지의 공개 여부를 따른다.
export async function lookupBlockImage(blockId: string): Promise<ImageLookup> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 1800, expire: 2700 });

  const block = await getOrNull<{ type?: string; image?: NotionFile; parent?: { type?: string; page_id?: string } }>(
    `/blocks/${blockId}`,
  );
  if (!block || block.type !== "image" || block.parent?.type !== "page_id" || !block.parent.page_id) {
    return { ok: false, reason: "not-found" };
  }
  const page = await ourPage(block.parent.page_id);
  if (!page) return { ok: false, reason: "not-found" };
  const url = fileUrl(block.image);
  if (!url) return { ok: false, reason: "not-found" };
  return { ok: true, url, isPublic: isPublicPage(page) };
}

// ---- 공통 ----

// 없는 페이지(404·400)만 null로 돌려주고, 노션 일시 장애는 오류로 올려 보내 캐시에 남기지 않는다
function getOrNull<T>(path: string): Promise<T | null> {
  return notionGet<T>(path).catch((e: unknown) => {
    if (/HTTP (400|404)/.test(String(e))) return null;
    throw e;
  });
}

// 우리 사이트의 여행·일기·프로필 데이터베이스에 속한 페이지만 돌려준다
async function ourPage(pageId: string): Promise<NotionPageResponse | null> {
  const page = await getOrNull<NotionPageResponse>(`/pages/${pageId}`);
  if (!page) return null;
  const dbs = await findDatabases();
  const allowed = [dbs.trips?.id, dbs.entries?.id, dbs.profile?.id].filter(Boolean).map((id) => id!.replace(/-/g, ""));
  const parent = page.parent?.database_id?.replace(/-/g, "");
  return parent && allowed.includes(parent) ? page : null;
}

// "공개" 열이 없는 데이터베이스(프로필)는 공개로 본다. 있으면 체크된 것만 공개.
function isPublicPage(page: NotionPageResponse): boolean {
  const publicProp = page.properties?.["공개"];
  return publicProp ? publicProp.checkbox === true : true;
}

function fileUrl(file: NotionFile | undefined): string | null {
  const url = file?.type === "external" ? file.external?.url : file?.file?.url;
  return url && url.startsWith("https://") ? url : null;
}
