// 유럽 지도 (서버에서 그리는 SVG 그림). 다녀온 나라를 색칠하고, 누르면 나라 페이지로 간다.
// 지도 모양은 lib/europe-map.data.ts(미리 만든 파일)만 쓴다. 방문자는 지도 라이브러리를 받지 않는다.
import { SCHOOL } from "@/lib/config";
import { nameOf } from "@/lib/countries";
import { MAP_COUNTRIES, MAP_HEIGHT, MAP_WIDTH, MERCATOR } from "@/lib/europe-map.data";

// 위도·경도 → 그림 좌표 (build-europe-map.mjs와 같은 메르카토르 투영)
function project(lat: number, lng: number): [number, number] {
  const rad = Math.PI / 180;
  const x = MERCATOR.translate[0] + MERCATOR.scale * lng * rad;
  const y = MERCATOR.translate[1] - MERCATOR.scale * Math.log(Math.tan(Math.PI / 4 + (lat * rad) / 2));
  return [x, y];
}

export type MapPoint = { lat: number; lng: number; title: string };

export function EuropeMap({
  visits,
  points = [],
  focus,
  labels = false,
  compact = false,
  className = "",
}: {
  visits: Record<string, number>; // 나라 코드 → 여행·일기 수
  points?: MapPoint[]; // 여행지 좌표 (학교에서 점선으로 잇는다)
  focus?: string; // 나라 페이지에서 강조할 나라
  labels?: boolean; // 다녀온 나라 이름표
  compact?: boolean; // 홈 카드용: 감싼 칸 크기에 맞춰 채우고, 넘치는 부분은 북쪽부터 잘라 낸다
  className?: string;
}) {
  const viewBox = `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`;
  const top = 0;
  const [hx, hy] = project(SCHOOL.lat, SCHOOL.lng);
  const fillOf = (code: string | null) => {
    const n = code ? (visits[code] ?? 0) : 0;
    if (focus && code === focus) return "var(--sea)";
    if (n >= 2) return "var(--terracotta)";
    if (n === 1) return "var(--terracotta-soft)";
    return "var(--sand-pale)";
  };

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio={compact ? "xMidYMax slice" : undefined}
      className={`block w-full ${compact ? "h-full bg-sea-pale" : "h-auto"} ${className}`}
      role="img"
      aria-label="다녀온 나라를 색칠한 유럽 지도"
    >
      <rect y={top} width={MAP_WIDTH} height={MAP_HEIGHT - top} fill="var(--sea-pale)" rx={compact ? 0 : 18} />
      {MAP_COUNTRIES.map((c, i) => {
        const shape = <path d={c.d} fill={fillOf(c.code)} stroke="var(--card)" strokeWidth={1.2} />;
        const visited = c.code && (visits[c.code] ?? 0) > 0;
        return visited ? (
          <a key={i} href={`/map/${c.code!.toLowerCase()}`} className="cursor-pointer hover:opacity-80">
            <title>{`${nameOf(c.code!)} — ${visits[c.code!]}건`}</title>
            {shape}
          </a>
        ) : (
          <g key={i}>{shape}</g>
        );
      })}

      {/* 학교에서 여행지로 가는 점선 */}
      {points.map((p, i) => {
        const [x, y] = project(p.lat, p.lng);
        const mx = (hx + x) / 2;
        const my = Math.min(hy, y) - Math.abs(x - hx) * 0.25; // 위로 볼록한 곡선
        return (
          <g key={i}>
            <path d={`M${hx},${hy} Q${mx},${my} ${x},${y}`} fill="none" stroke="var(--sea)" strokeWidth={2} strokeDasharray="6 6" />
            <circle cx={x} cy={y} r={6} fill="var(--card)" stroke="var(--sea)" strokeWidth={2.5}>
              <title>{p.title}</title>
            </circle>
          </g>
        );
      })}

      {/* 다녀온 나라 이름표 */}
      {labels &&
        MAP_COUNTRIES.filter((c) => c.code && c.label && (visits[c.code] ?? 0) > 0).map((c) => (
          <text
            key={c.code}
            x={c.label![0]}
            y={c.label![1]}
            textAnchor="middle"
            dominantBaseline="middle"
            className="pointer-events-none"
            style={{ font: "600 20px var(--font-sans)", fill: "var(--card)", paintOrder: "stroke", stroke: "rgba(0,0,0,.3)", strokeWidth: 3 }}
          >
            {nameOf(c.code!)}
          </text>
        ))}

      {/* 학교(말라가) 핀 */}
      <g>
        <circle cx={hx} cy={hy} r={11} fill="var(--sea)" stroke="var(--card)" strokeWidth={3} />
        <title>{`${SCHOOL.city} (학교)`}</title>
      </g>
    </svg>
  );
}
