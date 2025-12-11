"use client";

import { useState } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
import {
  useReportQuery,
  useReportStatusMutation,
} from "@/global/api/useAdminReportQuery";
import type { AdminReport, ReportCategory, ReportStatus } from "@/global/types/report.types";

import AdminGuard from "../AdminGuard";

const statusBadgeClasses: Record<ReportStatus, string> = {
  WAITING: "bg-amber-500/15 text-amber-500 border border-amber-400/40",
  REVIEWING: "bg-blue-500/15 text-blue-500 border border-blue-400/40",
  APPROVED: "bg-emerald-500/15 text-emerald-500 border border-emerald-400/40",
  REJECTED: "bg-rose-500/15 text-rose-500 border border-rose-400/40",
};

const categoryBadgeClasses: Record<ReportCategory, string> = {
  ABUSE: "bg-rose-500/15 text-rose-500 border border-rose-400/40",
  SCAM: "bg-amber-400/15 text-amber-500 border border-amber-300/50",
  INAPPROPRIATE: "bg-violet-500/15 text-violet-400 border border-violet-300/50",
  OTHER: "bg-slate-500/15 text-slate-400 border border-slate-300/40",
};

export default function ReportManagementPage() {
  const { t } = useLanguage();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useReportQuery(page);
  const statusMutation = useReportStatusMutation();

  const list = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const currentPage = data?.number ?? 0;
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i);

  const [selected, setSelected] = useState<AdminReport | null>(null);
  const [newStatus, setNewStatus] = useState<ReportStatus>("WAITING");

  const getStatusLabel = (status: ReportStatus) => {
    const key = `admin.report.statuses.${status.toLowerCase()}`;
    const label = t(key);
    return label === key ? status : label;
  };
  const getCategoryLabel = (category: ReportCategory) => {
    const key = `admin.report.categories.${category.toLowerCase()}`;
    const label = t(key);
    return label === key ? category : label;
  };

  return (
    <AdminGuard>
      <main
        className="max-w-6xl mx-auto space-y-6"
        style={{ color: "var(--page-text)" }}
      >
        <h1 className="text-3xl font-bold">{t("admin.report.title")}</h1>

        <div className="theme-card rounded-3xl overflow-hidden">
          <div
            className="px-5 py-4 border-b text-lg font-semibold"
            style={{ borderColor: "var(--surface-border)" }}
          >
            {t("admin.report.listTitle")}
          </div>

          {isLoading && (
            <div
              className="p-10 text-center text-sm"
              style={{ color: "var(--surface-muted-text)" }}
            >
              {t("admin.report.loading")}
            </div>
          )}

          {!isLoading && list.length === 0 && (
            <div
              className="p-10 text-center text-sm"
              style={{ color: "var(--surface-muted-text)" }}
            >
              {t("admin.report.empty")}
            </div>
          )}

          {!isLoading && list.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: "var(--surface-panel-muted)" }}>
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">
                      {t("admin.report.table.id")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      {t("admin.report.table.status")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      {t("admin.report.table.category")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      {t("admin.report.table.message")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      {t("admin.report.table.reason")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      {t("admin.report.table.date")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      {t("admin.report.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--surface-border)]">
                  {list.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-emerald-500/5 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">{report.id}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-2 ${statusBadgeClasses[report.status]}`}
                        >
                          <span className="inline-block w-2 h-2 rounded-full bg-current" />
                          {getStatusLabel(report.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${categoryBadgeClasses[report.category]}`}
                        >
                          {getCategoryLabel(report.category)}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate" style={{ color: "var(--surface-muted-text)" }}>
                        {report.reportedMsgContent ?? t("admin.report.noMessage")}
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate" style={{ color: "var(--surface-muted-text)" }}>
                        {report.reportedReason ?? t("admin.report.noReason")}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--surface-muted-text)" }}>
                        {report.createdAt?.slice(0, 10)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          disabled={report.status !== "WAITING"}
                          onClick={() => {
                            if (report.status !== "WAITING") return;
                            setSelected(report);
                            setNewStatus(report.status);
                          }}
                          className={`px-3 py-1 rounded-2xl text-xs font-semibold transition-colors ${report.status === "WAITING"
                            ? "bg-emerald-500 text-white hover:bg-emerald-400"
                            : "bg-[var(--surface-panel-muted)] text-[var(--surface-muted-text)] cursor-not-allowed"
                            }`}
                        >
                          {t("admin.report.statusButton")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-center gap-2 p-4" style={{ borderTop: `1px solid var(--surface-border)` }}>
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

        {selected && (
          <div className="fixed inset-0 theme-overlay flex justify-end z-50">
            <div className="w-full max-w-md h-full theme-card border-l p-6 overflow-y-auto" style={{ borderColor: "var(--surface-border)" }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {t("admin.report.detail.title")}
                </h2>
                <button
                  className="text-2xl leading-none text-[var(--surface-muted-text)] hover:text-red-400"
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="mb-4">
                <label className="text-sm font-semibold block mb-2" style={{ color: "var(--surface-muted-text)" }}>
                  {t("admin.report.detail.reportedUser")}
                </label>
                <div className="theme-field rounded-2xl text-sm">
                  ID: {selected.targetMemberId}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-semibold block mb-2" style={{ color: "var(--surface-muted-text)" }}>
                  {t("admin.report.detail.category")}
                </label>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${categoryBadgeClasses[selected.category]}`}
                >
                  {getCategoryLabel(selected.category)}
                </span>
              </div>

              <div className="mb-4">
                <label className="text-sm font-semibold block mb-2" style={{ color: "var(--surface-muted-text)" }}>
                  {t("admin.report.detail.message")}
                </label>
                <textarea
                  readOnly
                  className="w-full theme-field rounded-2xl p-3 text-sm min-h-[120px]"
                  value={selected.reportedMsgContent ?? t("admin.report.noMessage")}
                />
              </div>

              <div className="mb-4">
                <label className="text-sm font-semibold block mb-2" style={{ color: "var(--surface-muted-text)" }}>
                  {t("admin.report.detail.reason")}
                </label>
                <textarea
                  readOnly
                  className="w-full theme-field rounded-2xl p-3 text-sm min-h-[120px]"
                  value={selected.reportedReason ?? t("admin.report.noReason")}
                />
              </div>

              <div className="mb-6">
                <label className="text-sm font-semibold block mb-2" style={{ color: "var(--surface-muted-text)" }}>
                  {t("admin.report.detail.status")}
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
                  className="theme-field w-full rounded-2xl p-3"
                >
                  <option value="WAITING">{getStatusLabel("WAITING")}</option>
                  <option value="APPROVED">{getStatusLabel("APPROVED")}</option>
                  <option value="REJECTED">{getStatusLabel("REJECTED")}</option>
                </select>
              </div>

              <div className="flex justify-between gap-3">
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 px-4 py-2 rounded-2xl border border-[var(--surface-border)] text-[var(--page-text)] hover:border-emerald-400"
                >
                  {t("admin.report.detail.cancel")}
                </button>

                <button
                  onClick={() =>
                    statusMutation.mutate(
                      { id: selected.id, status: newStatus },
                      { onSuccess: () => setSelected(null) },
                    )
                  }
                  className="flex-1 px-4 py-2 rounded-2xl bg-emerald-500 text-white font-semibold hover:bg-emerald-400"
                >
                  {t("admin.report.detail.save")}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminGuard>
  );
}
