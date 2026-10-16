// 교환학생 다이어리 설정 — 바꾸고 싶은 값은 여기서만 고친다.
// (비밀 값은 여기에 쓰지 않는다. 비밀 값은 .env에만 둔다.)

// ★ 아래 학교·학기 값은 임시입니다. 실제 값으로 바꿔 주세요. (홈의 학기 진행률과 달력에 쓰입니다)
export const SCHOOL = {
  name: "내 교환학교", // 학교 이름
  country: "", // 나라 (예: 프랑스)
  semesterStart: "2027-03-01", // 학기 시작일 (YYYY-MM-DD)
  semesterEnd: "2027-07-01", // 학기 종료일 (YYYY-MM-DD)
  timeZone: "Europe/Paris", // 현지 시간대 (예: Europe/Paris, Asia/Tokyo)
} as const;

// 포인트 색 한 가지 (링크·날짜·강조에 쓴다)
export const ACCENT_COLOR = "#D9480F";

// 노션 데이터베이스 이름. 노션에서 이 이름과 똑같이 만들면 사이트가 이름으로 찾는다.
export const DB_TITLES = {
  events: "일정",
  courses: "수업",
  trips: "여행",
  entries: "일기",
} as const;
export type DbKey = keyof typeof DB_TITLES;

// 노션 내용을 서버가 다시 읽는 간격(초). 이 시간 안에는 저장해 둔 결과를 재사용한다.
export const REVALIDATE_SECONDS = 300;
