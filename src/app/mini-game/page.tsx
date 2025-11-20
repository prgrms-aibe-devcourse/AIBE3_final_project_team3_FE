"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function MiniGameStartPage() {
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedCount, setSelectedCount] = useState<number>(1);

  useEffect(() => {
    // TODO: 실제 API 호출로 변경해야 함.
    // GET /api/v1/sentence-game
    setTotalCount(3);
  }, []);

  const selectableNumbers = [1, 3, 5, 10, 20];

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-lg mx-auto bg-white shadow-md rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-4">게임 시작하기</h1>

        <p className="text-gray-600 mb-3">
          이용 가능한 문제 수:{" "}
          <span className="text-indigo-600 font-semibold">{totalCount}개</span>
        </p>

        <label className="text-gray-700 font-semibold">몇 개의 문제를 풀 것인가요?</label>

        <select
          value={selectedCount}
          onChange={(e) => setSelectedCount(Number(e.target.value))}
          className="w-full border rounded-md p-2 mt-2"
        >
          {selectableNumbers.map((num) => (
            <option key={num} value={num} disabled={num > totalCount}>
              {num}개 {num > totalCount ? "(이용 불가)" : ""}
            </option>
          ))}
        </select>

        <p className="text-sm text-gray-500 mt-1">
          선택된 문제 수: {selectedCount}개
        </p>

        <Link
          href={`/mini-game/play?count=${selectedCount}`}
          className={`mt-6 block text-center py-3 rounded-lg text-white font-semibold ${
            selectedCount <= totalCount
              ? "bg-indigo-600 hover:bg-indigo-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          게임 시작!
        </Link>
      </div>
    </div>
  );
}
