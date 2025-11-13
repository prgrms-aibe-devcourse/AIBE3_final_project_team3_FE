import createClient from "openapi-fetch";
import { API_BASE_URL } from "../consts"; // API 기본 URL 가져오기
import type { paths } from "./schema"; // openapi-typescript로 생성된 타입 가져오기
import { useLoginStore } from "../stores/useLoginStore"; // Zustand 스토어 임포트

// 커스텀 fetch 함수 정의
// 이 함수가 모든 API 요청에 인증 헤더를 자동으로 추가합니다.
const customFetch: typeof fetch = async (input, init) => {
  const { accessToken } = useLoginStore.getState(); // Zustand 스토어에서 토큰 가져오기

  const headers = new Headers(init?.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  // 원래 fetch 함수를 호출하되, 수정된 헤더를 사용합니다.
  return fetch(input, { ...init, headers });
};

// openapi-fetch 클라이언트 인스턴스 생성
// customFetch 함수를 사용하여 모든 요청에 인증 헤더를 자동으로 포함시킵니다.
const client = createClient<paths>({ baseUrl: API_BASE_URL, fetch: customFetch });

export default client;
