"use client";

// 방명록 쓰기 칸. 보낸 글은 승인 후에 보인다고 안내한다.
import { useState } from "react";
import { MESSAGE_MAX, NAME_MAX } from "@/lib/guestbook";

export function GuestbookForm() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // 숨은 칸 (로봇 막기)
  const [state, setState] = useState<{ kind: "idle" | "sending" | "done" | "error"; text?: string }>({ kind: "idle" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      setState({ kind: "error", text: "이름과 남길 말을 모두 적어 주세요." });
      return;
    }
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message, website }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setState({ kind: "error", text: data.error ?? "잠시 후 다시 시도해 주세요." });
        return;
      }
      setMessage("");
      setState({ kind: "done", text: "고마워요! 확인한 뒤에 방명록에 올라가요." });
    } catch {
      setState({ kind: "error", text: "인터넷 연결을 확인해 주세요." });
    }
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-2.5">
      <h2 className="label">방명록 남기기</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={NAME_MAX}
        placeholder="이름 (별명도 좋아요)"
        aria-label="이름"
        className="field"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={MESSAGE_MAX}
        rows={3}
        placeholder="한마디 남겨 주세요"
        aria-label="남길 말"
        className="resize-none field"
      />
      {/* 사람에게는 보이지 않는 칸. 로봇이 채우면 조용히 무시된다 */}
      <input
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        name="website"
      />
      <div className="flex items-center justify-between gap-3">
        <p className={`text-xs ${state.kind === "error" ? "text-pink" : "text-muted"}`} role="status">
          {state.text ?? `${[...message].length}/${MESSAGE_MAX} · 링크는 남길 수 없어요`}
        </p>
        <button
          type="submit"
          disabled={state.kind === "sending"}
          className="dot shrink-0 btn disabled:opacity-60"
        >
          {state.kind === "sending" ? "SENDING…" : "SEND"}
        </button>
      </div>
    </form>
  );
}
