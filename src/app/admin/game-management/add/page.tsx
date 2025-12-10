"use client";

import { useState } from "react";
import AdminGuard from "../../AdminGuard";
import {
  useSentenceGameNoteQuery,
  useSentenceGameCreateMutation,
} from "@/global/api/useAdminGameQuery";

export default function GameAddPage() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useSentenceGameNoteQuery(page);
  const createMutation = useSentenceGameCreateMutation();

  const available = data?.content ?? [];

  const add = (note: any) => {
    createMutation.mutate(note.id,
      {
        onSuccess: () => {
          alert("게임 문장으로 추가되었습니다.");
        },
        onError: (e: any) => {
          alert(e.message ?? "등록 실패");
        },
      }
    );
  };

  const totalPages = data?.totalPages ?? 0;
  const currentPage = data?.number ?? 0;
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <AdminGuard>
      <main className="max-w-6xl mx-auto text-gray-200">

        {/* 🔥 다크 카드 */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">

          {/* Header */}
          <div className="p-4 bg-gray-700 border-b border-gray-600 text-lg font-bold text-gray-200">
            문장 추가
          </div>

          {/* 로딩 */}
          {isLoading && (
            <div className="p-10 text-center text-gray-400">
              로딩 중입니다...
            </div>
          )}

          {/* 데이터 없음 */}
          {!isLoading && available.length === 0 && (
            <div className="p-10 text-center text-gray-400">
              추가할 수 있는 문장이 없습니다.
            </div>
          )}

          {/* 테이블 */}
          {!isLoading && available.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                
                {/* 테이블 헤더 */}
                <thead className="bg-gray-700 border-b border-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      원본 문장
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      수정된 문장
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      작업
                    </th>
                  </tr>
                </thead>

                {/* 테이블 내용 */}
                <tbody className="divide-y divide-gray-700">
                  {available.map((note: any) => (
                    <tr key={note.id} className="hover:bg-gray-700/40">

                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-200">
                          {note.originalContent}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-sm text-green-400">
                          {note.correctedContent}
                        </p>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => add(note)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-500 transition"
                        >
                          추가
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 페이지네이션 */}
          <div className="flex justify-center gap-2 p-4">
            {pageNumbers.map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 rounded text-sm ${
                  p === currentPage
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
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
