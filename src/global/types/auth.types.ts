import { components } from "../backend/schema"; // schema.d.ts에서 타입 가져오기

// openapi.json의 SignInReq 스키마를 기반으로 로그인 요청 본문 타입 정의
// components.schemas.SignInReq를 직접 사용
export type UserLoginReqBody = components["schemas"]["SignInReq"];
export type UserJoinReqBody = components["schemas"]["MemberJoinReq"];

// openapi.json의 MemberSummaryResp 스키마를 기반으로 사용자 요약 정보 타입 정의
// components.schemas.MemberSummaryResp를 직접 사용
export type MemberSummaryResp = {
  id: number;
  name: string;
  country: string;
  nickname: string;
  englishLevel: string;
  interest: string[];
  description: string;
};

export type CustomResponse<T> = {
  msg: string;
  data?: T;
};

export type MessageResp = {
  id: string;
  senderId: number;
  sender: string;
  content: string;
  createdAt: string; // ISO 8601 형식의 문자열
  messageType: "TALK" | "IMAGE" | "FILE" | "SYSTEM"; // 백엔드 ChatMessage.MessageType enum 값에 따라
};

// Zustand 로그인 스토어의 상태 타입 정의 (프론트엔드 전용이므로 수동 정의 유지)
export interface LoginState {
  member: MemberSummaryResp | null;
  accessToken: string | null;
  setMember: (member: MemberSummaryResp | null) => void;
  setAccessToken: (token: string | null) => void;
  clearAccessToken: () => void;
}
