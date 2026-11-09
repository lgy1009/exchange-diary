// 버킷리스트 — 노션 "버킷리스트" 표. 비밀번호 없이 볼 때는 공개 체크된 것만 보인다.
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { REVALIDATE_SECONDS, SCHOOL } from "@/lib/config";
import { getDiaryData } from "@/lib/diary-data";
import { short } from "@/lib/dates";
import { isUnlocked } from "@/lib/viewer";
import type { BucketItem } from "@/lib/types";
import { Progress } from "../progress";

export const metadata: Metadata = { title: "버킷리스트" };

export default function BucketPage() {
  return (
    <Suspense fallback={<p className="card text-sm text-muted">불러오는 중…</p>}>
      <BucketLoader />
    </Suspense>
  );
}

async function BucketLoader() {
  return <BucketContent unlocked={await isUnlocked()} />;
}

async function BucketContent({ unlocked }: { unlocked: boolean }) {
  "use cache";
  cacheLife({ stale: 60, revalidate: REVALIDATE_SECONDS, expire: 3600 });

  const { bucket } = await getDiaryData(unlocked);
  const done = bucket.filter((b) => b.done).length;

  return (
    <div className="flex flex-col gap-2.5">
      <section className="card !bg-paper">
        <p className="dot text-xs text-muted">BUCKET LIST · {SCHOOL.city.toUpperCase()} {SCHOOL.semesterStart.slice(0, 4)}</p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <h1 className="text-xl font-bold text-sea">말라가에서 하고 싶은 것</h1>
          <p className="display shrink-0 text-3xl text-terracotta">
            {done}
            <span className="text-lg text-muted"> / {bucket.length}</span>
          </p>
        </div>
        <Progress done={done} total={bucket.length} className="mt-3 h-3" />
      </section>

      <section className="card">
        {bucket.length === 0 && <p className="text-sm text-muted">노션 「버킷리스트」에 하고 싶은 것을 적어 주세요.</p>}
        <ul className="retro-list flex flex-col">
          {bucket.map((b) => (
            <BucketRow key={b.id} b={b} />
          ))}
        </ul>
      </section>
      <Link href="/" className="label self-start hover:text-sea">
        ← 홈으로
      </Link>
    </div>
  );
}

function BucketRow({ b }: { b: BucketItem }) {
  return (
    <li className="flex items-start gap-2.5 py-1">
      <span aria-hidden className={`mt-0.5 text-lg leading-none ${b.done ? "text-terracotta" : "text-muted"}`}>
        {b.done ? "☑" : "☐"}
      </span>
      <div className="min-w-0 flex-1">
        <p className={b.done ? "text-muted line-through decoration-sea/60" : ""}>
          {b.title}
          {b.done && <span className="sr-only"> (완료)</span>}
        </p>
        {b.memo && <p className="mt-0.5 text-xs text-muted">{b.memo}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {b.category && <span className="chip">{b.category}</span>}
        {b.done && b.doneAt && <span className="dot text-xs text-terracotta">{short(b.doneAt)}</span>}
      </div>
    </li>
  );
}
