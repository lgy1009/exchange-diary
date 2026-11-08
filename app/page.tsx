// 홈 (미니홈피, DESIGN §1·§6) — 프로필 | 다녀온 나라 | 사진·최근 일기·방명록
import Link from "next/link";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { OWNER, REVALIDATE_SECONDS, SCHOOL, SITE } from "@/lib/config";
import { getDiaryData } from "@/lib/diary-data";
import { dayOf, semesterState, short, todayIn } from "@/lib/dates";
import { travelStats, tripPoints, visitsOf, type TravelStats } from "@/lib/stats";
import { isLocked } from "@/lib/transform";
import { isUnlocked } from "@/lib/viewer";
import type { DiaryData, Profile } from "@/lib/types";
import { LocalClock } from "./local-clock";
import { NotionImage } from "./notion-image";
import { EuropeMap, type MapPoint } from "./europe-map";
import { Flag } from "./flag";

export default function HomePage() {
  return (
    <Suspense fallback={<p className="card text-sm text-muted">불러오는 중…</p>}>
      <HomeLoader />
    </Suspense>
  );
}

async function HomeLoader() {
  return <HomeContent unlocked={await isUnlocked()} />;
}

// 노션 데이터와 "오늘" 계산을 함께 REVALIDATE_SECONDS 동안 재사용한다
async function HomeContent({ unlocked }: { unlocked: boolean }) {
  "use cache";
  cacheLife({ stale: 60, revalidate: REVALIDATE_SECONDS, expire: 3600 });

  const data = await getDiaryData(unlocked);
  const today = todayIn(SCHOOL.timeZone);
  const stats = travelStats(data);

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1.25fr)]">
      <ProfileCard profile={data.profile} today={today} />
      <CountriesCard stats={stats} points={tripPoints(data.trips)} />
      <div className="flex flex-col gap-2.5 sm:col-span-2 md:col-span-1">
        <PhotosCard data={data} />
        <DiaryCard data={data} />
        <GuestbookCard data={data} />
      </div>
    </div>
  );
}

// ---- ① 프로필 ----
function ProfileCard({ profile, today }: { profile: Profile | null; today: string }) {
  const s = semesterState(SCHOOL.semesterStart, SCHOOL.semesterEnd, today);
  const dday = s.phase === "before" ? `D-${s.daysLeft}` : s.phase === "during" ? `D+${s.day}` : "FIN.";
  return (
    <section className="card flex flex-col">
      {/* 휴대폰: 작은 사진 옆에 이름 / 큰 화면: 큰 사진 아래 이름 */}
      <div className="flex items-center gap-3 sm:block">
        {profile?.hasPhoto ? (
          <NotionImage
            pageId={profile.id}
            alt={`${OWNER.name} 대표 사진`}
            className="aspect-square w-24 shrink-0 border border-line bg-sand sm:aspect-[4/3] sm:w-full"
          />
        ) : (
          <div className="flex aspect-square w-24 shrink-0 items-end border border-line bg-sand p-2 text-[10px] text-ink sm:aspect-[4/3] sm:w-auto sm:p-3 sm:text-xs">
            노션 프로필에 대표 사진을 넣어 주세요
          </div>
        )}
        <div className="sm:mt-3">
          <p className="text-sm font-bold text-sea">{SITE.profileName}</p>
          <p className="label mt-0.5">{SCHOOL.nameKo}</p>
        </div>
      </div>
      {profile?.status && <p className="mt-3 leading-snug">{profile.status}</p>}
      {profile?.mood && (
        <p className="mt-3">
          <span className="chip chip-pink">TODAY is.. {profile.mood}</span>
        </p>
      )}
      {/* 미니홈피 BGM 자리: 재생은 하지 않고 노션에 적은 노래 제목만 보여 준다 */}
      {profile?.song && (
        <p className="mt-3 flex items-center gap-1.5 border border-dashed border-sea-soft bg-paper px-2 py-1.5 text-xs text-sea">
          <span className="shrink-0 font-bold">♬ BGM</span>
          <span className="marquee min-w-0 flex-1">
            <span>{profile.song}</span>
          </span>
        </p>
      )}
      <dl className="mt-auto grid grid-cols-2 gap-2 pt-5 text-center">
        <div className="border border-line bg-paper py-2">
          <dt className="label">말라가 지금</dt>
          <dd className="dot mt-0.5 text-lg text-sea">
            <LocalClock timeZone={SCHOOL.timeZone} />
          </dd>
        </div>
        <div className="border border-line bg-paper py-2">
          <dt className="label">{s.phase === "before" ? "출발까지" : s.phase === "during" ? "교환학생" : "학기"}</dt>
          <dd className="dot mt-0.5 text-lg text-terracotta">{dday}</dd>
        </div>
      </dl>
    </section>
  );
}

