import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLoginStore } from "@/global/stores/useLoginStore";
import apiClient from "@/global/backend/client";
import { CustomResponse, MemberSummaryResp } from "@/global/types/auth.types"; // CustomResponse 임포트 추가
import { ChatRoomResp } from "@/global/types/chat.types";
import { unwrap } from "@/global/backend/unwrap"; // unwrap 임포트 추가
import { useRouter } from "next/navigation";

const fetchAllMembers = async (): Promise<MemberSummaryResp[]> => {
    const response = await apiClient.GET("/api/v1/members");

    const unwrappedResponse = await unwrap<CustomResponse<MemberSummaryResp[]>>(response);
    console.log("fetchAllMembers: unwrappedResponse:", unwrappedResponse); // 로그 추가
    console.log("fetchAllMembers: unwrappedResponse.data:", unwrappedResponse.data); // 로그 추가
    
    return unwrappedResponse || [];
};

export const useMembersQuery = () => {
    const { accessToken } = useLoginStore();

    return useQuery<MemberSummaryResp[], Error>({
        queryKey: ["members"],
        queryFn: fetchAllMembers,
        enabled: !!accessToken,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });
};

// --- New Mutation Hook ---

interface CreateDirectChatVariables {
  partnerId: number;
}

const createDirectChat = async (variables: CreateDirectChatVariables): Promise<ChatRoomResp> => {
      const response = await apiClient.POST("/api/v1/chats/rooms/direct", {
        body: variables,
      });

      const unwrappedResponse = await unwrap<ChatRoomResp>(response);
      
      if (!unwrappedResponse) { // unwrappedResponse 자체가 데이터이므로, 이것이 null/undefined인지 확인
        throw new Error("Failed to create chat room: No data received.");
      }
      return unwrappedResponse; // unwrappedResponse 자체를 반환
    };

export const useCreateDirectChat = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<ChatRoomResp, Error, CreateDirectChatVariables>({
    mutationFn: createDirectChat,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
      
      if (data && data.id) {
        router.push(`/chat/${data.id}`);
      }
    },
    onError: (error) => {
      console.error("Failed to create chat room:", error);
      alert(`채팅방을 만드는 데 실패했습니다: ${error.message}`);
    },
  });
};

// --- New Query Hook for fetching current user's profile ---

const fetchMyProfile = async (): Promise<MemberSummaryResp> => {
    const response = await apiClient.GET("/api/v1/members/me");

    const unwrappedResponse = await unwrap<MemberSummaryResp>(response); // unwrappedResponse는 MemberSummaryResp 객체
    
    if (!unwrappedResponse) { // unwrappedResponse 자체가 데이터이므로, 이것이 null/undefined인지 확인
        throw new Error("Failed to get member profile from API response.");
    }
    return unwrappedResponse; // unwrappedResponse 자체를 반환
};

export const useMyProfileQuery = (options: { enabled: boolean }) => {
    const { accessToken } = useLoginStore();

    return useQuery<MemberSummaryResp, Error>({
        queryKey: ["myProfile"],
        queryFn: fetchMyProfile,
        enabled: options.enabled && !!accessToken,
        staleTime: Infinity, // Profile data is unlikely to change during a session
        refetchOnWindowFocus: false,
    });
};
