"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLoginStore } from "@/global/stores/useLoginStore";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { role } = useLoginStore();

  useEffect(() => {
    if (role !== "ROLE_ADMIN") {
      router.replace("/");
    }
  }, [role]);

  if (role !== "ROLE_ADMIN") return null;

  return <>{children}</>;
}