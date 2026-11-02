// 여권 입국 도장. 나라마다 모양·잉크 색·기울기가 정해져 있어 같은 나라는 항상 같은 도장이 찍힌다.
import { SCHOOL } from "@/lib/config";

const INKS = ["var(--terracotta)", "var(--sea)", "var(--pink)", "#2f4bb8"];
const TILTS = [-9, 6, -4, 11, -13, 3, 8, -6];
const DOT = "var(--font-dot)";

type Props = {
  code: string; // 나라 코드 (ES)
  name: string; // 나라 이름 (스페인)
  date?: string | null; // 첫 방문일 (YYYY-MM-DD). 없으면 아직 안 찍힌 도장
  size?: number;
  mini?: boolean; // 목록용 작은 도장 (코드만)
};

export function PassportStamp({ code, name, date, size = 150, mini = false }: Props) {
  const hash = code.charCodeAt(0) * 3 + code.charCodeAt(1);
  const visited = Boolean(date);
  const ink = visited ? INKS[hash % INKS.length] : "var(--muted)";
  const tilt = TILTS[hash % TILTS.length];
  const when = date ? date.replaceAll("-", ".") : "NOT YET";
  const year = SCHOOL.semesterStart.slice(0, 4);

  if (mini) {
    return (
      <svg width={size} height={size} viewBox="0 0 60 60" className="shrink-0" style={{ transform: `rotate(${tilt}deg)` }} aria-hidden>
        <circle cx="30" cy="30" r="27" fill="none" stroke={ink} strokeWidth="2.5" />
        <circle cx="30" cy="30" r="22" fill="none" stroke={ink} strokeWidth="1" />
        <text x="30" y="36" textAnchor="middle" fontSize="16" fontWeight="700" fill={ink} style={{ fontFamily: DOT }}>
          {code}
        </text>
      </svg>
    );
  }

  const shape = hash % 3;
  const filterId = `ink-${code}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      className="block shrink-0"
      style={{ transform: `rotate(${tilt}deg)`, opacity: visited ? 0.92 : 0.45 }}
      role="img"
      aria-label={`${name} 입국 도장 ${when}`}
    >
      {/* 잉크가 군데군데 빠진 느낌 */}
      <filter id={filterId}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={hash % 50} result="noise" />
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3 2.5" result="mask" />
        <feComposite in="SourceGraphic" in2="mask" operator="in" />
      </filter>
      <g filter={`url(#${filterId})`} fill={ink} style={{ fontFamily: DOT }}>
        {shape === 0 && (
          <>
            <circle cx="80" cy="80" r="74" fill="none" stroke={ink} strokeWidth="4" />
            <circle cx="80" cy="80" r="67" fill="none" stroke={ink} strokeWidth="1.5" />
            <circle cx="80" cy="80" r="47" fill="none" stroke={ink} strokeWidth="1.5" />
            <path id={`arc-${code}`} d="M 80 80 m -53 0 a 53 53 0 1 1 106 0 a 53 53 0 1 1 -106 0" fill="none" />
            <text fontSize="12" letterSpacing="2.4">
              <textPath href={`#arc-${code}`}>ENTRY ★ MÁLAGA {year} ★ ENTRY ★</textPath>
            </text>
            <text x="80" y="82" textAnchor="middle" fontSize="32" fontWeight="700">{code}</text>
            <text x="80" y="99" textAnchor="middle" fontSize="11">{when}</text>
            <text x="80" y="113" textAnchor="middle" fontSize="11">{name}</text>
          </>
        )}
        {shape === 1 && (
          <>
            <rect x="8" y="30" width="144" height="100" fill="none" stroke={ink} strokeWidth="4" />
            <rect x="14" y="36" width="132" height="88" fill="none" stroke={ink} strokeWidth="1.5" />
            <text x="80" y="53" textAnchor="middle" fontSize="12" letterSpacing="3">★ ADMITTED ★</text>
            <line x1="14" y1="60" x2="146" y2="60" stroke={ink} strokeWidth="1.5" strokeDasharray="4 3" />
            <text x="48" y="100" textAnchor="middle" fontSize="36" fontWeight="700">{code}</text>
            <text x="114" y="88" textAnchor="middle" fontSize="11">{name}</text>
            <text x="114" y="104" textAnchor="middle" fontSize="11">{when}</text>
            <text x="80" y="119" textAnchor="middle" fontSize="9" letterSpacing="1">MÁLAGA {year}</text>
          </>
        )}
        {shape === 2 && (
          <>
            <polygon points="50,6 110,6 154,50 154,110 110,154 50,154 6,110 6,50" fill="none" stroke={ink} strokeWidth="4" />
            <polygon points="53,14 107,14 146,53 146,107 107,146 53,146 14,107 14,53" fill="none" stroke={ink} strokeWidth="1.5" />
            <text x="80" y="42" textAnchor="middle" fontSize="12" letterSpacing="3">ARRIVED</text>
            <text x="80" y="88" textAnchor="middle" fontSize="38" fontWeight="700">{code}</text>
            <text x="80" y="108" textAnchor="middle" fontSize="11">{name}</text>
            <text x="80" y="125" textAnchor="middle" fontSize="11">{when}</text>
          </>
        )}
      </g>
    </svg>
  );
}
