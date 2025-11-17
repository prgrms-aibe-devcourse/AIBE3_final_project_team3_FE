import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { LoginState, MemberSummaryResp } from "@/global/types/auth.types";
import { disconnect } from "../stomp/stompClient";

export const useLoginStore = create<LoginState>()(
  persist(
    (set) => ({
      member: null,
      accessToken: null,

      setMember: (member: MemberSummaryResp | null) => set({ member }),
      setAccessToken: (token: string | null) => {
        disconnect(); // STOMP 클라이언트 초기화
        set({ accessToken: token });
      },
      clearAccessToken: () => {
        disconnect(); // STOMP 클라이언트 연결 해제
        set({ accessToken: null, member: null });
      },
    }),
    {
      name: "login-storage", // localStorage에 저장될 키 이름
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
