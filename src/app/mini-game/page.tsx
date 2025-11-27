"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMiniGameTotalCount } from "@/global/api/useSentenceGameQuery";

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

  // 🔥 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        로딩 중...
      </div>
    );
  }

  // 🔥 문장 자체가 없는 경우
  if (totalCount === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-md text-center">
          <h1 className="text-2xl font-bold mb-3">문장 미니게임</h1>
          <p className="text-gray-600 mb-6">등록된 게임 문장이 없습니다.</p>
        </div>
      </div>
    );
  }

  // 🔥 콤보 박스 옵션
  const options = [1, 3, 5, 7, 10, 20];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-96 text-center">

        <h1 className="text-2xl font-bold mb-4">문장 미니게임</h1>

        {/* 전체 문장 수 표시 */}
        <p className="text-gray-600 mb-6">
          🔥 등록된 총 문장 수: <b>{totalCount}</b> 개
        </p>

        {/* 콤보박스 */}
        <select
          className="w-full p-2 border rounded mb-4"
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        >
          <option value={0}>선택해주세요</option>

          {options.map((opt) => (
            <option key={opt} value={opt} disabled={opt > totalCount!}>
              {opt} 문제
            </option>
          ))}
        </select>

        {/* 버튼 */}
        <button
          onClick={startGame}
          disabled={count === 0}
          className={`w-full py-2 rounded text-white ${
            count === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          게임 시작 →
        </button>

      </div>
    </div>
  );
}
