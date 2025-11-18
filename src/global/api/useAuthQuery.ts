import { createQueryKeys } from "@lukemorales/query-key-factory";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation"; // Next.js 라우터 훅

import client from "../backend/client"; // openapi-fetch 클라이언트
import type { paths } from "../backend/schema"; // openapi-typescript로 생성된 타입
import { unwrap } from "../backend/unwrap"; // 응답 처리 헬퍼
import { isAllowedPath } from "../lib/utils"; // 유틸리티 함수
import { useLoginStore } from "../stores/useLoginStore"; // Zustand 로그인 스토어
import { MemberSummaryResp, UserJoinReqBody, UserLoginReqBody } from "../types/auth.types"; // 타입 정의

// --- 1. 순수 API 호출 함수 정의 ---
// openapi-fetch 클라이언트의 타입은 paths['/api/v1/auth/login']['post'] 등으로 접근합니다.

// 내 정보 조회
const me = async () => {
  const response = await client.GET("/api/v1/member/me", {}); // 실제 API 경로 확인 필요
  return unwrap<MemberSummaryResp>(response);
};

// 로그인
const login = async (body: UserLoginReqBody) => {
  const response = await client.POST("/api/v1/auth/login", { body: body as paths["/api/v1/auth/login"]["post"]["requestBody"]["content"]["application/json"] });
  return unwrap<string>(response); // 토큰 문자열 반환 예상
};

// 회원가입
const signup = async (body: UserJoinReqBody) => {
  const response = await client.POST("/api/v1/auth/join", { body: body as paths["/api/v1/auth/join"]["post"]["requestBody"]["content"]["application/json"] });
  return unwrap<void>(response);
};

// 로그아웃
const logout = async () => {
  const response = await client.POST("/api/v1/auth/logout", {}); // 실제 API 경로 확인 필요
  return unwrap<void>(response);
};

// --- 2. 쿼리 키 팩토리 정의 ---
export const authQueryKeys = createQueryKeys("auth", {
  me: () => ["me"],
  login: () => ["login"],
  logout: () => ["logout"],
  signup: () => ["signup"],
});

// --- 3. React Query 커스텀 훅 정의 ---

// 내 정보 조회 훅
export const useFetchMe = () => {
  const { accessToken } = useLoginStore(); // 토큰이 있어야만 요청하도록
  return useQuery({
    queryKey: authQueryKeys.me().queryKey,
    queryFn: me,
    enabled: !!accessToken, // accessToken이 있을 때만 쿼리 실행
    staleTime: 5 * 60 * 1000, // 5분 동안 fresh 상태 유지
    gcTime: 10 * 60 * 1000, // 10분 동안 캐시 유지
    retry: 0, // 실패 시 재시도 안함
  });
};

// 로그인 훅
export const useLogin = () => {
  const qc = useQueryClient();
  const { setAccessToken, setMember } = useLoginStore();
  return useMutation({
    mutationKey: authQueryKeys.login().queryKey,
    mutationFn: login,
    onSuccess: (token) => {
      setAccessToken(token); // Zustand 스토어에 토큰 저장
      // 로그인 성공 후 내 정보 쿼리 무효화하여 최신 정보 가져오도록 유도
      qc.invalidateQueries({ queryKey: authQueryKeys.me().queryKey });
      // 또는 직접 내 정보 가져와서 저장 (옵션)
      // qc.fetchQuery({ queryKey: authQueryKeys.me().queryKey, queryFn: me })
      //   .then(memberData => setMember(memberData))
      //   .catch(err => console.error("Failed to fetch member after login", err));
    },
  });
};

// 회원가입 훅
export const useSignup = () => {
  return useMutation({
    mutationKey: authQueryKeys.signup().queryKey,
    mutationFn: signup,
  });
};

// 로그아웃 훅
export const useLogout = () => {
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const { clearAccessToken } = useLoginStore();

  return useMutation({
    mutationKey: authQueryKeys.logout().queryKey,
    mutationFn: logout,
    onSuccess: () => {
      clearAccessToken(); // Zustand 스토어에서 토큰 및 멤버 정보 삭제
      qc.cancelQueries(); // 모든 진행 중인 쿼리 취소
      qc.clear(); // 모든 React Query 캐시 삭제

      // 인증이 필요 없는 경로가 아니라면 로그인 페이지로 리다이렉트
      if (!isAllowedPath(pathname)) {
        router.replace("/auth/login"); // 히스토리 대체 (뒤로가기 방지)
      }
    },
  });
};
