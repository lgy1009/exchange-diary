// 사이트에서 쓰는 데이터 모양. 노션 원본 모양(복잡함)을 이 단순한 모양으로 바꿔서 쓴다.
// 날짜는 노션이 준 문자열 그대로 둔다. (예: "2027-03-14" 또는 "2027-03-14T09:00:00.000+01:00")

export type DateRange = {
  start: string;
  end: string | null; // 하루짜리면 null
};

// ① 일정
export type EventItem = {
  id: string;
  name: string;
  date: DateRange | null;
  kind: string | null; // 시험 / 과제 / 행정 / 기타
  place: string;
  isPublic: boolean;
};

// ② 수업 (매주 같은 요일에 반복)
export type Course = {
  id: string;
  name: string;
  days: string[]; // ["월", "수"]
  start: string; // "09:00"
  end: string; // "10:30"
  room: string;
  professor: string;
};

// ③ 여행
export type Trip = {
  id: string;
  title: string;
  period: DateRange | null;
  place: string; // 나라·도시
  lat: number | null;
  lng: number | null;
  summary: string;
  hasCover: boolean; // 대표 사진이 있는지 (사진 주소는 만료되므로 여기 담지 않고, 작업 5의 사진 경로로 받는다)
  isPublic: boolean;
};

// ④ 일기
export type Entry = {
  id: string;
  title: string;
  date: DateRange | null;
  mood: string | null;
  place: string;
  tags: string[];
  hasCover: boolean;
  isPublic: boolean;
};

// 비밀번호 없이 볼 때 비공개 일기 자리에 남기는 것. 날짜와 "잠김" 표시 외에는 아무것도 담지 않는다.
export type LockedEntry = {
  id: string;
  date: DateRange | null;
  locked: true;
};

// 화면에 넘겨주는 전체 데이터
export type DiaryData = {
  unlocked: boolean; // 비밀번호를 확인한 요청인지
  events: EventItem[];
  courses: Course[];
  trips: Trip[];
  entries: (Entry | LockedEntry)[];
};

// 노션에서 읽어 온 그대로(비공개 포함). 서버 안에서만 쓰고 화면에 바로 넘기지 않는다.
export type RawDiaryData = {
  events: EventItem[];
  courses: Course[];
  trips: Trip[];
  entries: Entry[];
};
