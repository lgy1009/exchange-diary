// "블로그에서 사진 더 보기" 버튼. 주소는 transform.ts의 safeBlogUrl 검사를 통과한 네이버 블로그 주소만 들어온다.
export function BlogButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="btn btn-hot mt-6 inline-flex items-center gap-1.5"
    >
      📖 블로그에서 사진 더 보기 ↗
    </a>
  );
}
