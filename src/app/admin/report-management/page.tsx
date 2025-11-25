"use client";

import { useState } from "react";
import { useReportQuery } from "@/global/api/useReportQuery";
import type { AdminReport, ReportStatus } from "@/global/types/report.types";

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

  const [selected, setSelected] = useState<AdminReport | null>(null);
  const [newStatus, setNewStatus] = useState<ReportStatus>("WAITING");


  return (
    <main className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">신고 관리</h1>

      <div className="grid gap-4">
        {reports?.length === 0 && (
          <div className="p-6 bg-white border rounded-lg text-gray-500">
            신고 데이터가 없습니다.
          </div>
        )}

        {reports?.map((report) => (
          <div
            key={report.id}
            className="bg-white border rounded-lg p-4 shadow-sm"
          >
            <div className="flex justify-between">
              <div>
                <div className="flex gap-2 mb-2">
                  <span className="text-sm font-semibold">
                    ID: {report.id}
                  </span>

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
    </main>
  );
}
