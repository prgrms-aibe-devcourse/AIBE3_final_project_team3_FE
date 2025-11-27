"use client";

import { useRouter } from "next/navigation";
import { useLoginStore } from "@/global/stores/useLoginStore";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { role, hasHydrated } = useLoginStore();

  // 1) hydration 끝날 때까지 화면 숨기기
  if (!hasHydrated) {
    return <div className="min-h-screen" />;
  }

  // 2) 관리자 아니면 홈으로 보냄
  if (role !== "ROLE_ADMIN") {
    router.replace("/");
    return null;
  }

  // 3) 최종적으로 children 렌더링
  return <>{children}</>;
}
