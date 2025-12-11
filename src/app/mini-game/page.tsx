"use client";

import { useMiniGameTotalCount } from "@/global/api/useSentenceGameQuery";
import { useRouter } from "next/navigation";
import { ReactNode, useMemo, useState } from "react";

export default function MiniGameStartPage() {
  const router = useRouter();
  const [count, setCount] = useState(0);

  // 🔥 React Query 로 전체 문제수를 가져온다
  const { data, isLoading } = useMiniGameTotalCount();

  // data: { totalCount: number }
  const totalCount = data?.totalCount ?? null;

  const startGame = () => {
    if (count <= 0) {
      alert("문제 수를 선택해주세요!");
      return;
    }
    router.push(`/mini-game/play?count=${count}`);
  };

  const options = useMemo(() => [1, 3, 5, 7, 10, 20], []);

  const renderCenteredState = (content: ReactNode) => (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: "var(--main-surface)", color: "var(--page-text)" }}
    >
      <div className="w-full max-w-md">{content}</div>
    </main>
  );

  if (isLoading) {
    return renderCenteredState(
      <div className="theme-card rounded-3xl p-10 text-center text-lg">
        <p className="animate-pulse text-[var(--surface-muted-text)]">로딩 중...</p>
      </div>,
    );
  }

  if (totalCount == null) {
    return renderCenteredState(
      <div className="theme-card rounded-3xl p-10 text-center space-y-3">
        <p className="text-sm font-semibold tracking-[0.4em] uppercase text-emerald-500">Mini Game</p>
        <h1 className="text-2xl font-bold" style={{ color: "var(--page-text)" }}>
          문장 미니게임
        </h1>
        <p className="text-[var(--surface-muted-text)]">문장 수 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
      </div>,
    );
  }

  if (totalCount === 0) {
    return renderCenteredState(
      <div className="theme-card rounded-3xl p-10 text-center space-y-3">
        <p className="text-sm font-semibold tracking-[0.4em] uppercase text-emerald-500">Mini Game</p>
        <h1 className="text-2xl font-bold" style={{ color: "var(--page-text)" }}>
          문장 미니게임
        </h1>
        <p className="text-[var(--surface-muted-text)]">등록된 게임 문장이 없습니다.</p>
      </div>,
    );
  }

  const safeTotalCount = totalCount;

  return (
    <main
      className="min-h-screen px-4 py-16"
      style={{ background: "var(--main-surface)" }}
    >
      <div className="mx-auto max-w-xl">
        <div className="theme-card rounded-3xl p-8 text-center space-y-8">
          <div className="space-y-2">
            <p className="text-sm font-semibold tracking-[0.4em] uppercase text-emerald-500">Mini Game</p>
            <h1 className="text-3xl font-bold" style={{ color: "var(--page-text)" }}>
              문장 미니게임
            </h1>
            <p className="text-[var(--surface-muted-text)]">
              등록된 총 문장 수는 <span className="font-semibold text-emerald-500">{safeTotalCount}</span> 개입니다.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-panel-muted)] px-4 py-3 text-sm text-[var(--surface-muted-text)]">
            원하는 문제 수를 선택하면 즉시 게임이 시작됩니다.
          </div>

          <div className="space-y-3 text-left">
            <label className="text-sm font-semibold" style={{ color: "var(--page-text)" }}>
              문제 수 선택
            </label>
            <select
              className="w-full rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-field)] px-4 py-3 text-base text-[var(--page-text)] focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
            >
              <option value={0}>선택해주세요</option>
              {options.map((option) => (
                <option key={option} value={option} disabled={option > safeTotalCount}>
                  {option} 문제
                </option>
              ))}
            </select>
            <p className="text-xs text-[var(--surface-muted-text)]">
              최대 {safeTotalCount} 문제까지 선택할 수 있어요.
            </p>
          </div>

          <button
            onClick={startGame}
            disabled={count === 0}
            className={`w-full rounded-2xl py-3 text-lg font-semibold text-white transition-all ${count === 0
                ? "bg-[var(--surface-inset)] text-[var(--surface-muted-text)] cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-400/30"
              }`}
          >
            게임 시작 →
          </button>
        </div>
      </div>
    </main>
  );
}
