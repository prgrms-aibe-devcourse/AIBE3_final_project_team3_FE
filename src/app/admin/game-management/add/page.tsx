'use client';

import { useState } from 'react';
import AdminGuard from "../../AdminGuard";

interface StudyNote {
  id: string;
  original_content: string;
  corrected_content: string;
  category: string;
}

const DUMMY_NOTES: StudyNote[] = [
  { id: '1', original_content: 'I go to school yesterday', corrected_content: 'I went to school yesterday', category: 'Grammar' },
  { id: '2', original_content: 'She dont like apple', corrected_content: 'She does not like apples', category: 'Grammar' },
];

export default function GameAddPage() {
  const [addedIds, setAddedIds] = useState(new Set(['1']));

  const available = DUMMY_NOTES.filter((n) => !addedIds.has(n.id));

  const add = (note: StudyNote) => {
    alert(`게임 문장으로 추가됨: ${note.original_content}`);
    setAddedIds(new Set([...addedIds, note.id]));
  };

  return (
    <AdminGuard>
    <main className="max-w-6xl mx-auto">
    <div className="bg-white rounded-lg border">
      <div className="p-4 border-b text-lg font-bold">문장 추가</div>

      {available.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          추가할 수 있는 문장이 없습니다.
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {available.map((note) => (
            <div
              key={note.id}
              className="border p-4 rounded-lg flex justify-between items-start hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-gray-900">{note.original_content}</p>
                <p className="text-green-700">{note.corrected_content}</p>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded mt-1 inline-block">
                  {note.category}
                </span>
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
    </div>
    </main>
    </AdminGuard>
  );
}
