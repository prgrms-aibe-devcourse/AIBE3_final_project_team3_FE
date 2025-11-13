import { FetchResponse } from "openapi-fetch";
import type { components } from "./schema"; // schema.d.ts에서 components 타입 가져오기

// 백엔드의 ApiResponse<T> 구조를 나타내는 제네릭 타입 정의
// T는 실제 데이터의 타입 (예: string, MemberSummaryResp)
type ApiResponseWrapper<T> = {
  msg: string;
  data?: T;
};

export const unwrap = async <T = unknown, TError = unknown, TStatus extends `${string}/${string}` = `${string}/${string}`>( // TStatus를 템플릿 리터럴 타입으로 변경
  response: FetchResponse<any, TError, TStatus>
): Promise<T> => {
  if (response.error) {
    throw response.error as unknown; // Cast to unknown to bypass 'never' error
  }
  return response.data?.data as T;
};
