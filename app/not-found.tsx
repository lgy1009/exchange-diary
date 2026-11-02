// 없는 주소 화면 (미니홈피 톤)
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto flex max-w-xl flex-col items-center py-14 text-center">
      <p className="display text-5xl text-terracotta">404</p>
      <p className="dot mt-2 text-xs text-muted">PAGE NOT FOUND</p>
      <h1 className="mt-4 text-lg font-semibold">이 페이지는 찾을 수 없어요</h1>
      <p className="label mt-1">주소가 바뀌었거나, 비공개로 바뀐 기록일 수 있어요.</p>
      <Link href="/" className="dot mt-6 btn">
        HOME
      </Link>
    </div>
  );
}
