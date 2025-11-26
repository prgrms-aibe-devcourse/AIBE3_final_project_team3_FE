'use client';

import { useState } from 'react';
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
        console.log(e);
        alert(e.response?.data?.message ?? "등록 실패");
      },
    }
  );
};

  return (
    // <AdminGuard>
      <main className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b text-lg font-bold">문장 추가</div>

          {available.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              추가할 수 있는 문장이 없습니다.
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {available.map((note: any) => (
                <div
                  key={note.id}
                  className="border p-4 rounded-lg flex justify-between items-start hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{note.originalContent}</p>
                    <p className="text-green-700">{note.correctedContent}</p>
                  </div>

                  <button
                    onClick={() => add(note)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    추가
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* pagination */}
          <div className="flex justify-center gap-3 p-4">
            <button
              disabled={data?.first}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
            >
              이전
            </button>

            <button
              disabled={data?.last}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
            >
              다음
            </button>
          </div>

        </div>
      </main>
    // {/* </AdminGuard> */}
  );
}
