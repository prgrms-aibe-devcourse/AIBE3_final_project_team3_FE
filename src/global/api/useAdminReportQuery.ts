import apiClient from "@/global/backend/client";
import { unwrap } from "@/global/backend/unwrap";
import type { AdminReport, ReportStatus } from "@/global/types/report.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type AdminReportListResponse = {
  content: AdminReport[];
  totalPages: number;
  number: number;
};

// =======================
// GET 신고 목록
// =======================
export const fetchReportList = async (page: number) => {
  const res = await apiClient.GET("/api/v1/admin/reports", {
    params: {
      query: {
        page,
        size: 20,
      }
    },
  });

  return unwrap<AdminReportListResponse>(res); // Page<AdminReport>
};

export const useReportQuery = (page: number) =>
  useQuery({
    queryKey: ["reportList", page],
    queryFn: () => fetchReportList(page),
  });
// =======================
// PATCH 상태 변경
// =======================
export const patchReportStatus = async (reportId: number, status: ReportStatus) => {
  const resp = await apiClient.PATCH("/api/v1/admin/reports/{reportId}", {
    params: { path: { reportId } },
    body: { status },
  });

  await unwrap<void>(resp);
  return true;
};

// =======================
// 상태 변경 Mutation 훅
// =======================
export const useReportStatusMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: ReportStatus }) =>
      patchReportStatus(id, status),

    onSuccess: () => {
      qc.invalidateQueries({
        predicate: (q) => q.queryKey[0] === "reportList"
      });
    },
  });
};