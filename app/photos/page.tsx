// 사진첩 (DESIGN §1 /photos) — 공개된 여행·일기의 대표 사진과 본문 사진을 최신순으로 모은다
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { REVALIDATE_SECONDS } from "@/lib/config";
import { getPageBlocks, imageBlocks } from "@/lib/blocks";
import { getDiaryData } from "@/lib/diary-data";
import { dayOf, short } from "@/lib/dates";
import { blockImageSrc, imageSrc } from "@/lib/image";
import { isLocked } from "@/lib/transform";
import { isUnlocked } from "@/lib/viewer";

export const metadata: Metadata = { title: "사진" };

type Photo = { key: string; src: string; href: string; title: string; date: string };

export default function PhotosPage() {
  return (
    <Suspense fallback={<p className="card text-sm text-muted">불러오는 중…</p>}>
      <PhotosLoader />
    </Suspense>
  );
}

async function PhotosLoader() {
  return <PhotosContent unlocked={await isUnlocked()} />;
}

async function PhotosContent({ unlocked }: { unlocked: boolean }) {
  "use cache";
  cacheLife({ stale: 60, revalidate: REVALIDATE_SECONDS, expire: 3600 });

  const data = await getDiaryData(unlocked);
  // 화면에 나갈 수 있는(걸러진) 여행·일기만 사진을 모은다
  const pages = [
    ...data.trips.map((t) => ({ id: t.id, title: t.title, date: t.period?.start ?? "", cover: t.hasCover, href: `/trips/${t.id}` })),
    ...data.entries.filter((e) => !isLocked(e)).map((e) => {
      const entry = e as Exclude<typeof e, { locked: true }>;
      return { id: entry.id, title: entry.title, date: entry.date?.start ?? "", cover: entry.hasCover, href: `/diary/${entry.id}` };
    }),
  ].sort((a, b) => b.date.localeCompare(a.date));

  // 본문 사진은 페이지마다 노션을 한 번씩 읽어야 해서, 5개씩 나눠 읽는다 (노션 호출 한도 보호)
  const bodies: Record<string, { id: string; caption: string }[]> = {};
  for (let i = 0; i < pages.length; i += 5) {
    const chunk = pages.slice(i, i + 5);
    const results = await Promise.all(chunk.map((p) => getPageBlocks(p.id).then(imageBlocks).catch(() => [])));
    chunk.forEach((p, j) => (bodies[p.id] = results[j]));
  }

  const photos: Photo[] = [];
  for (const p of pages) {
    const date = p.date ? short(dayOf(p.date)) : "";
    if (p.cover) photos.push({ key: `${p.id}-cover`, src: imageSrc(p.id), href: p.href, title: p.title, date });
    for (const img of bodies[p.id] ?? []) {
      photos.push({ key: img.id, src: blockImageSrc(img.id), href: p.href, title: img.caption || p.title, date });
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <section className="card flex items-baseline justify-between">
        <h1 className="text-lg font-semibold">
          사진 <span className="display text-sea">{photos.length}</span>
        </h1>
        <p className="dot text-xs text-muted">PHOTO</p>
      </section>
      {photos.length === 0 && (
        <p className="card text-sm text-muted">아직 사진이 없어요. 노션의 여행·일기에 대표 사진이나 본문 사진을 넣어 주세요.</p>
      )}
      <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5">
        {photos.map((ph) => (
          <li key={ph.key}>
            <Link href={ph.href} className="group relative block overflow-hidden rounded-lg bg-sand-pale" title={ph.title}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ph.src} alt={ph.title} loading="lazy" decoding="async" className="aspect-square w-full object-cover transition-transform group-hover:scale-105" />
              <span className="dot absolute bottom-1 left-1 rounded bg-card/85 px-1.5 text-[10px] text-terracotta">{ph.date}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
