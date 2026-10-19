// 비밀번호 입력 (DESIGN §1 /unlock)
import type { Metadata } from "next";
import { Suspense } from "react";
import { UnlockForm } from "./unlock-form";

export const metadata: Metadata = { title: "비밀번호" };

export default function UnlockPage() {
  return (
    <div className="mx-auto max-w-sm">
      <Suspense fallback={<p className="card text-sm text-muted">불러오는 중…</p>}>
        <UnlockForm />
      </Suspense>
    </div>
  );
}
