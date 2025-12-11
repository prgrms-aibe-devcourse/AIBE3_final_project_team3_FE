'use client';

import { useState } from 'react';

import { useLanguage } from "@/contexts/LanguageContext";
import {
  useSentenceGameDeleteMutation,
  useSentenceGameListQuery,
} from "@/global/api/useAdminGameQuery";

import AdminGuard from "../../AdminGuard";

export default function GameListPage() {
  const { t } = useLanguage();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useSentenceGameListQuery(page);
  const deleteMutation = useSentenceGameDeleteMutation();

  const gameItems = data?.content ?? [];

  const removeItem = (id: number) => {
    if (!confirm(t("admin.game.list.confirmDelete"))) return;

    deleteMutation.mutate(id, {
      onSuccess: () => {
        alert(t("admin.game.list.deleteSuccess"));
      },
    });
  };

  const totalPages = data?.totalPages ?? 0;
  const currentPage = data?.number ?? 0;
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <AdminGuard>
      <main
        className="max-w-6xl mx-auto space-y-6"
        style={{ color: "var(--page-text)" }}
      >
        <div className="theme-card rounded-3xl overflow-hidden">
          <div
            className="px-5 py-4 border-b text-lg font-semibold"
            style={{ borderColor: "var(--surface-border)" }}
          >
            {t("admin.game.list.title")}
          </div>

          {isLoading && (
            <div
              className="p-10 text-center text-sm"
              style={{ color: "var(--surface-muted-text)" }}
            >
              {t("admin.game.list.loading")}
            </div>
          )}

          {!isLoading && gameItems.length === 0 && (
            <div
              className="p-10 text-center text-sm"
              style={{ color: "var(--surface-muted-text)" }}
            >
              {t("admin.game.list.empty")}
            </div>
          )}

          {!isLoading && gameItems.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: "var(--surface-panel-muted)" }}>
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">
                      {t("admin.game.table.original")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      {t("admin.game.table.corrected")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      {t("admin.game.table.createdAt")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      {t("admin.game.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--surface-border)]">
                  {gameItems.map((item: any) => (
                    <tr
                      key={item.id}
                      className="hover:bg-emerald-500/5 transition-colors"
                    >
                      <td className="px-4 py-3">
                        {item.originalContent}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-emerald-500 font-medium">
                          {item.correctedContent}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--surface-muted-text)" }}>
                        {item.createdAt?.slice(0, 10)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="px-3 py-1 rounded-2xl bg-red-500 text-white text-xs font-semibold hover:bg-red-400 transition-colors"
                        >
                          {t("admin.game.list.remove")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div
            className="flex justify-center gap-2 p-4 border-t"
            style={{ borderColor: "var(--surface-border)" }}
          >
            {pageNumbers.map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${p === currentPage
                    ? "bg-emerald-500 text-white"
                    : "bg-[var(--surface-panel-muted)] text-[var(--surface-muted-text)] hover:text-[var(--page-text)]"
                  }`}
              >
                {p + 1}
              </button>
            ))}
          </div>
        </div>
      </main>
    </AdminGuard>
  );
}
