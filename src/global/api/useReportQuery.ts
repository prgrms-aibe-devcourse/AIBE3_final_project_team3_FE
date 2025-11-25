import { useQuery } from "@tanstack/react-query";
import client from "@/global/backend/client";
import { unwrap } from "@/global/backend/unwrap";
import type { AdminReport } from "@/global/types/report.types";

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

  export const patchReportStatus = async (reportId: number, status: ReportStatus) => {
  const resp = await client.PATCH(`/api/v1/admin/reports/${reportId}`, {
    body: { status },
  });

  await unwrap<void>(resp);
  return true;
};