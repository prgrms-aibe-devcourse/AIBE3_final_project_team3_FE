import apiClient from "@/global/backend/client";
import { useMutation } from "@tanstack/react-query";
import { ReportCategory } from "@/global/types/report.types";

export interface CreateReportRequest {
  targetMemberId: number;
  category: ReportCategory;
  reportedMsgContent?: string;
  reportedReason?: string;
}

const createReport = async (request: CreateReportRequest) => {
  const { data, error } = await apiClient.POST("/api/v1/reports", {
    body: request as never,
  });

  if (error) {
    throw new Error("신고를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  return data;
};

export const useCreateReport = () => {
  return useMutation({
    mutationFn: createReport,
  });
};
