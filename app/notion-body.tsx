// 노션 본문 블록을 화면에 그린다. 글자는 모두 글자로만 넣는다 (HTML로 해석하지 않는다).
import type { ReactNode } from "react";
import type { Block, Span } from "@/lib/blocks";
import { blockImageSrc } from "@/lib/image";

function Spans({ spans }: { spans: Span[] }) {
  return (
    <>
      {spans.map((s, i) => {
        let node: ReactNode = s.text;
        if (s.bold) node = <strong>{node}</strong>;
        if (s.italic) node = <em>{node}</em>;
        if (s.href)
          node = (
            <a href={s.href} target="_blank" rel="noopener noreferrer nofollow" className="text-sea underline underline-offset-2">
              {node}
            </a>
          );
        return <span key={i}>{node}</span>;
      })}
    </>
  );
}

type TextBlock = Exclude<Block, { type: "image" } | { type: "divider" }>;

// 노션 콜아웃 → 포스트잇 메모. 노션에서 고른 색으로 포스트잇 색을 정한다 (그 외는 노랑).
const NOTE_COLORS: Record<string, string> = {
  pink: "bg-[#ffd9ec] border-[#f4a8cc]",
  red: "bg-[#ffd9ec] border-[#f4a8cc]",
  blue: "bg-[#d7eef5] border-[#a8d4e4]",
  green: "bg-[#dff3d8] border-[#b5dca6]",
  purple: "bg-[#ebe0fa] border-[#cdb8ef]",
};
const NOTE_YELLOW = "bg-[#fff3a8] border-[#f0d860]";

// 블록 번호로 기울기를 정해서, 새로고침해도 같은 모양으로 보이게 한다
function tiltOf(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return ["-rotate-[1.5deg]", "rotate-[1deg]", "-rotate-[0.6deg]", "rotate-[1.8deg]"][n % 4];
}

function StickyNote({ b }: { b: TextBlock }) {
  const color = NOTE_COLORS[(b.color ?? "").replace("_background", "")] ?? NOTE_YELLOW;
  const text = b.spans.map((s) => s.text).join("");
  // 짧은 메모는 큰 화면에서 오른쪽에 붙여 글이 옆으로 흐르게, 긴 메모는 본문 사이에 붙인다
  const side = text.length <= 40 ? "sm:float-right sm:my-1 sm:ml-5 sm:w-48" : "max-w-[90%]";
  return (
    <aside className={`dot my-4 w-fit border px-3 py-2 text-[13px] leading-snug text-ink ${color} ${tiltOf(b.id)} ${side}`}>
      {b.icon && <span className="mr-1">{b.icon}</span>}
      <Spans spans={b.spans} />
    </aside>
  );
}

function One({ b }: { b: Exclude<Block, { type: "li" } | { type: "oli" }> }) {
  switch (b.type) {
    case "divider":
      return <hr className="clear-both my-6 border-line" />;
    case "image":
      return (
        <figure className="clear-both my-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={blockImageSrc(b.id)} alt={b.caption || "사진"} loading="lazy" decoding="async" className="w-full border border-line bg-sand-pale" />
          {b.caption && <figcaption className="label mt-1.5 text-center">{b.caption}</figcaption>}
        </figure>
      );
    case "h1":
      return <h2 className="clear-both mt-8 mb-2 text-xl font-bold"><Spans spans={b.spans} /></h2>;
    case "h2":
      return <h3 className="clear-both mt-6 mb-2 text-lg font-bold"><Spans spans={b.spans} /></h3>;
    case "h3":
      return <h4 className="clear-both mt-5 mb-1.5 font-bold text-sea"><Spans spans={b.spans} /></h4>;
    case "quote":
      return <blockquote className="my-4 border-l-2 border-terracotta pl-4 text-ink/80"><Spans spans={b.spans} /></blockquote>;
    case "callout":
      return <StickyNote b={b} />;
    case "todo":
      return (
        <p className="my-1 flex gap-2">
          <span aria-hidden>{b.checked ? "☑" : "☐"}</span>
          <span className={b.checked ? "text-muted line-through" : ""}><Spans spans={b.spans} /></span>
        </p>
      );
    default:
      // 빈 문단은 줄 간격으로
      return b.spans.length === 0 ? <div className="h-3" /> : <p className="my-2.5"><Spans spans={(b as TextBlock).spans} /></p>;
  }
}

export function NotionBody({ blocks }: { blocks: Block[] }) {
  // 이어지는 목록 줄은 하나의 목록으로 묶는다
  const groups: (Block | { list: "ul" | "ol"; items: TextBlock[] })[] = [];
  for (const b of blocks) {
    const kind = b.type === "li" ? "ul" : b.type === "oli" ? "ol" : null;
    const last = groups[groups.length - 1];
    if (kind && last && "list" in last && last.list === kind) last.items.push(b as TextBlock);
    else if (kind) groups.push({ list: kind, items: [b as TextBlock] });
    else groups.push(b);
  }

  if (blocks.length === 0) return <p className="text-sm text-muted">노션 본문이 아직 비어 있어요.</p>;

  return (
    <div className="flow-root font-sans text-[15px] leading-relaxed">
      {groups.map((g, i) =>
        "list" in g ? (
          g.list === "ul" ? (
            <ul key={i} className="my-2.5 list-disc overflow-hidden pl-5">
              {g.items.map((it) => <li key={it.id} className="my-1"><Spans spans={it.spans} /></li>)}
            </ul>
          ) : (
            <ol key={i} className="my-2.5 list-decimal overflow-hidden pl-5">
              {g.items.map((it) => <li key={it.id} className="my-1"><Spans spans={it.spans} /></li>)}
            </ol>
          )
        ) : (
          <One key={g.id} b={g as Exclude<Block, { type: "li" } | { type: "oli" }>} />
        ),
      )}
    </div>
  );
}
