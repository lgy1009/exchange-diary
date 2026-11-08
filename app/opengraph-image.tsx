// 링크를 공유할 때 뜨는 미리보기 그림 (사이트 제목 ⓖⓐⓨⓞⓤⓝⓖ ♡ ⓜⓐⓛⓐⓖⓐ 모양)
// 그림 만드는 도구가 동그라미 글자·♡ 글꼴을 갖고 있지 않아서, 동그라미와 하트를 직접 그린다.
import { ImageResponse } from "next/og";

export const alt = "gayoung ♡ malaga";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SEA = "#cc5a2b";
const SEA_SOFT = "#f3ae88";

function Circled({ ch }: { ch: string }) {
  return (
    <div
      style={{
        width: 58,
        height: 58,
        borderRadius: 29,
        border: `4px solid ${SEA}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: SEA,
        fontSize: 34,
        lineHeight: 1,
        paddingBottom: ch === "g" || ch === "y" ? 9 : 4,
      }}
    >
      {ch}
    </div>
  );
}

function Heart() {
  return (
    <svg width="56" height="52" viewBox="0 0 24 22" style={{ margin: "0 10px" }}>
      <path
        d="M12 20.5 C 5 15, 1.5 11.5, 1.5 7 A 5 5 0 0 1 12 4.8 A 5 5 0 0 1 22.5 7 C 22.5 11.5, 19 15, 12 20.5 Z"
        fill="none"
        stroke={SEA}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffe9dc",
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.95) 3px, transparent 3px)",
          backgroundSize: "36px 36px",
        }}
      >
        <div
          style={{
            width: 1090,
            height: 470,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
            border: `22px solid ${SEA_SOFT}`,
            borderRadius: 40,
            boxShadow: `0 0 0 3px ${SEA}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            {"gayoung".split("").map((c, i) => (
              <Circled key={`a${i}`} ch={c} />
            ))}
            <Heart />
            {"malaga".split("").map((c, i) => (
              <Circled key={`b${i}`} ch={c} />
            ))}
          </div>
          <div style={{ marginTop: 44, fontSize: 30, letterSpacing: 6, color: "#85624f", display: "flex" }}>
            MÁLAGA · 2027
          </div>
        </div>
      </div>
    ),
    size,
  );
}
