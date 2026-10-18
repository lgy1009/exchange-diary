// 노션에 쓰는 나라 이름(한국어) ↔ 지도 나라 코드(ISO 3166-1 두 글자) 대응표.
// 노션 "나라" 선택지도 이 목록으로 만든다. (scripts/setup-notion.mjs가 같은 이름을 쓴다)
// 새 나라를 가면 여기에 한 줄 추가하고, 노션 선택지에도 같은 이름으로 추가하면 된다.

export const COUNTRIES = [
  { code: "ES", name: "스페인" },
  { code: "PT", name: "포르투갈" },
  { code: "FR", name: "프랑스" },
  { code: "IT", name: "이탈리아" },
  { code: "GB", name: "영국" },
  { code: "IE", name: "아일랜드" },
  { code: "DE", name: "독일" },
  { code: "NL", name: "네덜란드" },
  { code: "BE", name: "벨기에" },
  { code: "CH", name: "스위스" },
  { code: "AT", name: "오스트리아" },
  { code: "CZ", name: "체코" },
  { code: "HU", name: "헝가리" },
  { code: "PL", name: "폴란드" },
  { code: "HR", name: "크로아티아" },
  { code: "GR", name: "그리스" },
  { code: "DK", name: "덴마크" },
  { code: "NO", name: "노르웨이" },
  { code: "SE", name: "스웨덴" },
  { code: "FI", name: "핀란드" },
  { code: "IS", name: "아이슬란드" },
  { code: "TR", name: "튀르키예" },
  { code: "MA", name: "모로코" },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];

// 일기에 나라를 비워 두면 학교가 있는 나라로 본다
export const HOME_COUNTRY: CountryCode = "ES";

const byName = new Map<string, CountryCode>(COUNTRIES.map((c) => [c.name, c.code]));
const byCode = new Map<string, string>(COUNTRIES.map((c) => [c.code, c.name]));

// 노션 선택지 이름 → 코드. 목록에 없는 이름이면 null (지도에 표시하지 않는다)
export function codeOf(name: string): CountryCode | null {
  return byName.get(name.trim()) ?? null;
}

export function nameOf(code: string): string {
  return byCode.get(code) ?? code;
}
