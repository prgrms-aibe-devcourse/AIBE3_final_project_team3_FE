'use client';

import { useState } from 'react';
import AdminGuard from "../../AdminGuard";

interface GameItem {
  id: string;
  noteId: string;
  original_content: string;
  corrected_content: string;
  category: string;
  addedAt: string;
}

const DUMMY_GAME_ITEMS: GameItem[] = [
  {
    id: 'game-1',
    noteId: '1',
    original_content: 'I go to school yesterday',
    corrected_content: 'I went to school yesterday',
    category: 'Grammar',
    addedAt: '2025-11-18',
  },
  {
    id: 'game-2',
    noteId: '2',
    original_content: 'She dont like apple',
    corrected_content: 'She does not like apples',
    category: 'Grammar',
    addedAt: '2025-11-19',
  },
];

export default function GameListPage() {
  const [gameItems, setGameItems] = useState<GameItem[]>(DUMMY_GAME_ITEMS);

  const remove = (id: string) => {
    setGameItems(gameItems.filter((g) => g.id !== id));
  };

  return (
    <AdminGuard>
    <main className="max-w-6xl mx-auto">
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">

      {/* Header */}
      <div className="p-4 bg-gray-50 border-b text-lg font-bold">
        등록된 게임 문장 목록
      </div>

      {/* Empty case */}
      {gameItems.length === 0 ? (
        <div className="p-10 text-center text-gray-500">
          현재 등록된 문장이 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">카테고리</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">원본 문장</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">수정된 문장</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">추가일</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">작업</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {gameItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {item.category}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900">{item.original_content}</p>
                  </td>

                  <td className="px-4 py-3">
                    <p className="text-sm text-green-700">{item.corrected_content}</p>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {item.addedAt}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => remove(item.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                    >
                      제거
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </main>
    </AdminGuard>
  );
}
