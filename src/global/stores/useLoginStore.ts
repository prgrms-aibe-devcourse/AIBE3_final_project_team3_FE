import { LoginState, MemberSummaryResp } from "@/global/types/auth.types";
import { jwtDecode } from "jwt-decode";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useLoginStore = create<LoginState>()(
  persist(
    (set) => ({
      member: null,
      accessToken: null,
      role: null,
      accountEmail: null,
      hasHydrated: false,

      setMember: (member: MemberSummaryResp | null) => set({ member }),
      setAccessToken: (token: string | null) => set({ accessToken: token }),
      setAccountEmail: (email: string | null) => set({ accountEmail: email }),

      setLogin: (token: string) => {
        const decoded: any = jwtDecode(token);
        const role = decoded.role ?? null;
        const decodedEmail =
          typeof decoded.email === "string" && decoded.email.length > 0
            ? decoded.email
            : typeof decoded.sub === "string" && decoded.sub.includes("@")
              ? decoded.sub
              : null;

        set((prev) => ({
          accessToken: token,
          role,
          accountEmail: decodedEmail ?? prev.accountEmail ?? null,
        }));
      },

      clearAccessToken: () =>
        set({ accessToken: null, role: null, member: null, accountEmail: null }),
      setHydrated: (value: boolean) => set({ hasHydrated: value }),
    }),
    {
      name: "login-storage",
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),

      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Failed to rehydrate login store", error);
        }

        state?.setHydrated?.(true);
      },
    },
  ),
);
