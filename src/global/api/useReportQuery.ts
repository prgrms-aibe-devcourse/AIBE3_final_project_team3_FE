import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "@/global/backend/client";
import { unwrap } from "@/global/backend/unwrap";
import type { AdminReport, ReportStatus } from "@/global/types/report.types";

// =======================
// GET 신고 목록
// =======================
const fetchReports = async (): Promise<AdminReport[]> => {
  const resp = await client.GET("/api/v1/admin/reports", {});
  const payload = await unwrap<any>(resp);

  return payload?.content ?? [];
};

export const useReportQuery = () =>
  useQuery({
    queryKey: ["adminReports"],
    queryFn: fetchReports,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev ?? [],
  });

// =======================
// PATCH 상태 변경
// =======================
export const patchReportStatus = async (reportId: number, status: ReportStatus) => {
  const resp = await client.PATCH(`/api/v1/admin/reports/${reportId}`, {
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
      qc.invalidateQueries({ queryKey: ["adminReports"] });
    },
  });
};
