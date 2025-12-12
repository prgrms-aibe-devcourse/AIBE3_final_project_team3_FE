"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  useLearningNotes,
  useToggleFeedbackMark,
  type FlattenFeedbackNote,
} from "@/global/api/useLearningNotes";

import { useLanguage } from "@/contexts/LanguageContext";
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
  const { t } = useLanguage();

  const fb = note.feedback;
  const tag = normalizeTag(fb.tag);

  const badgeStyleMap: Record<
    string,
    { background: string; text: string; border: string }
  > = {
    Grammar: {
      background: "var(--badge-grammar-bg)",
      text: "var(--badge-grammar-text)",
      border: "var(--badge-grammar-border)",
    },
    Vocabulary: {
      background: "var(--badge-vocabulary-bg)",
      text: "var(--badge-vocabulary-text)",
      border: "var(--badge-vocabulary-border)",
    },
    Translation: {
      background: "var(--badge-translation-bg)",
      text: "var(--badge-translation-text)",
      border: "var(--badge-translation-border)",
    },
  };

  const badgeStyle =
    badgeStyleMap[tag] ?? {
      background: "var(--badge-default-bg)",
      text: "var(--badge-default-text)",
      border: "var(--badge-default-border)",
    };

  return (
    <div className="theme-card rounded-2xl p-4">
      <div className="flex justify-between items-start w-full">
        {/* ---------- Left Section ---------- */}
        <div className="flex-1 max-w-[80%]">
          <h4 className="font-semibold text-white mb-2">{t("learningNotes.detailFeedback")}</h4>

          <div className="theme-surface-muted p-3 rounded-md shadow-sm">
            <span
              className="px-2 py-1 rounded text-xs font-semibold inline-block mb-2 border"
              style={{
                background: badgeStyle.background,
                color: badgeStyle.text,
                borderColor: badgeStyle.border,
              }}
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
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCompleted
              ? "bg-green-600 text-white"
              : "bg-[var(--surface-panel-muted)] text-[var(--surface-muted-text)] hover:bg-[var(--surface-panel)]"
              }`}
          >
            {isCompleted ? "✓" : "○"}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:bg-[var(--surface-panel-muted)]"
          >
            {isExpanded ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 border-t border-[var(--surface-border)] bg-[var(--surface-panel-muted)] p-4 rounded-md">
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
  const { t } = useLanguage();

  useEffect(() => {
    if (hasHydrated && !accessToken) {
      router.replace("/auth/login");
    }
  }, [accessToken, hasHydrated, router]);

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
    <div className="p-8 min-h-screen" style={{ background: "var(--page-bg)" }}>
      <div className="max-w-4xl mx-auto theme-surface rounded-3xl p-8 shadow-xl">
        <h1 className="text-4xl font-bold text-white mb-2">
          {t("learningNotes.title")}
        </h1>

        <p className="text-gray-400 mb-4">
          {t("learningNotes.subtitle")}
        </p>

        <div className="flex justify-end mb-6">
          <button
            onClick={() => router.push("/mini-game")}
            className="px-5 py-2 bg-emerald-600 text-white rounded-md shadow hover:bg-emerald-700"
          >
            {t("learningNotes.cta")} →
          </button>
        </div>

        {/* 태그 탭 */}
        <div className="flex justify-between mb-6">
          <div className="flex gap-3">
            {["ALL", "Grammar", "Vocabulary", "Translation"].map((tagKey) => (
              <button
                key={tagKey}
                onClick={() => setActiveTab(tagKey as any)}
                className={`px-4 py-2 rounded-md ${activeTab === tagKey
                  ? "bg-indigo-600 text-white"
                  : "border border-[var(--surface-border)] bg-[var(--surface-panel-muted)] text-[var(--page-text)]"
                  }`}
              >
                {{
                  ALL: t("learningNotes.tags.all"),
                  Grammar: t("learningNotes.tags.grammar"),
                  Vocabulary: t("learningNotes.tags.vocabulary"),
                  Translation: t("learningNotes.tags.translation"),
                }[tagKey as "ALL" | "Grammar" | "Vocabulary" | "Translation"] ?? tagKey}
              </button>
            ))}
          </div>

          {/* 완료 필터 */}
          <div className="flex gap-3">
            {[
              { key: "all", label: t("learningNotes.filters.all") },
              { key: "completed", label: t("learningNotes.filters.completed") },
              { key: "incomplete", label: t("learningNotes.filters.incomplete") },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as any)}
                className={`px-4 py-2 rounded-md ${filter === f.key
                  ? "bg-green-600 text-white"
                  : "border border-[var(--surface-border)] bg-[var(--surface-panel-muted)] text-[var(--page-text)]"
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
            <div className="p-6 theme-surface-muted rounded-md text-gray-400">
              {t("learningNotes.empty")}
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
              className={`px-3 py-1 rounded text-sm ${p === currentPage
                ? "bg-indigo-600 text-white"
                : "border border-[var(--surface-border)] bg-[var(--surface-panel-muted)] text-[var(--page-text)] hover:bg-[var(--surface-panel)]"
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
