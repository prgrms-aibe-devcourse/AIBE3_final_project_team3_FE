import { useQuery } from "@tanstack/react-query";
import { useLoginStore } from "@/global/stores/useLoginStore";
import apiClient from "@/global/backend/client";
import { MemberSummaryResp } from "@/global/types/member.types";

const fetchAllMembers = async (): Promise<MemberSummaryResp[]> => {
    const { data, error } = await apiClient.GET("/api/v1/find/members");

    if (error) {
        throw new Error(JSON.stringify(error));
    }
    
    return data || [];
};

export const useMembersQuery = () => {
    const { accessToken } = useLoginStore();

    return useQuery<MemberSummaryResp[], Error>({
        queryKey: ["members"],
        queryFn: fetchAllMembers,
        enabled: !!accessToken, // Only run the query if the user is logged in
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
    });
};
