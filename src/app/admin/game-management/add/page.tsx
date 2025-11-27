"use client";

import { useState } from "react";
import AdminGuard from "../../AdminGuard";
import {
  useSentenceGameNoteQuery,
  useSentenceGameCreateMutation,
  fetchSentenceGameList
} from "@/global/api/useAdminGameQuery";

export default function GameAddPage() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useSentenceGameNoteQuery(page);
  const createMutation = useSentenceGameCreateMutation();

  const available = data?.content ?? [];

  const add = (note: any) => {
    createMutation.mutate(
      {
        originalContent: note.originalContent,
        correctedContent: note.correctedContent,
      },
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

  // 페이지 정보
  const totalPages = data?.totalPages ?? 0;
  const currentPage = data?.number ?? 0;
  // 페이지 번호 배열 생성
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i);

  return (
    //<AdminGuard>
      <main className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">

          {/* Header */}
          <div className="p-4 bg-gray-50 border-b text-lg font-bold">
            문장 추가
          </div>

          {/* 로딩 */}
          {isLoading && (
            <div className="p-10 text-center text-gray-500">
              로딩 중입니다...
            </div>
          )}

          {/* 데이터 없음 */}
          {!isLoading && available.length === 0 && (
            <div className="p-10 text-center text-gray-500">
              추가할 수 있는 문장이 없습니다.
            </div>
          )}

          {/* 테이블 */}
          {!isLoading && available.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      원본 문장
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      수정된 문장
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      작업
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {available.map((note: any) => (
                    <tr key={note.id} className="hover:bg-gray-50">

                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">{note.originalContent}</p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-sm text-green-700">{note.correctedContent}</p>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => add(note)}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
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
    // </AdminGuard>
  );
}
