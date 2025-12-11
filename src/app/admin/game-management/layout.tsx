'use client';

import { useLanguage } from "@/contexts/LanguageContext";

export default function GameManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useLanguage();

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      <h1 className="text-3xl font-bold" style={{ color: "var(--page-text)" }}>
        {t("admin.game.layoutTitle")}
      </h1>
      {children}
    </div>
  );
}
