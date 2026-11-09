// 진행 막대 (버킷리스트 페이지·홈 카드)
export function Progress({ done, total, className = "" }: { done: number; total: number; className?: string }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className={`overflow-hidden border border-line bg-white ${className}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full bg-sea" style={{ width: `${pct}%` }} />
    </div>
  );
}
