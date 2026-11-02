// 나라 페이지 (DESIGN §1 /map/[country]) — 그 나라 도장, 지도, 여행·일기 목록
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { REVALIDATE_SECONDS } from "@/lib/config";
import { COUNTRIES, nameOf, type CountryCode } from "@/lib/countries";
import { getDiaryData } from "@/lib/diary-data";
import { short } from "@/lib/dates";
import { travelStats, tripPoints, visitsOf } from "@/lib/stats";
import { isLocked } from "@/lib/transform";
import { isUnlocked } from "@/lib/viewer";
import { EuropeMap } from "../../europe-map";
import { EntryItem, TripItem } from "../../items";

// 목록에 있는 나라만 페이지를 미리 만든다 (그 밖의 주소는 404)
export function generateStaticParams() {
  return COUNTRIES.map((c) => ({ country: c.code.toLowerCase() }));
}

function toCode(param: string): CountryCode | null {
  const code = param.toUpperCase();
  return COUNTRIES.some((c) => c.code === code) ? (code as CountryCode) : null;
}

export async function generateMetadata({ params }: PageProps<"/map/[country]">): Promise<Metadata> {
  const code = toCode((await params).country);
  return { title: code ? nameOf(code) : "나라" };
}

export default function CountryPage({ params }: PageProps<"/map/[country]">) {
  return (
    <Suspense fallback={<p className="card text-sm text-muted">불러오는 중…</p>}>
      <CountryLoader params={params} />
    </Suspense>
  );
}

async function CountryLoader({ params }: { params: PageProps<"/map/[country]">["params"] }) {
  const code = toCode((await params).country);
  if (!code) notFound();
  return <CountryContent code={code} unlocked={await isUnlocked()} />;
}

async function CountryContent({ code, unlocked }: { code: CountryCode; unlocked: boolean }) {
  "use cache";
  cacheLife({ stale: 60, revalidate: REVALIDATE_SECONDS, expire: 3600 });

  const data = await getDiaryData(unlocked);
  const trips = data.trips.filter((t) => t.countries.includes(code));
  const entries = data.entries.filter((e) => !isLocked(e) && e.country === code);
  const stamp = travelStats(data).stamps.find((s) => s.code === code);

  return (
    <div className="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <section className="card flex flex-col">
        <Link href="/map" className="label hover:text-sea">
          ← 지도
        </Link>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-24 w-24 shrink-0 rotate-[-8deg] flex-col items-center justify-center rounded-full border-2 border-dashed border-terracotta text-terracotta">
            <span className="display text-3xl">{code}</span>
            <span className="dot text-xs">{stamp?.firstVisit ? short(stamp.firstVisit) : "NOT YET"}</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{nameOf(code)}</h1>
            <p className="label mt-1">
              여행 {trips.length} · 일기 {entries.length}
            </p>
          </div>
        </div>
        <EuropeMap visits={visitsOf(travelStats(data))} points={tripPoints(trips)} focus={code} className="mt-5" />
      </section>

      <div className="flex flex-col gap-2.5">
        <section>
          <h2 className="label mb-2 px-1">여행</h2>
          {trips.length === 0 && <p className="card text-sm text-muted">이 나라 여행 기록이 아직 없어요.</p>}
          <ul className="flex flex-col gap-2">
            {trips.map((t) => (
              <li key={t.id}>
                <TripItem trip={t} />
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="label mb-2 px-1">일기</h2>
          {entries.length === 0 && <p className="card text-sm text-muted">이 나라에서 쓴 공개 일기가 아직 없어요.</p>}
          <ul className="flex flex-col gap-2">
            {entries.map((e) => (
              <li key={e.id}>
                <EntryItem entry={e} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
