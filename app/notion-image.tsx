// 노션 사진 한 장. 사진 주소는 /api/image 경로를 거친다 (만료되는 노션 주소를 화면에 직접 적지 않는다).
// next/image 최적화는 쓰지 않는다: Vercel 무료 한도를 아끼고, 경로가 이미 원본 주소로 이동시키기 때문.
import { imageSrc, type ImageProp } from "@/lib/image";

export function NotionImage({
  pageId,
  alt,
  prop = "대표 사진",
  className = "",
}: {
  pageId: string;
  alt: string;
  prop?: ImageProp;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageSrc(pageId, prop)} alt={alt} loading="lazy" decoding="async" className={`object-cover ${className}`} />
  );
}
