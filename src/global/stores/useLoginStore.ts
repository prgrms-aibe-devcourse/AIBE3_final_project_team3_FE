import { LoginState, MemberSummaryResp } from "@/global/types/auth.types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";

export const useLoginStore = create<LoginState>()(
  persist(
    (set) => ({
      member: null,
      accessToken: null,
      role: null,
      hasHydrated: false,

      setMember: (member: MemberSummaryResp | null) => set({ member }),
      setAccessToken: (token: string | null) => set({ accessToken: token }),

      setLogin: (token: string) => {
        const decoded: any = jwtDecode(token);
        const role = decoded.role ?? null;

        set({accessToken: token,role,});
      },

      clearAccessToken: () =>set({accessToken: null,role: null,member: null,}),
      setHydrated: (value: boolean) => set({ hasHydrated: value }),
    }),
    {
      name: "login-storage",
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
