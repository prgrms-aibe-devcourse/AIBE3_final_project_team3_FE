"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Feedback {
  tag: "Grammar" | "Vocabulary" | "Translation";
  problem: string;
  correction: string;
  extra: string;
}

interface StudyNote {
  id: string;
  original_content: string;
  corrected_content: string;
  feedback: Feedback[];
  category: "Grammar" | "Vocabulary" | "Translation";
  completed: boolean;
}

const DUMMY_NOTES: StudyNote[] = [
  {
    id: "1",
    original_content: "I go to school yesterday",
    corrected_content: "I went to school yesterday",
    category: "Grammar",
    completed: false,
    feedback: [
      {
        tag: "Grammar",
        problem: "go",
        correction: "went",
        extra: "과거형을 사용해야 합니다.",
      },
    ],
  },
  {
    id: "2",
    original_content: "She dont like apple",
    corrected_content: "She does not like apples",
    category: "Grammar",
    completed: true,
    feedback: [
      {
        tag: "Grammar",
        problem: "dont",
        correction: "does not",
        extra: "3인칭 단수에서 do의 형태 확인",
      },
    ],
  },
  {
    id: "3",
    original_content: 'The word "beautiful" means 아름다운',
    corrected_content: 'The word "beautiful" means beautiful or pretty',
    category: "Vocabulary",
    completed: false,
    feedback: [
      {
        tag: "Vocabulary",
        problem: "아름다운→beautiful",
        correction: "beautiful - meaning: attractive or pleasing",
        extra: "",
      },
    ],
  },
];

function NoteCard({
  note,
  isCompleted,
  onToggleCompletion,
}: {
  note: StudyNote;
  isCompleted: boolean;
  onToggleCompletion: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const fb = note.feedback[0];

  const getTagColor = (tag: string): string => {
    switch (tag) {
      case "Grammar":
        return "bg-red-100 text-red-700 border border-red-300";
      case "Vocabulary":
        return "bg-blue-100 text-blue-700 border border-blue-300";
      case "Translation":
        return "bg-purple-100 text-purple-700 border border-purple-300";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-4">
      <div className="flex justify-between items-start w-full">
        <div className="flex-1 max-w-[80%]">
          <h4 className="font-semibold text-gray-900 mb-2">상세 피드백</h4>

          <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
            <div className="flex items-start gap-3">
              <span
                className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${getTagColor(
                  fb.tag
                )}`}
              >
                {fb.tag}
              </span>

              <div className="flex-1">
                <p className="text-sm mb-2">
                  <span className="text-gray-600">오류: </span>
                  <span className="text-red-600 font-medium line-through">
                    {fb.problem}
                  </span>
                </p>

                <p className="text-sm mb-2">
                  <span className="text-gray-600">수정: </span>
                  <span className="text-green-600 font-medium">
                    {fb.correction}
                  </span>
                </p>

                {fb.extra && (
                  <p className="text-sm">
                    <span className="text-gray-600">설명: </span>
                    {fb.extra}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 버튼 영역 — 살짝 아래로 내림 */}
        <div className="flex flex-col justify-center items-center gap-2 ml-4 mt-6">
          <button
            onClick={() => onToggleCompletion(note.id)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isCompleted
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-400 hover:bg-gray-300"
            }`}
          >
            {isCompleted ? "✓" : "○"}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100"
          >
            {isExpanded ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 border-t border-gray-300 bg-gray-50 p-4 rounded-md">
          <p className="text-gray-600">
            <span className="font-semibold">원본 문장: </span>
            <span className="line-through text-gray-500">
              {note.original_content}
            </span>
          </p>

          <p className="mt-2">
            <span className="font-semibold text-green-700">수정됨: </span>
            <span className="text-green-600">{note.corrected_content}</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default function LearningNotesPage() {
  const [activeTab, setActiveTab] =
    useState<"Grammar" | "Vocabulary" | "Translation">("Grammar");

  const [filter, setFilter] =
    useState<"all" | "completed" | "incomplete">("all");

  const [completedNotes, setCompletedNotes] = useState<Set<string>>(
    new Set(DUMMY_NOTES.filter((n) => n.completed).map((n) => n.id))
  );

  const router = useRouter();

  const toggleCompletion = (id: string) => {
    const updated = new Set(completedNotes);
    updated.has(id) ? updated.delete(id) : updated.add(id);
    setCompletedNotes(updated);
  };

  const notes = DUMMY_NOTES.filter((note) => {
    if (note.category !== activeTab) return false;
    if (filter === "completed") return completedNotes.has(note.id);
    if (filter === "incomplete") return !completedNotes.has(note.id);
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Learning Notes
        </h1>
        <p className="text-gray-600 mb-4">
          AI 피드백을 받은 학습 노트들을 정리해보세요
        </p>

        <div className="flex justify-end mb-6">
          <button
            onClick={() => router.push("/mini-game")}
            className="px-5 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700"
          >
            문장 미니게임 시작하기 →
          </button>
        </div>

        {/* 탭 & 필터 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-3">
            {["Grammar", "Vocabulary", "Translation"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t as any)}
                className={`px-4 py-2 rounded-md font-semibold ${
                  activeTab === t
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            {[
              { key: "all", label: "전체" },
              { key: "completed", label: "완료" },
              { key: "incomplete", label: "미완료" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as any)}
                className={`px-4 py-2 rounded-md font-semibold ${
                  filter === f.key
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isCompleted={completedNotes.has(note.id)}
              onToggleCompletion={toggleCompletion}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
