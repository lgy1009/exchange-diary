// 일기 (DESIGN §1 /diary) — 날짜순 카드. 공개는 사진·제목, 비공개는 자물쇠
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { REVALIDATE_SECONDS } from "@/lib/config";
import { getDiaryData } from "@/lib/diary-data";
import { dayOf, short } from "@/lib/dates";
import { nameOf } from "@/lib/countries";
import { isLocked } from "@/lib/transform";
import { isUnlocked } from "@/lib/viewer";
import { NotionImage } from "../notion-image";

export const metadata: Metadata = { title: "일기" };

export default function DiaryPage() {
  return (
    <Suspense fallback={<p className="card text-sm text-muted">불러오는 중…</p>}>
      <DiaryLoader />
    </Suspense>
  );
}

async function DiaryLoader() {
  return <DiaryContent unlocked={await isUnlocked()} />;
}

async function DiaryContent({ unlocked }: { unlocked: boolean }) {
  "use cache";
  cacheLife({ stale: 60, revalidate: REVALIDATE_SECONDS, expire: 3600 });

  const { entries } = await getDiaryData(unlocked);

  return (
    <div className="flex flex-col gap-2.5">
      <section className="card flex items-baseline justify-between">
        <h1 className="text-lg font-semibold">
          일기 <span className="display text-sea">{entries.length}</span>
        </h1>
        <p className="dot text-xs text-muted">DIARY</p>
      </section>
      {entries.length === 0 && <p className="card text-sm text-muted">아직 일기가 없어요.</p>}
      <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
        {entries.map((e) => {
          const date = e.date ? short(dayOf(e.date.start)) : "";
          return (
            <li key={e.id}>
              <Link href={`/diary/${e.id}`} className="card group block p-2.5 hover:bg-white">
                {isLocked(e) ? (
                  <>
                    <div className="flex aspect-[4/3] items-center justify-center border-[1.5px] border-ink bg-paper text-2xl">🔒</div>
                    <p className="dot mt-2 text-xs text-terracotta">{date}</p>
                    <p className="mt-0.5 text-sm text-muted">비공개 일기</p>
                  </>
                ) : (
                  <>
                    {e.hasCover ? (
                      <NotionImage pageId={e.id} alt={e.title} className="aspect-[4/3] w-full border-[1.5px] border-ink bg-sand-pale" />
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center border-[1.5px] border-ink bg-sea-pale text-2xl">
                        {e.mood?.split(" ")[0] ?? "✎"}
                      </div>
                    )}
                    <p className="dot mt-2 text-xs text-terracotta">
                      {date} · {e.country}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm font-semibold group-hover:text-sea">{e.title}</p>
                    <p className="label mt-0.5 truncate">{[e.place || nameOf(e.country), ...e.tags.map((t) => `#${t}`)].join("  ")}</p>
                  </>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
