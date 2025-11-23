import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/global/backend/client";
import { unwrap } from "@/global/backend/unwrap";
import { useLoginStore } from "../stores/useLoginStore";
import { ChatRoomDataResp, DirectChatRoomResp, GroupChatRoomResp, AIChatRoomResp, CreateGroupChatReq } from "../types/chat.types";
import { ChatRoomResp } from "@/global/types/chat.types";
import { useRouter } from "next/navigation";

// --- Type Definitions ---
// Types are now imported from chat.types.ts

// --- Fetch Functions ---

const fetchChatMessages = async (
  roomId: number,
  conversationType: string
): Promise<ChatRoomDataResp> => {
  if (!roomId || !conversationType) {
    return { conversationType: "DIRECT", messages: [] };
  }

  const response = await apiClient.GET("/api/v1/chats/rooms/{roomId}/messages", {
    params: {
      path: { roomId },
      query: { conversationType: conversationType.toUpperCase() as "DIRECT" | "GROUP" | "AI" },
    },
  });

  // Correctly use unwrap to get the data payload
  const chatData = await unwrap<ChatRoomDataResp>(response);

  return chatData || { conversationType: "DIRECT", messages: [] };
};

const fetchDirectChatRooms = async (): Promise<DirectChatRoomResp[]> => {
  const response = await apiClient.GET("/api/v1/chats/rooms/direct");
  const rooms = await unwrap<DirectChatRoomResp[]>(response);
  return rooms || [];
};

const fetchGroupChatRooms = async (): Promise<GroupChatRoomResp[]> => {
  const response = await apiClient.GET("/api/v1/chats/rooms/group");
  const rooms = await unwrap<GroupChatRoomResp[]>(response);
  return rooms || [];
};

const fetchAiChatRooms = async (): Promise<AIChatRoomResp[]> => {
  const response = await apiClient.GET("/api/v1/chats/rooms/ai");
  const rooms = await unwrap<AIChatRoomResp[]>(response);
  return rooms || [];
};

const fetchPublicGroupChatRooms = async (): Promise<GroupChatRoomResp[]> => {
  const response = await apiClient.GET("/api/v1/chats/rooms/group/public");
  const rooms = await unwrap<GroupChatRoomResp[]>(response);
  return rooms || [];
};

// --- Query Hooks ---

export const useChatMessagesQuery = (
  roomId: number,
  conversationType: string
) => {
  const { accessToken } = useLoginStore();

  return useQuery<ChatRoomDataResp, Error>({
    queryKey: ["chatMessages", roomId, conversationType],
    queryFn: () => fetchChatMessages(roomId, conversationType),
    enabled: !!accessToken && !!roomId && !!conversationType,
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
  });
};

export const useGetDirectChatRoomsQuery = () => {
  const { accessToken } = useLoginStore();
  return useQuery<DirectChatRoomResp[], Error>({
    queryKey: ["chatRooms", "direct"],
    queryFn: fetchDirectChatRooms,
    enabled: !!accessToken,
  });
};

export const useGetGroupChatRoomsQuery = () => {
  const { accessToken } = useLoginStore();
  return useQuery<GroupChatRoomResp[], Error>({
    queryKey: ["chatRooms", "group"],
    queryFn: fetchGroupChatRooms,
    enabled: !!accessToken,
  });
};

export const useGetPublicGroupChatRoomsQuery = () => {
  const { accessToken } = useLoginStore();
  return useQuery<GroupChatRoomResp[], Error>({
    queryKey: ["chatRooms", "group", "public"],
    queryFn: fetchPublicGroupChatRooms,
    enabled: !!accessToken,
  });
};

export const useGetAiChatRoomsQuery = () => {
  const { accessToken } = useLoginStore();
  return useQuery<AIChatRoomResp[], Error>({
    queryKey: ["chatRooms", "ai"],
    queryFn: fetchAiChatRooms,
    enabled: !!accessToken,
  });
};


// --- Mutation Hooks ---

interface CreateDirectChatVariables {
  partnerId: number;
}

const createDirectChat = async (variables: CreateDirectChatVariables): Promise<ChatRoomResp> => {
  const response = await apiClient.POST("/api/v1/chats/rooms/direct", {
    body: variables,
  });

  // This usage of unwrap seems different, assuming the response body is the data itself
  const unwrappedResponse = await unwrap<ChatRoomResp>(response);
  
  if (!unwrappedResponse) {
    throw new Error("Failed to create chat room: No data received.");
  }
  return unwrappedResponse;
};

export const useCreateDirectChat = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<ChatRoomResp, Error, CreateDirectChatVariables>({
    mutationFn: createDirectChat,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
      
      if (data && data.id) {
        router.push(`/chat/direct/${data.id}`);
      }
    },
    onError: (error) => {
      console.error("Failed to create chat room:", error);
      alert(`채팅방을 만드는 데 실패했습니다: ${error.message}`);
    },
  });
};

const createGroupChat = async (variables: CreateGroupChatReq): Promise<GroupChatRoomResp> => {
  const response = await apiClient.POST("/api/v1/chats/rooms/group", {
    body: variables,
  });

  const unwrappedResponse = await unwrap<GroupChatRoomResp>(response);
  
  if (!unwrappedResponse) {
    throw new Error("Failed to create group chat room: No data received.");
  }
  return unwrappedResponse;
};

export const useCreateGroupChat = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<GroupChatRoomResp, Error, CreateGroupChatReq>({
    mutationFn: createGroupChat,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chatRooms", "group"] }); // Invalidate group chat rooms
      
      if (data && data.id) {
        router.push(`/chat/group/${data.id}`); // Navigate to the new group chat
      }
    },
    onError: (error) => {
      console.error("Failed to create group chat room:", error);
      alert(`그룹 채팅방을 만드는 데 실패했습니다: ${error.message}`);
    },
  });
};
