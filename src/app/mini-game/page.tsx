"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MiniGameStartPage() {
  const router = useRouter();
  const [count, setCount] = useState<number>(0);

  const startGame = () => {
    if (count <= 0) {
      alert("문제 수를 선택해주세요!");
      return;
    }
    router.push(`/mini-game/play?count=${count}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-96 text-center">
        <h1 className="text-2xl font-bold mb-4">문장 미니게임</h1>
        <p className="text-gray-600 mb-6">몇 문제를 풀지 선택해주세요</p>

        <select
          className="w-full p-2 border rounded mb-4"
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        >
          <option value={0}>선택해주세요</option>
          <option value={1}>1 문제</option>
          <option value={3}>3 문제</option>
          <option value={5}>5 문제</option>
          <option value={7}>7 문제</option>
          <option value={10}>10 문제</option>
        </select>

        <button
          onClick={startGame}
          className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          게임 시작 →
        </button>
      </div>
    </div>
  );
}
