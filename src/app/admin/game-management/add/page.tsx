"use client";

import { useState } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
import {
  useSentenceGameCreateMutation,
  useSentenceGameNoteQuery,
} from "@/global/api/useAdminGameQuery";

import AdminGuard from "../../AdminGuard";

export default function GameAddPage() {
  const { t } = useLanguage();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useSentenceGameNoteQuery(page);
  const createMutation = useSentenceGameCreateMutation();

  const available = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const currentPage = data?.number ?? 0;
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i);

  const handleAdd = (note: any) => {
    createMutation.mutate(
      {
        learningNoteId: note.id,
      },
      {
        onSuccess: () => {
          alert(t("admin.game.add.success"));
        },
        onError: (error: any) => {
          alert(error?.message ?? t("admin.game.add.error"));
        },
      },
    );
  };

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
            {t("admin.game.add.title")}
          </div>

          {isLoading && (
            <div
              className="p-10 text-center text-sm"
              style={{ color: "var(--surface-muted-text)" }}
            >
              {t("admin.game.add.loading")}
            </div>
          )}

          {!isLoading && available.length === 0 && (
            <div
              className="p-10 text-center text-sm"
              style={{ color: "var(--surface-muted-text)" }}
            >
              {t("admin.game.add.empty")}
            </div>
          )}

          {!isLoading && available.length > 0 && (
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
                      {t("admin.game.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--surface-border)]">
                  {available.map((note: any) => (
                    <tr
                      key={note.id}
                      className="hover:bg-emerald-500/5 transition-colors"
                    >
                      <td className="px-4 py-3 align-top">
                        <p>{note.originalContent}</p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="text-emerald-500 font-medium">
                          {note.correctedContent}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => handleAdd(note)}
                          className="px-3 py-1 rounded-2xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-400 transition-colors"
                        >
                          {t("admin.game.add.action")}
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
                  : "bg-[var(--surface-panel-muted)] text-[var(--surface-muted-text)] hover:text-[var(--page-text)]"}`}
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
