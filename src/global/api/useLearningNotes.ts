import client from "@/global/backend/client";
import { unwrap } from "@/global/backend/unwrap";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// -----------------------------
//  Type Definitions
// -----------------------------

export type Note = {
  id: number;
  originalContent: string;
  correctedContent: string;
};

export type Feedback = {
  id: number;
  tag: string;
  problem: string;
  correction: string;
  extra?: string;
  marked: boolean;
};

export type FlattenFeedbackNote = {
  note: Note;
  feedback: Feedback;
};

type LearningTag = "Grammar" | "Vocabulary" | "Translation";
type LearningFilter = "all" | "completed" | "incomplete";
type LearningTagParam = "GRAMMAR" | "VOCABULARY" | "TRANSLATION";
type LearningFilterParam = "ALL" | "LEARNED" | "UNLEARNED";

// -----------------------------
//  Query Mappers
// -----------------------------

const mapFilter = (f: LearningFilter): LearningFilterParam => {
  switch (f) {
    case "completed":
      return "LEARNED";
    case "incomplete":
      return "UNLEARNED";
    default:
      return "ALL";
  }
};

const mapTag = (tag: LearningTag): LearningTagParam => {
  switch (tag) {
    case "Grammar":
      return "GRAMMAR";
    case "Vocabulary":
      return "VOCABULARY";
    case "Translation":
      return "TRANSLATION";
  }
};

// ==========================================
//    API - Fetch Notes (페이지네이션 추가)
// ==========================================

const fetchNotes = async (tag: LearningTag, filter: LearningFilter, page: number) => {
  const resp = await client.GET("/api/v1/learning-notes", {
    params: {
      query: {
        tag: mapTag(tag),
        learningFilter: mapFilter(filter),
        page,
        size: 20,
      },
    },
  });
  const payload = await unwrap<any>(resp);

  if (!payload || typeof payload !== "object") return { content: [] };
  if (!payload.content) return { content: [] };

  const content: FlattenFeedbackNote[] = payload.content.map((item: any) => ({
    note: item.note,
    feedback: item.feedback,
  }));

  return { ...payload, content };
};

// ==========================================
//   Hook
// ==========================================

export const useLearningNotes = (
  tag: LearningTag,
  filter: LearningFilter,
  page: number
) =>
  useQuery({
    queryKey: ["learningNotes", tag, filter, page],
    queryFn: () => fetchNotes(tag, filter, page),
    refetchOnWindowFocus: false,
    staleTime: 30000,
    placeholderData: (prev) => prev,
  });

// ==========================================
//   Mark Toggle
// ==========================================

export const useToggleFeedbackMark = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ feedbackId, mark }: { feedbackId: number; mark: boolean }) => {
      const path = mark
        ? "/api/v1/learning-notes/feedbacks/{feedbackId}/mark/learned"
        : "/api/v1/learning-notes/feedbacks/{feedbackId}/mark/unlearned";

      await client.PATCH(path, {
        params: { path: { feedbackId } },
      });

      return true;
    },

    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["learningNotes"] }), // 전체 리스트 갱신
  });
};
