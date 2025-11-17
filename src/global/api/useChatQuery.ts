import { useQuery } from "@tanstack/react-query";
import apiClient from "@/global/backend/client";
import { components } from "@/global/backend/schema"; // CustomResponse 임포트 추가
import { unwrap } from "../backend/unwrap"; // unwrap 임포트 추가
import { useLoginStore } from "../stores/useLoginStore";
import { MessageResp, CustomResponse, } from "../types/auth.types"; // MessageResp 임포트

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
