// 작은 국기를 단순하게 그린 그림. 윈도우는 국기 이모지가 글자로 나와서 직접 그린다.
import type { ReactNode } from "react";
import type { CountryCode } from "@/lib/countries";

const R = "#d0202e", B = "#1f4e9e", G = "#17874a", Y = "#f7c531", W = "#ffffff", K = "#1b1b1b";

type Paint = (color: string) => { fill: string };

const W_ = 30, H_ = 20;
const rect = (p: Paint, c: string, x: number, y: number, w: number, h: number): ReactNode => <rect key={`${c}${x}${y}${w}`} x={x} y={y} width={w} height={h} {...p(c)} />;

// 가로줄 (비율을 주면 그 비율대로)
const hor = (colors: string[], parts?: number[]) => (p: Paint) => {
  const ratio = parts ?? colors.map(() => 1);
  const sum = ratio.reduce((a, b) => a + b, 0);
  let y = 0;
  return colors.map((c, i) => {
    const h = (ratio[i] / sum) * H_;
    const node = rect(p, c, 0, y, W_, h);
    y += h;
    return node;
  });
};
const ver = (colors: string[]) => (p: Paint) => colors.map((c, i) => rect(p, c, (i * W_) / colors.length, 0, W_ / colors.length, H_));

// 북유럽식 십자가
const nordic = (bg: string, cross: string, inner?: string) => (p: Paint) => [
  rect(p, bg, 0, 0, W_, H_),
  rect(p, cross, 9, 0, 4, H_),
  rect(p, cross, 0, 8, W_, 4),
  ...(inner ? [rect(p, inner, 10, 0, 2, H_), rect(p, inner, 0, 9, W_, 2)] : []),
];

const FLAGS: Record<CountryCode, (p: Paint) => ReactNode> = {
  ES: hor([R, Y, R], [1, 2, 1]),
  PT: (p) => [rect(p, G, 0, 0, 12, H_), rect(p, R, 12, 0, 18, H_), <circle key="c" cx="12" cy="10" r="3.5" {...p(Y)} />],
  FR: ver([B, W, R]),
  IT: ver([G, W, R]),
  GB: (p) => [
    rect(p, B, 0, 0, W_, H_),
    <path key="w" d="M0 0 L30 20 M30 0 L0 20" stroke={W} strokeWidth="4" />,
    <path key="r" d="M0 0 L30 20 M30 0 L0 20" stroke={R} strokeWidth="1.5" />,
    rect(p, W, 12, 0, 6, H_),
    rect(p, W, 0, 7, W_, 6),
    rect(p, R, 13, 0, 4, H_),
    rect(p, R, 0, 8, W_, 4),
  ],
  IE: ver([G, W, "#f28c28"]),
  DE: hor([K, R, Y]),
  NL: hor([R, W, B]),
  BE: ver([K, Y, R]),
  CH: (p) => [rect(p, R, 0, 0, W_, H_), rect(p, W, 13, 4, 4, 12), rect(p, W, 9, 8, 12, 4)],
  AT: hor([R, W, R]),
  CZ: (p) => [rect(p, W, 0, 0, W_, 10), rect(p, R, 0, 10, W_, 10), <path key="t" d="M0 0 L14 10 L0 20 Z" {...p(B)} />],
  HU: hor([R, W, G]),
  PL: hor([W, R]),
  HR: (p) => [
    ...(hor([R, W, B])(p) as ReactNode[]),
    rect(p, R, 12, 6, 3, 3), rect(p, W, 15, 6, 3, 3),
    rect(p, W, 12, 9, 3, 3), rect(p, R, 15, 9, 3, 3),
    rect(p, R, 12, 12, 3, 3), rect(p, W, 15, 12, 3, 3),
  ],
  GR: (p) => [
    ...(hor([B, W, B, W, B, W, B, W, B])(p) as ReactNode[]),
    rect(p, B, 0, 0, 11, 11),
    rect(p, W, 4.5, 0, 2, 11),
    rect(p, W, 0, 4.5, 11, 2),
  ],
  DK: nordic(R, W),
  NO: nordic(R, W, B),
  SE: nordic(B, Y),
  FI: nordic(W, B),
  IS: nordic(B, W, R),
  TR: (p) => [
    rect(p, R, 0, 0, W_, H_),
    <circle key="a" cx="12" cy="10" r="6" {...p(W)} />,
    <circle key="b" cx="14" cy="10" r="4.8" {...p(R)} />,
    <circle key="s" cx="20" cy="10" r="1.8" {...p(W)} />,
  ],
  MA: (p) => [
    rect(p, R, 0, 0, W_, H_),
    <path key="s" d="M15 4 L18.5 15 L9 8.2 L21 8.2 L11.5 15 Z" fill="none" stroke={G} strokeWidth="1.2" />,
  ],
};

type Props = { code: string; width?: number; x?: number; y?: number };

const paint: Paint = (c) => ({ fill: c });

export function Flag({ code, width = 24, x, y }: Props) {
  const draw = FLAGS[code as CountryCode];
  if (!draw) return null;
  return (
    <svg x={x} y={y} width={width} height={(width * H_) / W_} viewBox="0 0 30 20" className="shrink-0" aria-hidden>
      {draw(paint)}
      <rect x="0.5" y="0.5" width="29" height="19" fill="none" stroke="rgb(0 0 0 / 0.25)" strokeWidth="1" />
    </svg>
  );
}
