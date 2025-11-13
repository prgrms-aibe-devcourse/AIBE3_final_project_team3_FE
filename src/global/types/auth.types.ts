import { components, operations } from "../backend/schema"; // schema.d.ts에서 타입 가져오기

// openapi.json의 SigninReq 스키마를 기반으로 로그인 요청 본문 타입 정의
// components.schemas.SigninReq를 직접 사용
export type UserLoginReqBody = components["schemas"]["SigninReq"];

// openapi.json의 MemberSummaryResp 스키마를 기반으로 사용자 요약 정보 타입 정의
// components.schemas.MemberSummaryResp를 직접 사용
export type MemberSummaryResp = components["schemas"]["MemberSummaryResp"];

// Zustand 로그인 스토어의 상태 타입 정의 (프론트엔드 전용이므로 수동 정의 유지)
export interface LoginState {
  member: MemberSummaryResp | null;
  accessToken: string | null;
  setMember: (member: MemberSummaryResp | null) => void;
  setAccessToken: (token: string | null) => void;
  clearAccessToken: () => void;
}
