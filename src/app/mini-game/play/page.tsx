"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  useStartGameQuery,
  useSubmitAnswerMutation,
} from "@/global/api/useSentenceGameQuery";

export default function MiniGamePlayPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const count = Number(searchParams.get("count") ?? 1);

  // 🔥 게임 문제 로드
  const { data, isLoading } = useStartGameQuery(count);

  // API에서 받은 문제들
  const questions = data?.questions ?? [];

  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // 🔥 정답 제출 API 훅
  const submitMutation = useSubmitAnswerMutation();

  if (isLoading) return <div className="p-10">Loading...</div>;
  if (!questions.length)
    return <div className="p-10">문제를 불러올 수 없습니다.</div>;

  const q = questions[current];

  const submitAnswer = () => {
    submitMutation.mutate(
      {
        sentenceGameId: q.id,
        userAnswer: input.trim(),
      },
      {
        onSuccess: (resp) => {
          const answerCorrect = resp.correct;

          if (answerCorrect) setCorrectCount((prev) => prev + 1);

          setIsCorrect(answerCorrect);
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

  return (
    <div className="min-h-screen p-10 bg-gray-100">
      <div className="max-w-xl mx-auto bg-white shadow-md rounded-xl p-6">
        {/* 🔥 게임 종료 화면 */}
        {isFinished ? (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-indigo-700">🎉 게임 완료!</h2>
            <p className="text-lg font-semibold text-gray-800">
              총 {questions.length}문제 중 {correctCount}문제 정답!
            </p>

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
            {/* 🔥 문제 화면 */}
            <h2 className="text-xl font-bold mb-4">
              문제 {current + 1} / {questions.length}
            </h2>

            <p className="text-gray-700 mb-3">
              잘못된 문장:{" "}
              <span className="font-semibold text-red-600">
                {q.originalContent}
              </span>
            </p>

            <input
              className="w-full border p-2 rounded-md mt-3"
              placeholder="올바른 문장을 입력하세요"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={showAnswer}
            />

            {!showAnswer && (
              <button
                onClick={submitAnswer}
                className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-md p-3 font-semibold"
              >
                제출하기
              </button>
            )}

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

                <p className="text-gray-800">
                  <span className="font-semibold">정답: </span>
                  {submitMutation.data?.correctedContent}
                </p>

                <button
                  onClick={goNext}
                  className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-md p-3 font-semibold"
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
