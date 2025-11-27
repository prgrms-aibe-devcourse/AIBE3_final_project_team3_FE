import apiClient from "@/global/backend/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { unwrap } from "../backend/unwrap"; // 응답 처리 헬퍼

// =========================
// 📌 API 함수들
// =========================

// 1) 학습노트 목록 조회 (문장게임 등록용)
export async function fetchSentenceGameNoteList(page: number) {
    const res = await apiClient.GET("/api/v1/admin/sentence-game/notes", {
    params: {
      query: {
        page,
        size: 20
      }
    }
  });

  return res.data.data;
} 

// 2) 문장게임 문장 등록
export async function createSentenceGame(data: {
  originalContent: string;
  correctedContent: string;
}) {
  const res = await apiClient.POST("/api/v1/admin/sentence-game", {body: data});

  return unwrap(res);
}

// 3) 문장게임 목록 조회
export async function fetchSentenceGameList(page: number) {
const res = await apiClient.GET("/api/v1/admin/sentence-game",{
    params: {query :{ page, size: 20 }},
    }
  );
  return unwrap(res);
}

// 4) 문장게임 삭제
export async function deleteSentenceGame(id: number) {
  const res = await apiClient.DELETE(`/api/v1/admin/sentence-game/${id}`);
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
  return useMutation({
    mutationFn: createSentenceGame,
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
      qc.invalidateQueries(["sentenceGameList"]);
    },
  });
}
