import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "@/global/backend/client";
import { unwrap } from "@/global/backend/unwrap";

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

// -----------------------------
//  Query Mappers
// -----------------------------

const mapFilter = (f: "all" | "completed" | "incomplete") => {
  switch (f) {
    case "completed":
      return "LEARNED";
    case "incomplete":
      return "UNLEARNED";
    default:
      return "ALL";
  }
};

const mapTag = (tag: string) => {
  switch (tag) {
    case "Grammar":
      return "GRAMMAR";
    case "Vocabulary":
      return "VOCABULARY";
    case "Translation":
      return "TRANSLATION";
    default:
      return "";
  }
};

// ==========================================
//    API - Fetch Notes (페이지네이션 추가)
// ==========================================

const fetchNotes = async (tag: string, filter: string, page: number) => {
  const q = new URLSearchParams();
  q.set("tag", mapTag(tag));
  q.set("learningFilter", mapFilter(filter));
  q.set("page", String(page));    
  q.set("size", "20");          

  const resp = await client.GET(`/api/v1/learning-notes?${q.toString()}`, {});
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
  tag: "Grammar" | "Vocabulary" | "Translation",
  filter: "all" | "completed" | "incomplete",
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
    mutationFn: ({ feedbackId, mark }: { feedbackId: number; mark: boolean }) =>
      client
        .PATCH(
          `/api/v1/learning-notes/feedbacks/${feedbackId}/mark/${
            mark ? "learned" : "unlearned"
          }`,
          {}
        )
        .then(() => true),

    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["learningNotes"] }), // 전체 리스트 갱신
  });
};
