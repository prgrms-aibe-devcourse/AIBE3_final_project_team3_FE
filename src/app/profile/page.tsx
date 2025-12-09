"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useLoginStore } from "@/global/stores/useLoginStore";
import { ProfileTabsLayout } from "./_components/ProfileTabsLayout";
import { ProfileTabsProvider } from "./_components/ProfileTabsProvider";

export default function ProfilePage() {
  const router = useRouter();
  const accessToken = useLoginStore((state) => state.accessToken);
  const hasHydrated = useLoginStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!accessToken) {
      router.replace("/auth/login");
    }
  }, [accessToken, hasHydrated, router]);

  if (!hasHydrated || !accessToken) {
    return null;
  }

  return (
    <ProfileTabsProvider>
      <ProfileTabsLayout />
    </ProfileTabsProvider>
  );
}
