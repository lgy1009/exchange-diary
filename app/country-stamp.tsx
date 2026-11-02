// 나라별 우표. 국기가 주인공이고, 같은 나라는 항상 같은 기울기로 놓인다.
import { SCHOOL } from "@/lib/config";
import { Flag } from "./flag";

const TILTS = [-4, 3, -2, 5, -5, 2, 4, -3];
const DOT = "var(--font-dot)";

type Props = { code: string; name: string; date?: string | null; size?: number };

const tiltOf = (code: string) => TILTS[(code.charCodeAt(0) * 3 + code.charCodeAt(1)) % TILTS.length];
const whenOf = (date?: string | null) => (date ? date.replaceAll("-", ".") : "NOT YET");

// 우표 테두리: 가장자리를 따라 작은 구멍이 파인 모양
function perforated(w: number, h: number, step: number) {
  const edge = (len: number, dx: number, dy: number) => {
    const n = Math.round(len / step);
    const s = len / n;
    const tab = s * 0.4;
    const hole = s - tab;
    let d = "";
    for (let i = 0; i < n; i++) {
      d += `l${(dx * tab) / 2} ${(dy * tab) / 2}`;
      d += `a${hole / 2} ${hole / 2} 0 0 0 ${dx * hole} ${dy * hole}`;
      d += `l${(dx * tab) / 2} ${(dy * tab) / 2}`;
    }
    return d;
  };
  return `M0 0${edge(w, 1, 0)}${edge(h, 0, 1)}${edge(w, -1, 0)}${edge(h, 0, -1)}Z`;
}

export function PostageStamp({ code, name, date, size = 136 }: Props) {
  const W = 136, H = 168;
  return (
    <svg
      width={size}
      height={(size * H) / W}
      viewBox={`-2 -2 ${W + 4} ${H + 4}`}
      className="block shrink-0"
      style={{ transform: `rotate(${tiltOf(code)}deg)`, opacity: date ? 1 : 0.45 }}
      role="img"
      aria-label={`${name} 우표 ${whenOf(date)}`}
    >
      <path d={perforated(W, H, 12)} fill="#fff" stroke="var(--sea-soft)" strokeWidth="1" />
      <text x={W / 2} y="21" textAnchor="middle" fontSize="9" fill="var(--muted)" letterSpacing="1" style={{ fontFamily: DOT }}>
        MÁLAGA {SCHOOL.semesterStart.slice(0, 4)}
      </text>
      <Flag code={code} x={14} y={27} width={108} />
      <text x={W / 2} y="124" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--ink)" style={{ fontFamily: DOT }}>
        {name}
      </text>
      <text x={W / 2} y="141" textAnchor="middle" fontSize="10" fill="var(--terracotta)" style={{ fontFamily: DOT }}>
        {whenOf(date)}
      </text>
      <text x={W / 2} y="155" textAnchor="middle" fontSize="9" fill="var(--muted)" style={{ fontFamily: DOT }}>
        {code}
      </text>
    </svg>
  );
}
