"use client";

import { useState } from "react";
import {
  useReportQuery,
  useReportStatusMutation,
} from "@/global/api/useAdminReportQuery";
import type { AdminReport, ReportStatus } from "@/global/types/report.types";
import AdminGuard from "../AdminGuard";

const statusColors: Record<ReportStatus, string> = {
  WAITING: "bg-yellow-800 text-yellow-200",
  APPROVED: "bg-green-800 text-green-200",
  REJECTED: "bg-red-800 text-red-200",
};

const categoryColors: Record<string, string> = {
  ABUSE: "bg-red-800 text-red-200",
  SCAM: "bg-orange-800 text-orange-200",
  INAPPROPRIATE: "bg-pink-800 text-pink-200",
  OTHER: "bg-gray-700 text-gray-200",
};

export default function ReportManagementPage() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useReportQuery(page);
  const statusMutation = useReportStatusMutation();

  const list = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const currentPage = data?.number ?? 0;
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i);

  const [selected, setSelected] = useState<AdminReport | null>(null);
  const [newStatus, setNewStatus] = useState<ReportStatus>("WAITING");

  return (
    <AdminGuard>
      <main className="max-w-6xl mx-auto p-8 bg-gray-900 min-h-screen text-gray-200">
        <h1 className="text-3xl font-bold mb-6 text-white">신고 관리</h1>

        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-xl">
          {/* Header */}
          <div className="p-4 bg-gray-700 border-b border-gray-600 text-lg font-bold text-gray-100">
            신고 목록
          </div>

          {/* 로딩 */}
          {isLoading && (
            <div className="p-10 text-center text-gray-400">로딩 중입니다...</div>
          )}

          {/* 데이터 없음 */}
          {!isLoading && list.length === 0 && (
            <div className="p-10 text-center text-gray-400">
              신고 내역이 없습니다.
            </div>
          )}

          {/* 테이블 */}
          {!isLoading && list.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700 border-b border-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">상태</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">카테고리</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">신고 메세지</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">신고 사유</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">신고일</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">작업</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-700">
                  {list.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm">{report.id}</td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded text-xs font-semibold ${statusColors[report.status]}`}
                        >
                          {report.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded text-xs font-semibold ${categoryColors[report.category]}`}
                        >
                          {report.category}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-sm max-w-xs truncate text-gray-300">
                        {report.reportedMsgContent ?? "내용 없음"}
                      </td>

                      <td className="px-4 py-3 text-sm max-w-xs truncate text-gray-300">
                        {report.reportedReason ?? "사유 없음"}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-400">
                        {report.createdAt?.slice(0, 10)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                       <button
                        disabled={report.status !== "WAITING"}
                        onClick={() => {
                          if (report.status !== "WAITING") return; // 안정성 체크
                          setSelected(report);
                          setNewStatus(report.status);
                        }}
                        className={`px-3 py-1 rounded text-xs ${
                          report.status === "WAITING"
                            ? "bg-blue-700 text-white hover:bg-blue-600"
                            : "bg-gray-600 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        상태 변경
                      </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 페이지네이션 */}
          <div className="flex justify-center gap-2 p-4">
            {pageNumbers.map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 rounded text-sm ${
                  p === currentPage
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {p + 1}
              </button>
            ))}
          </div>
        </div>

        {/* ===== 상세 패널 ===== */}
        {selected && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-end z-50">
            <div className="w-[420px] h-full bg-gray-800 shadow-xl p-6 overflow-y-auto border-l border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">신고 상세 정보</h2>
                <button className="text-gray-300" onClick={() => setSelected(null)}>
                  ✕
                </button>
              </div>

              {/* 신고당한 유저 */}
              <div className="mb-4">
                <label className="text-sm font-semibold block mb-2 text-gray-300">
                  신고당한 유저
                </label>
                <div className="bg-gray-700 rounded-md p-3 text-sm text-gray-200">
                  ID: {selected.targetMemberId}
                </div>
              </div>

              {/* 카테고리 */}
              <div className="mb-4">
                <label className="text-sm font-semibold block mb-2 text-gray-300">
                  신고 카테고리
                </label>
                <span
                  className={`px-3 py-1 rounded text-xs font-semibold ${categoryColors[selected.category]}`}
                >
                  {selected.category}
                </span>
              </div>

              {/* 신고 메시지 */}
              <div className="mb-4">
                <label className="text-sm font-semibold block mb-2 text-gray-300">
                  신고 메세지
                </label>
                <textarea
                  readOnly
                  className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm text-gray-200"
                  value={selected.reportedMsgContent ?? "내용 없음"}
                />
              </div>

              {/* 신고 사유 */}
              <div className="mb-4">
                <label className="text-sm font-semibold block mb-2 text-gray-300">
                  신고 사유
                </label>
                <textarea
                  readOnly
                  className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm text-gray-200"
                  value={selected.reportedReason ?? "사유 없음"}
                />
              </div>

              {/* 상태 변경 */}
              <div className="mb-6">
                <label className="text-sm font-semibold block mb-2 text-gray-300">상태 변경</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
                  className="w-full border border-gray-600 rounded-md p-2 bg-gray-700 text-gray-200"
                >
                  <option value="WAITING">WAITING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              {/* 버튼 */}
              <div className="flex justify-between">
                <button
                  onClick={() => setSelected(null)}
                  className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700"
                >
                  취소
                </button>

                <button
                  onClick={() =>
                    statusMutation.mutate(
                      { id: selected.id, status: newStatus },
                      { onSuccess: () => setSelected(null) }
                    )
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
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
