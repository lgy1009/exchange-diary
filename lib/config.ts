// 교환학생 다이어리 설정 — 바꾸고 싶은 값은 여기서만 고친다.
// (비밀 값은 여기에 쓰지 않는다. 비밀 값은 .env에만 둔다.)

// 홈페이지 주인 (머리글·프로필 카드에 보인다)
export const OWNER = {
  name: "가영",
  en: "GAYOUNG",
} as const;

export const SCHOOL = {
  name: "Universidad de Málaga", // 학교 이름
  nameKo: "말라가 대학교",
  city: "Málaga",
  country: "Spain",
  // ★ 학기 날짜는 대략 값(2027년 2월~7월)입니다. 정확한 날짜가 나오면 고쳐 주세요. (홈의 D-day·진행률에 쓰입니다)
  semesterStart: "2027-02-01", // 학기 시작일 (YYYY-MM-DD)
  semesterEnd: "2027-07-31", // 학기 종료일 (YYYY-MM-DD)
  timeZone: "Europe/Madrid", // 말라가 시간대
  lat: 36.7213, // 학교 위치 (지도 핀)
  lng: -4.4214,
} as const;

// 사이트 색 (DESIGN §6). 실제 화면 색은 app/globals.css에서 같은 값으로 쓴다.
export const COLORS = {
  sea: "#2440E6", // 코발트 블루 — 중심 색
  terracotta: "#DB4500", // 오렌지 — 날짜·도장·다녀온 나라
  sand: "#FFD84D", // 노랑
  bougainvillea: "#C40D6E", // 핫핑크 — 작은 포인트
  paper: "#E9EEFF", // 창 안쪽 바탕
} as const;

// 노션 데이터베이스 이름. 노션에서 이 이름과 똑같이 만들면 사이트가 이름으로 찾는다.
export const DB_TITLES = {
  events: "일정",
  courses: "수업",
  trips: "여행",
  entries: "일기",
  profile: "프로필",
  guestbook: "방명록",
} as const;
export type DbKey = keyof typeof DB_TITLES;

// 노션 내용을 서버가 다시 읽는 간격(초). 이 시간 안에는 저장해 둔 결과를 재사용한다.
export const REVALIDATE_SECONDS = 300;
