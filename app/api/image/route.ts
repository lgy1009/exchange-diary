// GET /api/image?page=<노션 페이지 ID>&prop=대표 사진&i=0   — 대표 사진 (DESIGN §4)
// GET /api/image?block=<노션 블록 ID>                       — 본문 사진
// 노션에서 지금 유효한 사진 주소를 받아 그리로 이동시킨다. 노션 응답에 있던 주소로만 이동한다.
//   400 형식 오류 / 404 없음(우리 데이터베이스 밖의 페이지 포함) / 403 비공개 항목인데 비밀번호 확인 전
import type { NextRequest } from "next/server";
import { IMAGE_PROPS, lookupBlockImage, lookupImage, normalizeId, type ImageProp } from "@/lib/image";
import { isUnlocked } from "@/lib/viewer";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const blockId = q.has("block") ? normalizeId(q.get("block") ?? "") : null;
  const pageId = normalizeId(q.get("page") ?? "");
  const prop = q.get("prop") ?? "대표 사진";
  const index = Number(q.get("i") ?? "0");
  const badPage = !pageId || !IMAGE_PROPS.includes(prop as ImageProp) || !Number.isInteger(index) || index < 0 || index > 20;
  if (q.has("block") ? !blockId : badPage) {
    return new Response("잘못된 요청", { status: 400 });
  }

  let found;
  try {
    found = blockId ? await lookupBlockImage(blockId) : await lookupImage(pageId!, prop as ImageProp, index);
  } catch {
    return new Response("사진을 잠시 불러올 수 없습니다", { status: 502 });
  }
  if (!found.ok) return new Response("사진 없음", { status: 404 });
  if (!found.isPublic && !(await isUnlocked())) return new Response("비공개", { status: 403 });

  return new Response(null, {
    status: 302,
    headers: {
      Location: found.url,
      // 공개 사진은 브라우저가 20분 동안 이 이동을 기억한다 (노션 주소 유효 시간보다 짧게)
      // 비공개 사진은 기억하지 않는다
      "Cache-Control": found.isPublic ? "public, max-age=1200" : "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
