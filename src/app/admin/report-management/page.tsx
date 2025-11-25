"use client";

import { useState } from "react";
import { useReportQuery, useReportStatusMutation } from "@/global/api/useReportQuery";
import type { AdminReport, ReportStatus } from "@/global/types/report.types";
import AdminGuard from "../AdminGuard";

const statusColors: Record<ReportStatus, string> = {
  WAITING: "bg-yellow-100 text-yellow-800",
  REVIEWING: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const categoryColors: Record<string, string> = {
  ABUSE: "bg-red-100 text-red-800",
  SCAM: "bg-orange-100 text-orange-800",
  INAPPROPRIATE: "bg-pink-100 text-pink-800",
  OTHER: "bg-gray-100 text-gray-800",
};

export default function ReportManagementPage() {
  const { data: reports } = useReportQuery();
  const statusMutation = useReportStatusMutation();

  const [selected, setSelected] = useState<AdminReport | null>(null);
  const [newStatus, setNewStatus] =
    useState<ReportStatus>("WAITING");
 

  return (
    <AdminGuard>
    <main className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">신고 관리</h1>

      {/* 리스트 */}
      <div className="grid gap-4">
        {reports?.map((report) => (
          <div key={report.id} className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between">
              <div>
                <div className="flex gap-2 mb-2">
                  <span className="text-sm font-semibold">ID: {report.id}</span>

                  <span
                    className={`px-2 py-1 rounded text-xs ${statusColors[report.status]}`}
                  >
                    {report.status}
                  </span>

                  <span
                    className={`px-2 py-1 rounded text-xs ${categoryColors[report.category]}`}
                  >
                    {report.category}
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-1">
                  "{report.reportedMsgContent}"
                </p>
                <p className="text-xs text-gray-400">{report.createdAt}</p>
              </div>

              <button
                onClick={() => {
                  setSelected(report);
                  setNewStatus(report.status);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                상태 변경
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 상세 패널 */}
      {selected && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50">
        <div className="w-[420px] h-full bg-white shadow-xl p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">신고 상세 정보</h2>
            <button onClick={() => setSelected(null)}>✕</button>
          </div>

          {/* 신고 대상자 정보 */}
          <div className="mb-4">
            <label className="text-sm font-semibold block mb-2">
              신고당한 유저
            </label>
            <div className="bg-gray-100 rounded-md p-3 text-sm text-gray-700">
              ID: {selected.targetMemberId}
            </div>
          </div>

          {/* 신고 카테고리 */}
          <div className="mb-4">
            <label className="text-sm font-semibold block mb-2">신고 카테고리</label>
            <span
              className={`px-3 py-1 rounded text-xs font-semibold ${categoryColors[selected.category]}`}
            >
              {selected.category}
            </span>
          </div>

          {/* 신고 내용 */}
          <div className="mb-4">
            <label className="text-sm font-semibold block mb-2">신고 내용</label>
            <textarea
              readOnly
              className="w-full bg-red-50 border border-red-200 rounded-md p-2 text-sm"
              value={selected.reportedMsgContent}
            />
          </div>

          {/* 상태 변경 */}
          <div className="mb-6">
            <label className="text-sm font-semibold block mb-2">상태 변경</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
              className="w-full border rounded-md p-2"
            >
              <option value="WAITING">WAITING</option>
              <option value="REVIEWING">REVIEWING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          {/* 버튼 */}
          <div className="flex justify-between">
            <button
              onClick={() => setSelected(null)}
              className="px-4 py-2 border rounded-md"
            >
              취소
            </button>

            <button
              onClick={() =>
                statusMutation.mutate(
                  { id: selected.id, status: newStatus },
                  {
                    onSuccess: () => {
                      setSelected(null);
                    },
                  }
                )
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    )}
    </main>
    </AdminGuard>
  );
}
