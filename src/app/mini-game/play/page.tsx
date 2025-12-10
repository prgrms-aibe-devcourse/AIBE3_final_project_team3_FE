"use client";

import {
  useStartGameQuery,
  useSubmitAnswerMutation,
} from "@/global/api/useSentenceGameQuery";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

export const dynamic = "force-dynamic";

function MiniGamePlayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const count = Number(searchParams.get("count") ?? 1);

  // 🔥 게임 문제 로드
  const { data, isLoading } = useStartGameQuery(count);
  const questions = data?.questions ?? [];

  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // 🔥 WrongItem 타입 자동 추론
  type WrongItem = {
    question: typeof questions[number];
    feedbacks: {
      tag?: string;
      problem?: string;
      correction?: string;
      extra?: string;
    }[];
  };

  // ❌ 틀린 문제 리스트
  const [wrongList, setWrongList] = useState<WrongItem[]>([]);

  // 🔥 페이지네이션 설정
  const ITEMS_PER_PAGE = 5;
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(wrongList.length / ITEMS_PER_PAGE);

  const currentItems = wrongList.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // 🔥 정답 제출 훅
  const submitMutation = useSubmitAnswerMutation();

  if (isLoading) return <div className="p-10">Loading...</div>;
  if (!questions.length)
    return <div className="p-10">문제를 불러올 수 없습니다.</div>;

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
          const answerCorrect = resp.correct;

          // ❌ 오답이면 리스트에 저장
          if (!answerCorrect) {
            setWrongList((prev) => [
              ...prev,
              {
                question: q,
                feedbacks: resp.feedbacks ?? [],
              },
            ]);
          } else {
            setCorrectCount((prev) => prev + 1);
          }

          setIsCorrect(answerCorrect);
          setShowAnswer(true);
        },
      }
    );
  };

  // ---------------------------------------------------
  // 🔥 다음 문제로 이동
  // ---------------------------------------------------
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
    <div className="min-h-screen p-10 bg-gray-100">
      <div className="max-w-xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* ------------------------------------------------ */}
        {/* 🔥 게임 종료 화면 */}
        {/* ------------------------------------------------ */}
        {isFinished ? (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-indigo-700">🎉 게임 완료!</h2>

            <p className="text-lg font-semibold text-gray-800">
              총 {questions.length}문제 중 {correctCount}문제 정답!
            </p>

            {/* ------------------------------------------------ */}
            {/* ❌ 틀린 문제 아코디언 + 페이지네이션 */}
            {/* ------------------------------------------------ */}
            {wrongList.length > 0 && (
              <div className="mt-6 text-left space-y-4">
                <h3 className="text-xl font-bold text-red-600">
                  ❌ 틀린 문제 복습
                </h3>

                {currentItems.map((item, idx) => (
                  <details
                    key={idx}
                    className="border rounded-lg bg-white shadow-sm p-3 group open:shadow-md transition"
                  >
                    <summary className="cursor-pointer text-red-700 font-semibold text-base list-none flex justify-between items-center">
                      <span>
                        문제 {idx + 1 + (page - 1) * ITEMS_PER_PAGE}:{" "}
                        {item.question.originalContent}
                      </span>
                      <span className="text-gray-500 group-open:rotate-180 transition-transform">
                        ▼
                      </span>
                    </summary>

                    <div className="mt-3 space-y-3">
                      <p className="text-green-700 font-semibold">
                        정답: {item.question.correctedContent}
                      </p>

                      {item.feedbacks.length > 0 && (
                        <div className="space-y-2">
                          {item.feedbacks.map((fb, fIdx) => (
                            <div
                              key={fIdx}
                              className="p-3 bg-gray-50 border rounded-md"
                            >
                              <p className="font-bold text-indigo-600">[{fb.tag}]</p>
                              <p><span className="font-semibold">문제:</span> {fb.problem}</p>
                              <p><span className="font-semibold">수정:</span> {fb.correction}</p>
                              <p><span className="font-semibold">설명:</span> {fb.extra}</p>
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
                      className="px-3 py-1 border rounded disabled:opacity-40"
                    >
                      이전
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`px-3 py-1 border rounded ${
                            page === p ? "bg-indigo-600 text-white" : ""
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}

                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 border rounded disabled:opacity-40"
                    >
                      다음
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => router.push("/learning-notes")}
                className="w-full p-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700"
              >
                학습노트로 이동 →
              </button>

              <button
                onClick={restart}
                className="w-full p-3 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700"
              >
                다시하기 ↺
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ------------------------------------------------ */}
            {/* 🔥 문제 화면 */}
            {/* ------------------------------------------------ */}
            <h2 className="text-xl font-bold mb-4">
              문제 {current + 1} / {questions.length}
            </h2>

            <p className="text-gray-700 mb-3">
              잘못된 문장:{" "}
              <span className="font-semibold text-red-600">
                {q.originalContent}
              </span>
            </p>

            {/* required를 위한 form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitAnswer();
              }}
            >
              <input
                className="w-full border p-2 rounded-md mt-3"
                placeholder="올바른 문장을 입력하세요"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                required
              />

              {!showAnswer && (
                <button
                  type="submit"
                  className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-md p-3 font-semibold"
                >
                  제출하기
                </button>
              )}
            </form>

            {/* ------------------------------------------------ */}
            {/* 🔥 정답 확인 화면 */}
            {/* ------------------------------------------------ */}
            {showAnswer && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-300 rounded-md">
                {isCorrect ? (
                  <p className="text-green-700 font-bold text-lg mb-2">
                    정답입니다! 🎉
                  </p>
                ) : (
                  <p className="text-red-600 font-bold text-lg mb-2">
                    틀렸습니다.
                  </p>
                )}

                <p className="text-gray-800 mb-4">
                  <span className="font-semibold">정답: </span>
                  {submitMutation.data?.correctedContent}
                </p>

                {/* 피드백 */}
                {submitMutation.data?.feedbacks?.length ? (
                  <div className="mt-4">
                    <p className="font-semibold text-gray-700 mb-2">피드백:</p>

                    <ul className="space-y-3">
                      {submitMutation.data.feedbacks.map((fb, idx) => (
                        <li
                          key={idx}
                          className="p-3 bg-white border rounded-md shadow-sm"
                        >
                          <p className="font-semibold text-indigo-600">
                            [{fb.tag}]
                          </p>
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
