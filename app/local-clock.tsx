"use client";

// 말라가 현지 시각. 보는 사람 브라우저에서 1분마다 다시 계산한다. (서버 캐시와 상관없이 항상 지금 시각)
import { useEffect, useState } from "react";

function format(timeZone: string) {
  return new Intl.DateTimeFormat("ko-KR", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
}

export function LocalClock({ timeZone }: { timeZone: string }) {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setTime(format(timeZone));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [timeZone]);
  // 서버에서 그릴 때는 시각을 비워 두고, 브라우저에서 채운다 (서버·브라우저 시각 차이로 인한 오류 방지)
  return <span className="tabular-nums">{time ?? "--:--"}</span>;
}
