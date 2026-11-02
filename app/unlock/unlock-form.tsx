"use client";

// 비밀번호 한 칸. 맞으면 원래 보려던 페이지(next)로 돌아간다. 이미 열려 있으면 "잠그기"를 보여 준다.
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useUnlockedHint } from "../unlock-hint";

// 우리 사이트 안의 주소만 허용 (다른 사이트로 보내는 주소 차단)
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return "/";
  return raw;
}

export function UnlockForm() {
  const next = safeNext(useSearchParams().get("next"));
  const unlocked = useUnlockedHint();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [state, setState] = useState<{ busy: boolean; error?: string }>({ busy: false });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) {
      setState({ busy: false, error: "비밀번호를 입력해 주세요." });
      return;
    }
    setState({ busy: true });
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        // 이동한 뒤 새로 그려야 서버가 비공개 내용까지 보여 준다
        router.push(next);
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setPassword("");
      setState({ busy: false, error: data.error ?? "잠시 후 다시 시도해 주세요." });
    } catch {
      setState({ busy: false, error: "인터넷 연결을 확인해 주세요." });
    }
  }

  async function lock() {
    await fetch("/api/lock", { method: "POST" }).catch(() => {});
    router.push("/");
    router.refresh();
  }

  if (unlocked) {
    return (
      <div className="card flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-3xl">🔓</p>
        <p className="font-semibold">비공개 기록이 열려 있어요</p>
        <p className="label">이 기기에서는 30일 동안 열려 있어요. 다른 사람과 같이 쓰는 기기라면 잠가 주세요.</p>
        <button onClick={lock} className="dot mt-2 btn btn-hot">
          LOCK
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card flex flex-col items-center gap-3 py-10 text-center">
      <p className="text-3xl">🔒</p>
      <h1 className="font-semibold">비공개 기록 보기</h1>
      <p className="label">비밀번호를 입력하면 비공개 일기와 내 일정을 볼 수 있어요.</p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        aria-label="비밀번호"
        autoFocus
        className="mt-2 w-full field text-center"
      />
      {state.error && (
        <p className="text-sm text-pink" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={state.busy}
        className="dot w-full btn disabled:opacity-60"
      >
        {state.busy ? "CHECKING…" : "UNLOCK"}
      </button>
    </form>
  );
}
