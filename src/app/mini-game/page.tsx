"use client";

import { useMiniGameTotalCount } from "@/global/api/useSentenceGameQuery";
import { useRouter } from "next/navigation";
import { ReactNode, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function MiniGameStartPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [count, setCount] = useState(0);

  // 🔥 React Query 로 전체 문제수를 가져온다
  const { data, isLoading } = useMiniGameTotalCount();

  
  // data: { totalCount: number }
  const totalCount = data?.totalCount ?? null;

  const startGame = () => {
    if (count <= 0) {
      alert(t("miniGame.alerts.selectCount"));
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
        <p className="animate-pulse text-[var(--surface-muted-text)]">{t("miniGame.loading")}</p>
      </div>,
    );
  }

  if (totalCount == null) {
    return renderCenteredState(
      <div className="theme-card rounded-3xl p-10 text-center space-y-3">
        <p className="text-sm font-semibold tracking-[0.4em] uppercase text-emerald-500">{t("miniGame.brand")}</p>
        <h1 className="text-2xl font-bold" style={{ color: "var(--page-text)" }}>
          {t("miniGame.title")}
        </h1>
        <p className="text-[var(--surface-muted-text)]">{t("miniGame.errors.fetchFailed")}</p>
      </div>,
    );
  }

  if (totalCount === 0) {
    return renderCenteredState(
      <div className="theme-card rounded-3xl p-10 text-center space-y-3">
        <p className="text-sm font-semibold tracking-[0.4em] uppercase text-emerald-500">{t("miniGame.brand")}</p>
        <h1 className="text-2xl font-bold" style={{ color: "var(--page-text)" }}>
          {t("miniGame.title")}
        </h1>
        <p className="text-[var(--surface-muted-text)]">{t("miniGame.errors.noSentences")}</p>
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
            <p className="text-sm font-semibold tracking-[0.4em] uppercase text-emerald-500">{t("miniGame.brand")}</p>
            <h1 className="text-3xl font-bold" style={{ color: "var(--page-text)" }}>
              {t("miniGame.title")}
            </h1>
            <p className="text-[var(--surface-muted-text)]">
              {t("miniGame.totalCountMessage", { count: String(safeTotalCount) })}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-panel-muted)] px-4 py-3 text-sm text-[var(--surface-muted-text)]">
            {t("miniGame.instructions")}
          </div>

          <div className="space-y-3 text-left">
            <label className="text-sm font-semibold" style={{ color: "var(--page-text)" }}>
              {t("miniGame.selectLabel")}
            </label>
            <select
              className="w-full rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-field)] px-4 py-3 text-base text-[var(--page-text)] focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
            >
              <option value={0}>{t("miniGame.selectPlaceholder")}</option>
              {options.map((option) => (
                <option key={option} value={option} disabled={option > safeTotalCount}>
                  {option} {t("miniGame.unit")}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={startGame}
            disabled={count === 0}
            className={`w-full rounded-2xl py-3 text-lg font-semibold text-white transition-all ${count === 0
                ? "bg-[var(--surface-inset)] text-[var(--surface-muted-text)] cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-400/30"
              }`}
          >
            {t("miniGame.startButton")} →
          </button>
        </div>
      </div>
    </main>
  );
}
