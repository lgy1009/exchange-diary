// 여행 상세 아래에 붙는 "여행 가계부" 카드. 비밀번호를 푼 사람에게만 그린다.
import { short } from "@/lib/dates";
import type { TripBudget } from "@/lib/budget";

const won = (n: number) => `₩${Math.round(n).toLocaleString("ko-KR")}`;
const euro = (n: number) => `€${n.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}`;

export function TripBudgetCard({ budget }: { budget: TripBudget }) {
  const max = Math.max(1, ...budget.byCategory.map((c) => c.krw));
  return (
    <section className="mt-8 border border-dashed border-sea-soft bg-paper p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="label">🔒 여행 가계부 · 나만 보기</h2>
        <span className="label">{budget.lines.length}건</span>
      </div>

      {budget.lines.length === 0 ? (
        <p className="mt-2 text-sm text-muted">
          노션 「가계부」에서 이 여행 때 쓴 줄들을 선택하고 &lsquo;여행&rsquo; 칸에 이 여행을 고르면 여기 모여요.
        </p>
      ) : (
        <>
          <p className="display mt-2 text-3xl text-sea">{won(budget.totalKrw)}</p>
          <p className="label mt-0.5">
            {budget.totalEur > 0 && `그중 유로 ${euro(budget.totalEur)} · `}
            {budget.missingRate > 0 ? `환율이 빈 ${budget.missingRate}건은 원화 합계에서 빠졌어요` : "원화 환산 합계"}
          </p>

          {/* 카테고리별 */}
          <ul className="mt-4 flex flex-col gap-1.5 text-sm">
            {budget.byCategory.map((c) => (
              <li key={c.name} className="flex items-center gap-2">
                <span className="w-20 shrink-0 truncate">{c.name}</span>
                <span className="h-2.5 flex-1 border border-line bg-white">
                  <span className="block h-full bg-sea" style={{ width: `${(c.krw / max) * 100}%` }} />
                </span>
                <span className="dot w-24 shrink-0 text-right text-xs text-terracotta">{won(c.krw)}</span>
              </li>
            ))}
          </ul>

          {/* 내역 */}
          <details className="mt-4">
            <summary className="label cursor-pointer hover:text-sea">내역 펼치기</summary>
            <ul className="retro-list mt-2 flex flex-col text-sm">
              {budget.lines.map((l) => (
                <li key={l.id} className="flex items-baseline gap-2">
                  <span className="dot w-9 shrink-0 text-xs text-terracotta">{l.day ? short(l.day) : ""}</span>
                  <span className="min-w-0 flex-1 truncate">{l.title}</span>
                  <span className="chip shrink-0">{l.category}</span>
                  <span className="dot w-20 shrink-0 text-right text-xs">
                    {l.currency === "EUR" ? euro(l.amount) : won(l.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </section>
  );
}
