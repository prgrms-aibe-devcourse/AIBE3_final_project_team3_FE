import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/global/backend/client";
import { unwrap } from "@/global/backend/unwrap";
import { useLoginStore } from "../stores/useLoginStore";
import { CustomResponse, MessageResp } from "../types/chat.types";
import { ChatRoomResp } from "@/global/types/chat.types";
import { useRouter } from "next/navigation";

const fetchChatMessages = async (roomId: number): Promise<MessageResp[]> => {
    if (!roomId) return [];
    
    const response = await apiClient.GET("/api/v1/chats/rooms/{roomId}/messages", {
        params: {
            path: { roomId },
        },
    });

    const unwrappedResponse = await unwrap<CustomResponse<MessageResp[]>>(response);

    return unwrappedResponse.data || [];
};

export const useChatMessagesQuery = (roomId: number) => {
    const { accessToken } = useLoginStore();

    return useQuery<MessageResp[], Error>({
        queryKey: ["chatMessages", roomId],
        queryFn: () => fetchChatMessages(roomId),
        enabled: !!accessToken && !!roomId,
        staleTime: 1000 * 60, // 1 minute
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