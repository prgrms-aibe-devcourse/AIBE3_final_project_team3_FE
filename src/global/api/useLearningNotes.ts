import client from "@/global/backend/client";
import { unwrap } from "@/global/backend/unwrap";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/global/consts";
import { useLoginStore } from "@/global/stores/useLoginStore";

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

const normalisePage = (page: number): number =>
  Number.isFinite(page) && page >= 0 ? Math.floor(page) : 0;

// ==========================================
//    API - Fetch Notes (페이지네이션 추가)
// ==========================================

const fetchNotes = async (tag: LearningTag, filter: LearningFilter, page: number) => {
  const { accessToken } = useLoginStore.getState();
  const safePage = normalisePage(page);
  const size = 20;

  const url = new URL("/api/v1/learning-notes", API_BASE_URL);
  url.searchParams.set("tag", mapTag(tag));
  url.searchParams.set("learningFilter", mapFilter(filter));
  url.searchParams.set("page", String(safePage));
  url.searchParams.set("size", String(size));

  const response = await fetch(url.toString(), {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`학습노트 목록 조회 실패: ${response.status}`);
  }

  const json = await response.json();
  const payloadRoot =
    json && typeof json === "object" && "data" in json
      ? (json as { data: unknown }).data
      : json;

  if (!payloadRoot || typeof payloadRoot !== "object") {
    return { content: [] as FlattenFeedbackNote[] };
  }

  const payload = payloadRoot as {
    content?: any[];
    totalPages?: number;
    number?: number;
    [key: string]: unknown;
  };

  if (!Array.isArray(payload.content)) {
    return { ...payload, content: [] as FlattenFeedbackNote[] };
  }

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
  page: number,
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
      qc.invalidateQueries({ queryKey: ["learningNotes"] }), 
  });
};
