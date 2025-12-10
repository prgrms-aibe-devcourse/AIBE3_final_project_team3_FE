"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  useLearningNotes,
  useToggleFeedbackMark,
  type FlattenFeedbackNote,
} from "@/global/api/useLearningNotes";

import { useLoginStore } from "@/global/stores/useLoginStore";

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

  const tagColor =
    {
      Grammar: "bg-red-900/40 text-red-300 border border-red-700",
      Vocabulary: "bg-blue-900/40 text-blue-300 border border-blue-700",
      Translation: "bg-purple-900/40 text-purple-300 border border-purple-700",
    }[tag] ?? "bg-gray-700 text-gray-300";

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-md p-4">
      <div className="flex justify-between items-start w-full">
        {/* ---------- Left Section ---------- */}
        <div className="flex-1 max-w-[80%]">
          <h4 className="font-semibold text-white mb-2">상세 피드백</h4>

          <div className="bg-gray-800 p-3 rounded-md border border-gray-700 shadow-sm">
            <span
              className={`px-2 py-1 rounded text-xs font-semibold inline-block mb-2 ${tagColor}`}
            >
              {tag}
            </span>

            <p className="text-sm mb-1 text-gray-300">
              <span className="text-gray-400">오류: </span>
              <span className="text-red-400 font-medium">{fb.problem}</span>
            </p>

            <p className="text-sm mb-1 text-gray-300">
              <span className="text-gray-400">수정: </span>
              <span className="text-green-400 font-medium">{fb.correction}</span>
            </p>

            {fb.extra && (
              <p className="text-sm text-gray-300 mt-1">
                <span className="font-medium text-gray-400">설명: </span>
                {fb.extra}
              </p>
            )}
          </div>
        </div>

        {/* ---------- Right Buttons ---------- */}
        <div className="flex flex-col justify-center items-center gap-2 ml-4 mt-6">
          <button
            onClick={() => onToggleCompletion(fb.id, fb.marked)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isCompleted
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-400 hover:bg-gray-600"
            }`}
          >
            {isCompleted ? "✓" : "○"}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-700"
          >
            {isExpanded ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 border-t border-gray-700 bg-gray-700 p-4 rounded-md">
          <p className="text-gray-300">
            <span className="font-semibold text-gray-400">원본 문장: </span>
            {note.note.originalContent}
          </p>

          <p className="mt-2 text-gray-300">
            <span className="font-semibold text-green-400">수정됨: </span>
            {note.note.correctedContent}
          </p>
        </div>
      )}
    </div>
  );
}

// ========================================================
// PAGE COMPONENT
// ========================================================

export default function LearningNotesPage() {
  const router = useRouter();
  const { accessToken, hasHydrated } = useLoginStore();

  useEffect(() => {
    if (hasHydrated && !accessToken) {
      router.replace("/auth/login");
    }
  }, [accessToken]);

  const [activeTab, setActiveTab] =
    useState<"ALL" | "Grammar" | "Vocabulary" | "Translation">("ALL");

  const [filter, setFilter] =
    useState<"all" | "completed" | "incomplete">("all");

  const [page, setPage] = useState(0);

  const { data, isError } = useLearningNotes(activeTab, filter, page);

  const toggleMutation = useToggleFeedbackMark();

  useEffect(() => {
    setPage(0);
  }, [activeTab, filter]);

  const notes: FlattenFeedbackNote[] =
    !isError && data?.content ? data.content : [];

  const totalPages = data?.totalPages ?? 0;
  const currentPage = data?.number ?? 0;

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i);

  const onToggle = (id: number, marked: boolean) => {
    toggleMutation.mutate({ feedbackId: id, mark: !marked });
  };

  return (
    <div className="p-8 min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Learning Notes</h1>

        <p className="text-gray-400 mb-4">
          AI 피드백을 받은 학습 노트들을 정리해보세요
        </p>

        <div className="flex justify-end mb-6">
          <button
            onClick={() => router.push("/mini-game")}
            className="px-5 py-2 bg-emerald-600 text-white rounded-md shadow hover:bg-emerald-700"
          >
            문장 미니게임 시작하기 →
          </button>
        </div>

        {/* 태그 탭 */}
        <div className="flex justify-between mb-6">
          <div className="flex gap-3">
            {["ALL", "Grammar", "Vocabulary", "Translation"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t as any)}
                className={`px-4 py-2 rounded-md ${
                  activeTab === t
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-800 text-gray-300 border border-gray-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* 완료 필터 */}
          <div className="flex gap-3">
            {[
              { key: "all", label: "전체" },
              { key: "completed", label: "완료" },
              { key: "incomplete", label: "미완료" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as any)}
                className={`px-4 py-2 rounded-md ${
                  filter === f.key
                    ? "bg-green-600 text-white"
                    : "bg-gray-800 text-gray-300 border border-gray-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 카드 리스트 */}
        <div className="space-y-4">
          {notes.length === 0 ? (
            <div className="p-6 bg-gray-800 border border-gray-700 rounded-md text-gray-400">
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

        {/* 페이지네이션 */}
        <div className="flex justify-center gap-2 mt-6">
          {pageNumbers.map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1 rounded text-sm ${
                p === currentPage
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"
              }`}
            >
              {p + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
