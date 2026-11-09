// 일기 상세 (DESIGN §1 /diary/[id]) — 본문·사진·기분·태그. 비공개는 비밀번호 확인 전엔 본문을 읽지도 않는다.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { REVALIDATE_SECONDS } from "@/lib/config";
import { getPageBlocks } from "@/lib/blocks";
import { nameOf } from "@/lib/countries";
import { getEntry } from "@/lib/diary-data";
import { dayOf } from "@/lib/dates";
import { normalizeId } from "@/lib/image";
import { isLocked } from "@/lib/transform";
import { isUnlocked } from "@/lib/viewer";
import { NotionBody } from "../../notion-body";
import { NotionImage } from "../../notion-image";
import { BlogButton } from "../../blog-link";

export const metadata: Metadata = { title: "일기" };

export default function EntryPage({ params }: PageProps<"/diary/[id]">) {
  return (
    <Suspense fallback={<p className="card text-sm text-muted">불러오는 중…</p>}>
      <EntryLoader params={params} />
    </Suspense>
  );
}

async function EntryLoader({ params }: { params: PageProps<"/diary/[id]">["params"] }) {
  const id = normalizeId((await params).id);
  if (!id) notFound();
  return <EntryContent id={id} unlocked={await isUnlocked()} />;
}

async function EntryContent({ id, unlocked }: { id: string; unlocked: boolean }) {
  "use cache";
  cacheLife({ stale: 60, revalidate: REVALIDATE_SECONDS, expire: 3600 });

  const entry = await getEntry(id, unlocked);
  if (!entry) notFound();

  if (isLocked(entry)) {
    // 비공개: 날짜와 자물쇠만. 본문은 노션에서 읽지 않는다.
    return (
      <article className="card mx-auto flex max-w-xl flex-col items-center py-14 text-center">
        <p className="text-4xl">🔒</p>
        <p className="dot mt-4 text-sm text-terracotta">{entry.date ? dayOf(entry.date.start).replaceAll("-", ".") : ""}</p>
        <h1 className="mt-2 text-lg font-semibold">비공개 일기예요</h1>
        <p className="label mt-1">비밀번호를 입력하면 볼 수 있어요.</p>
        <Link href={`/unlock?next=/diary/${entry.id}`} className="mt-6 btn">
          비밀번호 입력
        </Link>
        <Link href="/diary" className="label mt-4 hover:text-sea">
          ← 일기 목록
        </Link>
      </article>
    );
  }

  const blocks = await getPageBlocks(entry.id);

  return (
    <article className="card mx-auto max-w-2xl p-5 sm:p-8">
      <Link href="/diary" className="label hover:text-sea">
        ← 일기 목록
      </Link>
      <p className="dot mt-5 text-sm text-terracotta">
        {entry.date ? dayOf(entry.date.start).replaceAll("-", ".") : ""} · {nameOf(entry.country)}
        {entry.place ? ` · ${entry.place}` : ""}
      </p>
      <h1 className="mt-1.5 text-2xl font-bold leading-snug sm:text-3xl">{entry.title}</h1>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {entry.mood && <span className="chip chip-pink">{entry.mood}</span>}
        {entry.tags.map((t) => (
          <span key={t} className="chip">
            #{t}
          </span>
        ))}
        {!entry.isPublic && <span className="chip">🔒 나만 보기</span>}
      </div>
      {entry.hasCover && <NotionImage pageId={entry.id} alt={entry.title} className="mt-6 w-full border border-line bg-sand-pale" />}
      <div className="mt-6">
        <NotionBody blocks={blocks} />
      </div>
      {entry.blog && <BlogButton href={entry.blog} />}
    </article>
  );
}
