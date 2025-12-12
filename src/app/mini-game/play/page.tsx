"use client";

import {
  useStartGameQuery,
  useSubmitAnswerMutation,
} from "@/global/api/useSentenceGameQuery";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export const dynamic = "force-dynamic";

function MiniGamePlayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const count = Number(searchParams.get("count") ?? 1);

  const { t } = useLanguage();

  // 🔥 게임 문제 로드
  const { data, isLoading } = useStartGameQuery(count);
  const questions = data?.questions ?? [];

  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  type WrongItem = {
    question: typeof questions[number] & { correctedContent: string };
    feedbacks: {
      tag?: string;
      problem?: string;
      correction?: string;
      extra?: string;
    }[];
  };

  const [wrongList, setWrongList] = useState<WrongItem[]>([]);

  const ITEMS_PER_PAGE = 5;
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(wrongList.length / ITEMS_PER_PAGE);
  const currentItems = wrongList.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const submitMutation = useSubmitAnswerMutation();

  if (isLoading) return <div className="p-10 text-[var(--text-primary)]">{t("miniGame.loading")}</div>;
  if (!questions.length)
    return <div className="p-10 text-[var(--text-primary)]">{t("miniGame.play.fetchFailed")}</div>;

  const q = questions[current];

  // ---------------------------------------------------
  // 🔥 정답 제출 함수
  // ---------------------------------------------------
  const submitAnswer = () => {
    submitMutation.mutate(
      {
        sentenceGameId: q.id,
        userAnswer: input.trim(),
      },
      {
        onSuccess: (resp) => {
          if (!resp.correct) {
            setWrongList((prev) => [
              ...prev,
              {
                question: {
                  ...q,
                  correctedContent: resp.correctedContent,
                },
                feedbacks: resp.feedbacks ?? [],
              },
            ]);
          } else {
            setCorrectCount((prev) => prev + 1);
          }

          setIsCorrect(resp.correct);
          setShowAnswer(true);
        },
      }
    );
  };

  const goNext = () => {
    if (current + 1 === questions.length) {
      setIsFinished(true);
      return;
    }

    setCurrent((prev) => prev + 1);
    setInput("");
    setShowAnswer(false);
    setIsCorrect(null);
  };

  const restart = () => {
    router.push(`/mini-game?count=${count}`);
  };

  // ============================================================
  // 🔥 렌더링 시작
  // ============================================================
  return (
    <div
      className="min-h-screen p-10"
      style={{ background: "var(--page-bg)" }}
    >
      <div className="theme-surface max-w-xl mx-auto shadow-md rounded-xl p-6">

        {/* ------------------------------------------------ */}
        {/* 🔥 게임 종료 화면 */}
        {/* ------------------------------------------------ */}
        {isFinished ? (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-[var(--primary)]">
              {t("miniGame.play.finishedTitle")}
            </h2>

            <p className="text-lg font-semibold text-[var(--text-primary)]">
              {t("miniGame.play.resultSummary", {
                total: String(questions.length),
                correct: String(correctCount),
              })}
            </p>

            {/* 🔥 틀린 문제 복습 */}
            {wrongList.length > 0 && (
              <div className="mt-6 text-left space-y-4">
                <h3 className="text-xl font-bold text-red-500">
                  {t("miniGame.play.reviewWrongTitle")}
                </h3>

                {currentItems.map((item, idx) => (
                  <details
                    key={idx}
                    className="theme-surface-muted border rounded-lg p-3 group open:shadow-md transition"
                  >
                    <summary className="cursor-pointer font-semibold text-red-400 text-base list-none flex justify-between items-center">
                      <span>
                        {t("miniGame.play.problemLabel", {
                          num: String(idx + 1 + (page - 1) * ITEMS_PER_PAGE),
                          content: item.question.originalContent,
                        })}
                      </span>
                      <span className="text-[var(--text-muted)] group-open:rotate-180 transition-transform">
                        ▼
                      </span>
                    </summary>

                    <div className="mt-3 space-y-3">
                      <p className="text-green-500 font-semibold">
                        {t("miniGame.play.correctAnswer", {
                          answer: item.question.correctedContent,
                        })}
                      </p>

                      {item.feedbacks.length > 0 && (
                        <div className="space-y-2">
                          {item.feedbacks.map((fb, fIdx) => (
                            <div
                              key={fIdx}
                              className="theme-panel border rounded-md p-3"
                            >
                                <p className="font-bold text-indigo-400">{t("miniGame.play.feedback.tag", { tag: fb.tag ?? "" })}</p>
                              <p><span className="font-semibold">{t("miniGame.play.feedback.problem")}</span> {fb.problem}</p>
                              <p><span className="font-semibold">{t("miniGame.play.feedback.correction")}</span> {fb.correction}</p>
                              <p><span className="font-semibold">{t("miniGame.play.feedback.extra")}</span> {fb.extra}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </details>
                ))}

                {/* 🔥 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 border rounded disabled:opacity-40 theme-panel"
                    >
                      {t("miniGame.play.pagination.prev")}
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-1 border rounded theme-panel 
                          ${page === p ? "bg-indigo-600 text-white" : ""}`}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 border rounded disabled:opacity-40 theme-panel"
                    >
                      {t("miniGame.play.pagination.next")}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 버튼들 */}
            <div className="space-y-3">
              <button
                onClick={() => router.push("/learning-notes")}
                className="w-full p-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700"
              >
                {t("miniGame.play.toLearningNotes")}
              </button>

              <button
                onClick={restart}
                className="w-full p-3 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700"
              >
                {t("miniGame.play.restart")}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ------------------------------------------------ */}
            {/* 🔥 문제 화면 */}
            {/* ------------------------------------------------ */}
            <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">
              {t("miniGame.play.progress", { current: String(current + 1), total: String(questions.length) })}
            </h2>

            <p className="text-[var(--text-primary)] mb-3">
              {t("miniGame.play.wrongSentenceLabel")} {" "}
              <span className="font-semibold text-red-500">
                {q.originalContent}
              </span>
            </p>

            {/* 입력 form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitAnswer();
              }}
            >
              <input
                className="w-full border rounded-md p-2 mt-3 theme-panel"
                placeholder={t("miniGame.play.inputPlaceholder")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                required
              />

              {!showAnswer && (
                <button
                  type="submit"
                  className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-md p-3 font-semibold"
                >
                  {t("miniGame.play.submitButton")}
                </button>
              )}
            </form>

            {/* ------------------------------------------------ */}
            {/* 🔥 정답 확인 화면 */}
            {/* ------------------------------------------------ */}
            {showAnswer && (
              <div className="mt-6 theme-surface-muted border rounded-md p-4">
                {isCorrect ? (
                  <p className="text-green-500 font-bold text-lg mb-2">{t("miniGame.play.correctMessage")}</p>
                ) : (
                  <p className="text-red-500 font-bold text-lg mb-2">{t("miniGame.play.incorrectMessage")}</p>
                )}

                <p className="text-[var(--text-primary)] mb-4">
                  <span className="font-semibold">{t("miniGame.play.correctLabel")}</span>
                  {submitMutation.data?.correctedContent}
                </p>

                {/* 피드백 */}
                {submitMutation.data?.feedbacks?.length ? (
                    <div className="mt-4">
                    <p className="font-semibold text-[var(--text-primary)] mb-2">{t("miniGame.play.feedbackTitle")}</p>

                    <ul className="space-y-3">
                      {submitMutation.data.feedbacks.map((fb, idx) => (
                        <li
                          key={idx}
                          className="theme-panel border rounded-md p-3 shadow-sm"
                        >
                          <p className="font-semibold text-indigo-400">[{fb.tag}]</p>
                          <p><span className="font-semibold">문제:</span> {fb.problem}</p>
                          <p><span className="font-semibold">수정:</span> {fb.correction}</p>
                          <p><span className="font-semibold">설명:</span> {fb.extra}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <button
                  onClick={goNext}
                  className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-md p-3 font-semibold"
                >
                  다음으로 →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function MiniGamePlayPage() {
  return (
    <Suspense fallback={<div className="p-10">Loading...</div>}>
      <MiniGamePlayContent />
    </Suspense>
  );
}
