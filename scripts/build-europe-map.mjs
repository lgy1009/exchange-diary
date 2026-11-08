// 유럽 지도 모양을 미리 한 번 만들어 lib/europe-map.data.ts로 저장한다. (지도 라이브러리는 여기서만 쓴다)
// 사이트는 이 파일의 그림 경로만 쓰므로, 방문자는 지도 라이브러리를 받지 않는다.
// 사용법:  npm.cmd run map:build   (나라 목록·지도 범위를 바꿨을 때만 다시 실행)

import fs from "node:fs";
import { createRequire } from "node:module";
import { geoBounds, geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";

const require = createRequire(import.meta.url);
// 기본은 1:110m (약 32KB, 우리 목록 23개국 모두 들어 있다).
// --fine을 주면 1:50m로 더 정밀하지만 파일이 약 370KB라 페이지가 무거워진다.
const RES = process.argv.includes("--fine") ? "50m" : "110m";
const world = require(`world-atlas/countries-${RES}.json`);

// 그림 크기와 보여 줄 범위 (서쪽 아이슬란드 ~ 동쪽 튀르키예, 남쪽 모로코 ~ 북쪽 노르웨이)
// 높이는 범위에 맞춰 자동으로 정한다. (북쪽을 너무 올리면 메르카토르 지도라 세로로 길어진다)
// 아이슬란드·노르웨이 북쪽은 잘린다. 모로코 전체(남쪽 27.5도)와 튀르키예 전체(동쪽 45도)가 들어가게 넓혔다.
const WIDTH = 1000;
const BOUNDS = { west: -12, east: 45, south: 27.5, north: 61 };

// 지도 데이터의 숫자 나라 번호(ISO 3166-1 numeric) → 두 글자 코드 (lib/countries.ts 목록만)
const NUMERIC = {
  724: "ES", 620: "PT", 250: "FR", 380: "IT", 826: "GB", 372: "IE", 276: "DE", 528: "NL",
  56: "BE", 756: "CH", 40: "AT", 203: "CZ", 348: "HU", 616: "PL", 191: "HR", 300: "GR",
  208: "DK", 578: "NO", 752: "SE", 246: "FI", 352: "IS", 792: "TR", 504: "MA",
};

const bbox = {
  type: "Feature",
  geometry: {
    type: "Polygon",
    // 지구 위 다각형은 시계 방향으로 돌아야 "안쪽"이 된다 (반대면 나머지 세계 전체가 된다)
    coordinates: [[
      [BOUNDS.west, BOUNDS.south], [BOUNDS.west, BOUNDS.north],
      [BOUNDS.east, BOUNDS.north], [BOUNDS.east, BOUNDS.south], [BOUNDS.west, BOUNDS.south],
    ]],
  },
};
const projection = geoMercator().fitWidth(WIDTH, bbox);
const HEIGHT = Math.round(geoPath(projection).bounds(bbox)[1][1]);
projection.clipExtent([[0, 0], [WIDTH, HEIGHT]]);
const path = geoPath(projection).digits(1);

const countries = [];
for (const f of feature(world, world.objects.countries).features) {
  // 범위와 겹치지 않는 나라는 뺀다 (경도·위도 기준)
  const [[w, s], [e, n]] = geoBounds(f);
  const crossesDateLine = w > e; // 러시아·미국처럼 날짜변경선을 걸치는 나라
  if (s > BOUNDS.north || n < BOUNDS.south) continue;
  if (!crossesDateLine && (w > BOUNDS.east || e < BOUNDS.west)) continue;
  const d = path(f);
  if (!d) continue;
  const code = NUMERIC[Number(f.id)] ?? null;
  // 우리 목록 나라는 이름표를 놓을 중심점도 저장한다 (가장 큰 땅 덩어리 기준)
  let label = null;
  if (code) {
    const parts = f.geometry.type === "MultiPolygon"
      ? f.geometry.coordinates.map((c) => ({ type: "Polygon", coordinates: c }))
      : [f.geometry];
    const biggest = parts.sort((a, b) => path.area(b) - path.area(a))[0];
    const [cx, cy] = path.centroid(biggest);
    if (Number.isFinite(cx)) label = [Math.round(cx), Math.round(cy)];
  }
  countries.push({ code, name: f.properties?.name ?? "", d, label });
}

// 화면에서 위도·경도 → 그림 좌표를 계산할 수 있게 메르카토르 투영 값을 함께 저장한다
const [tx, ty] = projection.translate();
const out = `// 자동 생성 파일 — 직접 고치지 말고 scripts/build-europe-map.mjs를 고쳐 다시 만든다.
// 출처: world-atlas (Natural Earth 1:50m, 공공 영역)

export const MAP_WIDTH = ${WIDTH};
export const MAP_HEIGHT = ${HEIGHT};
export const MERCATOR = { scale: ${projection.scale()}, translate: [${tx}, ${ty}] as const };

export const MAP_COUNTRIES: { code: string | null; name: string; d: string; label: [number, number] | null }[] =${JSON.stringify(countries)};
`;
fs.writeFileSync("lib/europe-map.data.ts", out);
console.log(`✅ lib/europe-map.data.ts — 나라 ${countries.length}개 (우리 목록 ${countries.filter((c) => c.code).length}개), ${Math.round(out.length / 1024)}KB`);
