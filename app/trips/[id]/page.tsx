// 여행 상세 (DESIGN §1 /trips/[id]) — 기간·나라·도시, 노션 본문(글·사진)
// 비공개 여행은 비밀번호 확인 전엔 존재 자체를 알리지 않는다(없음 화면).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { REVALIDATE_SECONDS } from "@/lib/config";
import { getPageBlocks } from "@/lib/blocks";
import { nameOf } from "@/lib/countries";
import { getTrip } from "@/lib/diary-data";
import { dayOf } from "@/lib/dates";
import { normalizeId } from "@/lib/image";
import { isUnlocked } from "@/lib/viewer";
import { NotionBody } from "../../notion-body";
import { NotionImage } from "../../notion-image";

export const metadata: Metadata = { title: "여행" };

export default function TripPage({ params }: PageProps<"/trips/[id]">) {
  return (
    <Suspense fallback={<p className="card text-sm text-muted">불러오는 중…</p>}>
      <TripLoader params={params} />
    </Suspense>
  );
}

async function TripLoader({ params }: { params: PageProps<"/trips/[id]">["params"] }) {
  const id = normalizeId((await params).id);
  if (!id) notFound();
  return <TripContent id={id} unlocked={await isUnlocked()} />;
}

async function TripContent({ id, unlocked }: { id: string; unlocked: boolean }) {
  "use cache";
  cacheLife({ stale: 60, revalidate: REVALIDATE_SECONDS, expire: 3600 });

  const trip = await getTrip(id, unlocked);
  if (!trip) notFound();
  const blocks = await getPageBlocks(trip.id);
  const start = trip.period ? dayOf(trip.period.start).replaceAll("-", ".") : "";
  const end = trip.period?.end ? dayOf(trip.period.end).replaceAll("-", ".") : "";

  return (
    <article className="card mx-auto max-w-2xl p-5 sm:p-8">
      <Link href="/map" className="label hover:text-sea">
        ← 지도
      </Link>
      <p className="dot mt-5 text-xs text-terracotta">
        {start}
        {end && end !== start ? ` – ${end}` : ""}
      </p>
      <h1 className="mt-1.5 text-2xl font-bold leading-snug sm:text-3xl">{trip.title}</h1>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {trip.countries.map((c) => (
          <Link key={c} href={`/map/${c.toLowerCase()}`} className="stamp hover:bg-terracotta hover:text-white">
            {c} {nameOf(c)}
          </Link>
        ))}
        {trip.place && <span className="chip">{trip.place}</span>}
      </div>
      {trip.summary && <p className="mt-4 text-lg leading-relaxed">{trip.summary}</p>}
      {trip.hasCover && <NotionImage pageId={trip.id} alt={trip.title} className="mt-6 w-full border border-line bg-sand-pale" />}
      <div className="mt-6">
        <NotionBody blocks={blocks} />
      </div>
    </article>
  );
}
