"use client";

import { useState } from "react";
import {
  useReportQuery,
  useReportStatusMutation,
} from "@/global/api/useAdminReportQuery";
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
    <main className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">신고 관리</h1>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">

        {/* Header */}
        <div className="p-4 bg-gray-50 border-b text-lg font-bold">신고 목록</div>

        {/* 로딩 */}
        {isLoading && (
          <div className="p-10 text-center text-gray-500">로딩 중입니다...</div>
        )}

        {/* 데이터 없음 */}
        {!isLoading && list.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            신고 내역이 없습니다.
          </div>
        )}

        {/* 테이블 */}
        {!isLoading && list.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">상태</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">카테고리</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">신고 내용</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">신고일</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">작업</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {list.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
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

                    <td className="px-4 py-3 text-sm max-w-xs truncate">
                      {report.reportedMsgContent}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {report.createdAt?.slice(0, 10)}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelected(report);
                          setNewStatus(report.status);
                        }}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
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

        {/* 🔥 숫자 페이지네이션 */}
        <div className="flex justify-center gap-2 p-4">
          {pageNumbers.map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1 rounded text-sm ${
                p === currentPage
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {p + 1}
            </button>
          ))}
        </div>
      </div>

      {/* ===== 우측 상세 패널 ===== */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50">
          <div className="w-[420px] h-full bg-white shadow-xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">신고 상세 정보</h2>
              <button onClick={() => setSelected(null)}>✕</button>
            </div>

            {/* 신고 당한 유저 */}
            <div className="mb-4">
              <label className="text-sm font-semibold block mb-2">신고당한 유저</label>
              <div className="bg-gray-100 rounded-md p-3 text-sm">
                ID: {selected.targetMemberId}
              </div>
            </div>

            {/* 카테고리 */}
            <div className="mb-4">
              <label className="text-sm font-semibold block mb-2">
                신고 카테고리
              </label>
              <span
                className={`px-3 py-1 rounded text-xs font-semibold ${categoryColors[selected.category]}`}
              >
                {selected.category}
              </span>
            </div>

            {/* 내용 */}
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
                    { onSuccess: () => setSelected(null) }
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
