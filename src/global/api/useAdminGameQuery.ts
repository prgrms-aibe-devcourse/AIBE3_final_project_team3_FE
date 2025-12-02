import apiClient from "@/global/backend/client";
import type { components } from "@/global/backend/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { unwrap } from "../backend/unwrap";
import { API_BASE_URL } from "@/global/consts";
import { useLoginStore } from "@/global/stores/useLoginStore";

type SentenceGameItem = {
  id: number;
  originalContent: string;
  correctedContent: string;
  createdAt?: string;
};

type SentenceGameListResponse = {
  content: SentenceGameItem[];
  totalPages: number;
  number: number;
};

type SentenceGameNotePage = components["schemas"]["PageAdminSentenceGameNoteResp"];

const normalisePage = (page: number): number =>
  Number.isFinite(page) && page >= 0 ? Math.floor(page) : 0;

// =========================
// 📌 API 함수들
// =========================

// 1) 학습노트 목록 조회 (문장게임 등록용)
export async function fetchSentenceGameNoteList(page: number) {
  const { accessToken } = useLoginStore.getState();
  const safePage = normalisePage(page);

  const url = new URL("/api/v1/admin/sentence-game/notes", API_BASE_URL);
  url.searchParams.set("page", String(safePage));
  url.searchParams.set("size", "20");

  const response = await fetch(url.toString(), {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`문장게임 학습노트 목록 조회 실패: ${response.status}`);
  }

  const json = (await response.json()) as { data?: SentenceGameNotePage };
  if (!json.data) {
    return {
      content: [],
      totalPages: 0,
      number: safePage,
    } as SentenceGameNotePage;
  }

  return json.data;
}

// 2) 문장게임 문장 등록 (그대로 apiClient 사용)
export async function createSentenceGame(data: {
  originalContent: string;
  correctedContent: string;
}) {
  const res = await apiClient.POST("/api/v1/admin/sentence-game", { body: data });

  return unwrap(res);
}

// 3) 문장게임 목록 조회
export async function fetchSentenceGameList(page: number) {
  const { accessToken } = useLoginStore.getState();
  const safePage = normalisePage(page);

  const url = new URL("/api/v1/admin/sentence-game", API_BASE_URL);
  url.searchParams.set("page", String(safePage));
  url.searchParams.set("size", "20");

  const response = await fetch(url.toString(), {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`문장게임 목록 조회 실패: ${response.status}`);
  }

  // 응답이 CustomResponse<Page<SentenceGameItem>> 라고 가정
  const json = (await response.json()) as { data?: SentenceGameListResponse };
  if (!json.data) {
    return {
      content: [],
      totalPages: 0,
      number: safePage,
    } as SentenceGameListResponse;
  }

  return json.data;
}

// 4) 문장게임 삭제 (그대로 apiClient 사용)
export async function deleteSentenceGame(id: number) {
  const res = await apiClient.DELETE("/api/v1/admin/sentence-game/{sentenceGameId}", {
    params: {
      path: {
        sentenceGameId: id,
      },
    },
  });
  return unwrap(res);
}

// =========================
// 📌 React Query 훅
// =========================

// 학습노트 목록 조회 훅
export function useSentenceGameNoteQuery(page: number) {
  return useQuery({
    queryKey: ["sentenceGameNoteList", page],
    queryFn: () => fetchSentenceGameNoteList(page),
  });
}

// 문장 등록 훅
export function useSentenceGameCreateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSentenceGame,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sentenceGameList"] });
    },
  });
}

// 문장게임 목록 조회 훅
export function useSentenceGameListQuery(page: number) {
  return useQuery({
    queryKey: ["sentenceGameList", page],
    queryFn: () => fetchSentenceGameList(page),
  });
}

// 문장게임 삭제 훅
export function useSentenceGameDeleteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSentenceGame,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sentenceGameList"] });
    },
  });
}
