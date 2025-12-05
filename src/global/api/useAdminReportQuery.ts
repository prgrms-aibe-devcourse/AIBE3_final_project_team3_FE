import apiClient from "@/global/backend/client";
import { unwrap } from "@/global/backend/unwrap";
import type { AdminReport, ReportStatus } from "@/global/types/report.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/global/consts";
import { useLoginStore } from "@/global/stores/useLoginStore";

type PageQueryOptions = {
  page?: number;
  size?: number;
};

type AdminReportListResponse = {
  content: AdminReport[];
  totalPages: number;
  number: number;
};

// =======================
// GET 신고 목록
// =======================
export const fetchReportList = async (options?: PageQueryOptions) => {
  const { accessToken } = useLoginStore.getState();

  const page = typeof options?.page === "number" ? Math.max(options.page, 0) : 0;
  const size = typeof options?.size === "number" ? Math.max(options.size, 1) : 20;

  const url = new URL("/api/v1/admin/reports", API_BASE_URL);
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", String(size));

  const response = await fetch(url.toString(), {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`신고 목록 조회 실패: ${response.status}`);
  }

  const json = (await response.json()) as { data?: AdminReportListResponse };
  const data = json.data ?? {
    content: [],
    totalPages: 0,
    number: page,
  };

  return data; 
};

export const useReportQuery = (page: number, size: number = 20) =>
  useQuery({
    queryKey: ["reportList", page, size],
    queryFn: () => fetchReportList({ page, size }),
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
        predicate: (q) => q.queryKey[0] === "reportList",
      });
    },
  });
};