// ---- ② 다녀온 나라 (지도 + 도장) ----
function CountriesCard({ stats, points }: { stats: TravelStats; points: MapPoint[] }) {
  return (
    <section className="card flex flex-col">
      <div className="card-head">
        <h2 className="label">다녀온 나라</h2>
        <Link href="/map" className="label hover:text-sea">
          map +
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Count n={stats.countryCount} unit="countries" />
        <Count n={stats.cityCount} unit="cities" />
        <Count n={stats.entryCount} unit="diaries" />
      </div>
      {/* 휴대폰: 가로로 넓은 칸 / 큰 화면: 카드 남은 높이를 모두 채움 (넘치는 북쪽은 잘림) */}
      <div className="mt-3 aspect-[16/11] overflow-hidden border border-line md:aspect-auto md:min-h-56 md:flex-1">
        <EuropeMap visits={visitsOf(stats)} points={points} compact />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {stats.stamps.length === 0 && <p className="label">아직 모은 우표가 없어요.</p>}
        {stats.stamps.map((s) => (
          <Link key={s.code} href={`/map/${s.code.toLowerCase()}`} className="stamp hover:bg-terracotta hover:text-white" title={s.name}>
            <Flag code={s.code} width={15} /> {s.code} {s.firstVisit ? short(s.firstVisit) : ""}
          </Link>
        ))}
      </div>
    </section>
  );
}

function Count({ n, unit }: { n: number; unit: string }) {
  return (
    <div>
      <p className="dot text-xl text-terracotta">{n}</p>
      <p className="dot text-[10px] text-muted">{unit}</p>
    </div>
  );
}

// ---- ③ 사진 (공개 여행·일기 중 대표 사진이 있는 것) ----
const TILE_COLORS = ["bg-sea-pale", "bg-sand", "bg-pink-pale"];

function PhotosCard({ data }: { data: DiaryData }) {
  const withPhoto = [
    ...data.trips.filter((t) => t.hasCover).map((t) => ({ id: t.id, title: t.title, href: `/trips/${t.id}` })),
    ...data.entries
      .filter((e) => !isLocked(e) && e.hasCover)
      .map((e) => ({ id: e.id, title: isLocked(e) ? "" : e.title, href: `/diary/${e.id}` })),
  ].slice(0, 3);
  return (
    <section className="card">
      <div className="card-head">
        <h2 className="label">사진</h2>
        <Link href="/photos" className="label hover:text-sea">
          more +
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => {
          const p = withPhoto[i];
          const tile = `aspect-square border border-line ${TILE_COLORS[i]}`;
          return p ? (
            <Link key={p.id} href={p.href} className={`${tile} overflow-hidden`} title={p.title}>
              <NotionImage pageId={p.id} alt={p.title} className="h-full w-full" />
            </Link>
          ) : (
            <div key={i} className={`${tile} flex items-center justify-center opacity-60`}>
              <span className="dot text-[10px] text-ink/40">PHOTO</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---- ④ 최근 일기 ----
function DiaryCard({ data }: { data: DiaryData }) {
  const recent = data.entries.slice(0, 3);
  return (
    <section className="card">
      <div className="card-head">
        <h2 className="label">최근 일기</h2>
        <Link href="/diary" className="label hover:text-sea">
          more +
        </Link>
      </div>
      {recent.length === 0 && <p className="text-sm text-muted">아직 일기가 없어요.</p>}
      <ul className="retro-list flex flex-col text-sm">
        {recent.map((e) => (
          <li key={e.id}>
            <Link href={`/diary/${e.id}`} className="flex gap-2 hover:text-sea">
              <span className="dot w-10 shrink-0 text-terracotta">{e.date ? short(dayOf(e.date.start)) : ""}</span>
              <span className="truncate">{isLocked(e) ? "🔒 비공개 일기" : e.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---- ⑤ 방명록 (승인된 글만 들어온다) ----
function GuestbookCard({ data }: { data: DiaryData }) {
  const recent = data.guestbook.slice(0, 2);
  return (
    <section className="card">
      <div className="card-head">
        <h2 className="label">방명록</h2>
        <Link href="/guestbook" className="label hover:text-sea">
          write +
        </Link>
      </div>
      {recent.length === 0 && <p className="text-sm text-muted">첫 방명록을 남겨 주세요.</p>}
      <ul className="retro-list flex flex-col text-sm">
        {recent.map((g) => (
          <li key={g.id} className="truncate">
            <span className="text-sea">{g.name}</span> {g.message}
          </li>
        ))}
      </ul>
    </section>
  );
}
