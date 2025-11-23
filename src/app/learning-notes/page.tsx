"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  useLearningNotes,
  useToggleFeedbackMark,
  type FlattenFeedbackNote,
} from "@/global/api/useLearningNotes";

// ========================================================
// Tag Normalizer
// ========================================================
function normalizeTag(tag: string) {
  const t = tag.toUpperCase();
  if (t.includes("GRAMMAR")) return "Grammar";
  if (t.includes("VOCAB")) return "Vocabulary";
  if (t.includes("TRANSLATION")) return "Translation";
  return tag;
}

// ========================================================
// NoteCard Component
// ========================================================
function NoteCard({
  note,
  isCompleted,
  onToggleCompletion,
}: {
  note: FlattenFeedbackNote;
  isCompleted: boolean;
  onToggleCompletion: (feedbackId: number, currentMarked: boolean) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const fb = note.feedback;
  const tag = normalizeTag(fb.tag);

  const tagColor = {
    Grammar: "bg-red-100 text-red-700 border border-red-300",
    Vocabulary: "bg-blue-100 text-blue-700 border border-blue-300",
    Translation: "bg-purple-100 text-purple-700 border border-purple-300",
  }[tag] ?? "bg-gray-100 text-gray-700";

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-4">
      <div className="flex justify-between items-start w-full">
        {/* ---------- Left Section ---------- */}
        <div className="flex-1 max-w-[80%]">
          <h4 className="font-semibold text-gray-900 mb-2">상세 피드백</h4>

          <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
            {/* Tag */}
            <span
              className={`px-2 py-1 rounded text-xs font-semibold inline-block mb-2 ${tagColor}`}
            >
              {tag}
            </span>

            {/* 오류 */}
            <p className="text-sm mb-1">
              <span className="text-gray-600">오류: </span>
              <span className="text-red-600 font-medium">
                {fb.problem}
              </span>
            </p>

            {/* 수정 */}
            <p className="text-sm mb-1">
              <span className="text-gray-600">수정: </span>
              <span className="text-green-600 font-medium">
                {fb.correction}
              </span>
            </p>

            {/* 설명 */}
            {fb.extra && (
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-medium text-gray-600">설명: </span>
                {fb.extra}
              </p>
            )}
          </div>
        </div>

        {/* ---------- Right Buttons ---------- */}
        <div className="flex flex-col justify-center items-center gap-2 ml-4 mt-6">
          {/* 완료 버튼 */}
          <button
            onClick={() => onToggleCompletion(fb.id, fb.marked)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isCompleted
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-400 hover:bg-gray-300"
            }`}
          >
            {isCompleted ? "✓" : "○"}
          </button>

          {/* 펼치기 버튼 */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100"
          >
            {isExpanded ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {/* ---------- Expanded Section ---------- */}
      {isExpanded && (
        <div className="mt-4 border-t border-gray-300 bg-gray-50 p-4 rounded-md">
          <p className="text-gray-600">
            <span className="font-semibold">원본 문장: </span>
            {note.note.originalContent}
          </p>

          <p className="mt-2">
            <span className="font-semibold text-green-700">수정됨: </span>
            <span className="text-green-600">
              {note.note.correctedContent}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}


// ========================================================
// PAGE COMPONENT
// 상단 UI (Learning Notes 타이틀 + 부제 + 미니게임 버튼) 추가해줌
// ========================================================
export default function LearningNotesPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    "Grammar" | "Vocabulary" | "Translation"
  >("Grammar");

  const [filter, setFilter] = useState<"all" | "completed" | "incomplete">(
    "all"
  );

  const { data, isLoading, isError } = useLearningNotes(activeTab, filter);
  const toggleMutation = useToggleFeedbackMark();

  useEffect(() => {
    console.log("📌 Final page data:", data);
  }, [data]);

  if (isLoading)
    return <div className="p-8 text-gray-700">로딩 중...</div>;

  if (isError)
    return <div className="p-8 text-red-600">데이터를 불러오지 못했습니다.</div>;

  const notes: FlattenFeedbackNote[] = data?.content ?? [];

  const onToggle = (id: number, marked: boolean) => {
    toggleMutation.mutate({ feedbackId: id, mark: !marked });
  };

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto">

        {/* ⭐⭐⭐⭐⭐ 여기 전체 블록이 새로 추가된 부분 ⭐⭐⭐⭐⭐ */}
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
        {/* ⭐⭐⭐⭐⭐ 여기까지가 추가된 부분 ⭐⭐⭐⭐⭐ */}

        <div className="flex justify-between mb-6">
          <div className="flex gap-3">
            {["Grammar", "Vocabulary", "Translation"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t as any)}
                className={`px-4 py-2 rounded-md ${
                  activeTab === t
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-800"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            {[{ key: "all", label: "전체" }, { key: "completed", label: "완료" }, { key: "incomplete", label: "미완료" }].map(
              (f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key as any)}
                  className={`px-4 py-2 rounded-md ${
                    filter === f.key
                      ? "bg-green-600 text-white"
                      : "bg-white text-gray-700"
                  }`}
                >
                  {f.label}
                </button>
              )
            )}
          </div>
        </div>

        <div className="space-y-4">
          {notes.length === 0 ? (
            <div className="p-6 bg-white border rounded-md text-gray-600">
              조회된 노트가 없습니다.
            </div>
          ) : (
            notes.map((n) => (
              <NoteCard
                key={`${n.note.id}-${n.feedback.id}`}
                note={n}
                isCompleted={n.feedback.marked}
                onToggleCompletion={onToggle}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
