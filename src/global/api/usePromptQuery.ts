import apiClient from "@/global/backend/client";
import { unwrap } from "@/global/backend/unwrap";
import { useLoginStore } from "@/global/stores/useLoginStore";
import { PromptListItem } from "@/global/types/prompt.types";
import { useQuery } from "@tanstack/react-query";

const fetchPromptList = async (): Promise<PromptListItem[]> => {
  const response = await apiClient.GET("/api/v1/prompt");
  const promptList = await unwrap<PromptListItem[] | null | undefined>(response);
  if (!Array.isArray(promptList)) {
    return [];
  }
  return promptList;
};

export const usePromptListQuery = () => {
  const { accessToken } = useLoginStore();

  return useQuery<PromptListItem[], Error>({
    queryKey: ["prompt", "list"],
    queryFn: fetchPromptList,
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
  });
};
