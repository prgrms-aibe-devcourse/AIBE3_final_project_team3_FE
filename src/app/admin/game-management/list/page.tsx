'use client';

import { useState } from 'react';
import AdminGuard from "../../AdminGuard";

import {
  useSentenceGameListQuery,
  useSentenceGameDeleteMutation,
} from "@/global/api/useAdminGameQuery";

export default function GameListPage() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useSentenceGameListQuery(page);
  const deleteMutation = useSentenceGameDeleteMutation();

  const gameItems = data?.content ?? [];

  const removeItem = (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    deleteMutation.mutate(id, {
      onSuccess: () => {
        alert("삭제되었습니다.");
      }
    });
  };

  // 페이지 정보
  const totalPages = data?.totalPages ?? 0;
  const currentPage = data?.number ?? 0;

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i);

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
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">원본 문장</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">수정된 문장</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">추가일</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">작업</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {gameItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900">{item.originalContent}</p>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-sm text-green-700">{item.correctedContent}</p>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {item.createdAt?.slice(0, 10)}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => removeItem(item.id)}
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

        {/* 🔥 숫자 페이지네이션 */}
        <div className="flex justify-center gap-2 p-4">
          {pageNumbers.map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1 rounded text-sm ${
                p === currentPage
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {p + 1}
            </button>
          ))}
        </div>
        </div>
      </main>
      </AdminGuard> 
  );
}
