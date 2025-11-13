import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { LoginState, MemberSummaryResp } from "@/global/types/auth.types";

export const useLoginStore = create<LoginState>()(
  persist(
    (set) => ({
      member: null,
      accessToken: null,

      setMember: (member: MemberSummaryResp | null) => set({ member }),
      setAccessToken: (token: string | null) => set({ accessToken: token }),
      clearAccessToken: () => set({ accessToken: null, member: null }),
    }),
    {
      name: "login-storage", // localStorage에 저장될 키 이름
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
