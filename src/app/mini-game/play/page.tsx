"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const DUMMY_QUESTIONS = [
  { id: 1, originalContent: "I goed to school.", correctedContent: "I went to school." },
  { id: 2, originalContent: "She don't like apples.", correctedContent: "She doesn't like apples." },
  { id: 3, originalContent: "He go to work every day.", correctedContent: "He goes to work every day." },
  { id: 4, originalContent: "They was happy.", correctedContent: "They were happy." },
  { id: 5, originalContent: "It have two legs.", correctedContent: "It has two legs." },
  { id: 6, originalContent: "We is ready.", correctedContent: "We are ready." },
];

export default function MiniGamePlayPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const count = Number(searchParams.get("count") ?? 1);

  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false); // 🔥 게임 종료 여부

  useEffect(() => {
    const shuffled = [...DUMMY_QUESTIONS].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, count));
  }, [count]);

  const submitAnswer = () => {
    const correct =
      input.trim().toLowerCase() ===
      questions[current].correctedContent.toLowerCase();

    if (correct) setCorrectCount((prev) => prev + 1);

    setIsCorrect(correct);
    setShowAnswer(true);
  };

  const goNext = () => {
    // 🔥 마지막 문제일 경우 → 종료 상태로 전환
    if (current + 1 === questions.length) {
      setIsFinished(true);
      return;
    }

    setCurrent(current + 1);
    setInput("");
    setShowAnswer(false);
    setIsCorrect(null);
  };

  const restart = () => {
    router.push(`/mini-game?count=${count}`);
  };

  if (questions.length === 0) return <div>Loading...</div>;
  const q = questions[current];

  return (
    <div className="min-h-screen p-10 bg-gray-100">
      <div className="max-w-xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* 🔥 게임 종료 화면 */}
        {isFinished ? (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-indigo-700">
              🎉 게임 완료!
            </h2>
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
            {/* 🔥 문제 진행 화면 */}
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
                  {q.correctedContent}
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
