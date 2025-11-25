// ==========================================
//   useLearningNotes.ts (완전체)
// ==========================================

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
//    Fetch Notes
// ==========================================

const fetchNotes = async (tag: string, filter: any) => {
  const q = new URLSearchParams();
  q.set("tag", mapTag(tag));
  q.set("learningFilter", mapFilter(filter));


  const resp = await client.GET(`/api/v1/learning-notes?${q.toString()}`, {});

  const payload = await unwrap<any>(resp);

  // 🚨 방어 코드 (가장 중요)
  if (!payload || typeof payload !== "object") {
    return { content: [] };
  }

  // unwrap(payload) = {content: [...], pageable: {...}}
  const page = payload;

  if (!page.content) {
    return { content: [] };
  }

  const content: FlattenFeedbackNote[] = page.content.map((item: any) => ({
    note: item.note,
    feedback: item.feedback,
  }));

  return {
    ...page,
    content,
  };
};

// ==========================================
//   Mark Toggle
// ==========================================

const patchMark = async (feedbackId: number, mark: boolean) => {
  const resp = await client.PATCH(
    `/api/v1/learning-notes/feedbacks/${feedbackId}/mark/${
      mark ? "learned" : "unlearned"
    }`,
    {}
  );

  await unwrap<void>(resp);
  return true;
};

export const useLearningNotes = (
  tag: "Grammar" | "Vocabulary" | "Translation",
  filter: "all" | "completed" | "incomplete"
) =>
  useQuery({
    queryKey: ["learningNotes", tag, filter],
    queryFn: () => fetchNotes(tag, filter),
    staleTime: 60000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });

export const useToggleFeedbackMark = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ feedbackId, mark }: { feedbackId: number; mark: boolean }) =>
      patchMark(feedbackId, mark),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["learningNotes"] }),
  });
};
