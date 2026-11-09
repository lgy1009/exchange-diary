// 여러 화면에서 같이 쓰는 목록 한 줄 (여행·일기)
import Link from "next/link";
import { dayOf, rangeLabel, short } from "@/lib/dates";
import { nameOf } from "@/lib/countries";
import { isLocked } from "@/lib/transform";
import type { Entry, LockedEntry, Trip } from "@/lib/types";
import { NotionImage } from "./notion-image";

export function TripItem({ trip }: { trip: Trip }) {
  return (
    <Link href={`/trips/${trip.id}`} className="card group flex gap-3 p-3 hover:bg-white">
      {trip.hasCover ? (
        <NotionImage pageId={trip.id} alt={trip.title} className="aspect-square w-20 shrink-0 border border-line bg-sand" />
      ) : (
        <div className="aspect-square w-20 shrink-0 border border-line bg-sea-pale" />
      )}
      <div className="min-w-0">
        <p className="dot text-xs text-terracotta">{trip.period ? rangeLabel(trip.period.start, trip.period.end) : ""}</p>
        <p className="mt-0.5 truncate font-semibold group-hover:text-sea">
          {trip.title}
          {trip.blog && <span className="ml-1 text-xs" title="블로그 글 있음">📖</span>}
        </p>
        <p className="label mt-0.5 truncate">
          {[trip.countries.map(nameOf).join(" · "), trip.place].filter(Boolean).join(" — ")}
        </p>
        {trip.summary && <p className="mt-1 line-clamp-2 text-sm">{trip.summary}</p>}
      </div>
    </Link>
  );
}

export function EntryItem({ entry }: { entry: Entry | LockedEntry }) {
  const date = entry.date ? short(dayOf(entry.date.start)) : "";
  if (isLocked(entry)) {
    return (
      <Link href={`/diary/${entry.id}`} className="card flex items-center gap-3 p-3 text-muted hover:bg-white">
        <span className="dot w-12 shrink-0 text-terracotta">{date}</span>
        <span>🔒 비공개 일기</span>
      </Link>
    );
  }
  return (
    <Link href={`/diary/${entry.id}`} className="card group flex items-center gap-3 p-3 hover:bg-white">
      <span className="dot w-12 shrink-0 text-terracotta">{date}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate group-hover:text-sea">
          {entry.title}
          {entry.blog && <span className="ml-1 text-xs" title="블로그 글 있음">📖</span>}
        </span>
        {entry.place && <span className="label block truncate">{entry.place}</span>}
      </span>
      {entry.mood && <span className="shrink-0 text-sm">{entry.mood.split(" ")[0]}</span>}
    </Link>
  );
}
