// src/global/api/useMiniGameQuery.ts

import apiClient from "@/global/backend/client";
import { unwrap } from "@/global/backend/unwrap";
import { useQuery, useMutation } from "@tanstack/react-query";

// -------------------------------
// 🔥 1) 전체 문제 수 조회
// -------------------------------
export const fetchTotalCount = async () => {
  const res = await apiClient.GET("/api/v1/sentence-game", {});
  return unwrap(res);
};

// -------------------------------
// 🔥 2) 게임 시작 (문제 N개 가져오기)
// -------------------------------
export const fetchStartGame = async (count: number) => {
  const res = await apiClient.GET("/api/v1/sentence-game/start", {
    params: {query:{ count }},
  });
  return unwrap(res);
};

// -------------------------------
// 🔥 3) 정답 제출
// -------------------------------
export const submitGameAnswer = async (body: {
  sentenceGameId: number;
  userAnswer: string;
}) => {
  const res = await apiClient.POST("/api/v1/sentence-game/submit", {
    body,
  });
  return unwrap(res);
};

// -------------------------------
// 🔥 React Query Hooks
// -------------------------------

// 전체 문제 수 조회 훅
export const useMiniGameTotalCount = () =>
  useQuery({
    queryKey: ["miniGameTotal"],
    queryFn: fetchTotalCount,
  });

// 게임 시작 훅
export const useStartGameQuery = (count: number) =>
  useQuery({
    queryKey: ["miniGameStart", count],
    queryFn: () => fetchStartGame(count),
    enabled: count > 0,
    retry: 0,
  });

// 정답 제출 훅
export const useSubmitAnswerMutation = () =>
  useMutation({
    mutationFn: submitGameAnswer,
  });
