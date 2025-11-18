import { LoginState, MemberSummaryResp } from "@/global/types/auth.types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useLoginStore = create<LoginState>()(
  persist(
    (set) => ({
      member: null,
      accessToken: null,
      hasHydrated: false,

      setMember: (member: MemberSummaryResp | null) => set({ member }),
      setAccessToken: (token: string | null) => set({ accessToken: token }),
      clearAccessToken: () => set({ accessToken: null, member: null }),
      setHydrated: (value: boolean) => set({ hasHydrated: value }),
    }),
    {
      name: "login-storage", // localStorage에 저장될 키 이름
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Failed to rehydrate login store", error);
        }

        state?.setHydrated?.(true);
      },
    },
  ),
);
