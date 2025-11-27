import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/global/backend/client";
import { unwrap } from "@/global/backend/unwrap";
import { useLoginStore } from "../stores/useLoginStore";
import { ChatRoomDataResp, DirectChatRoomResp, GroupChatRoomResp, AIChatRoomResp, CreateGroupChatReq, JoinGroupChatReq } from "../types/chat.types";
import { ChatRoomResp } from "@/global/types/chat.types";
import { useRouter } from "next/navigation";

// --- Type Definitions ---
// Types are now imported from chat.types.ts

// --- Fetch Functions ---

const fetchChatMessages = async (
  roomId: number,
  chatRoomType: string
): Promise<ChatRoomDataResp> => {
  if (!roomId || !chatRoomType) {
    return { chatRoomType: "DIRECT", messages: [] };
  }

  const response = await apiClient.GET("/api/v1/chats/rooms/{roomId}/messages", {
    params: {
      path: { roomId },
      query: { chatRoomType: chatRoomType.toUpperCase() as "DIRECT" | "GROUP" | "AI" },
    },
  });

  // Correctly use unwrap to get the data payload
  const chatData = await unwrap<ChatRoomDataResp>(response);

  return chatData || { chatRoomType: "DIRECT", messages: [] };
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
  chatRoomType: string
) => {
  const { accessToken } = useLoginStore();

  return useQuery<ChatRoomDataResp, Error>({
    queryKey: ["chatMessages", roomId, chatRoomType],
    queryFn: () => fetchChatMessages(roomId, chatRoomType),
    enabled: !!accessToken && !!roomId && !!chatRoomType,
    staleTime: 0, // Always fetch fresh data when entering a chat room
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Always refetch when component mounts
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
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["chatRooms", "direct"] });

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
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["chatRooms", "group"] });

      if (data && data.id) {
        router.push(`/chat/group/${data.id}`);
      }
    },
    onError: (error) => {
      console.error("Failed to create group chat room:", error);
      alert(`그룹 채팅방을 만드는 데 실패했습니다: ${error.message}`);
    },
  });
};

interface JoinGroupChatVariables {
  roomId: number;
  password?: string;
}

const joinGroupChat = async (variables: JoinGroupChatVariables): Promise<GroupChatRoomResp> => {
  // 비밀번호가 있고 공백이 아닌 경우에만 전송
  const trimmedPassword = variables.password?.trim();

  const response = await apiClient.POST("/api/v1/chats/rooms/group/{roomId}/join", {
    params: {
      path: { roomId: variables.roomId },
    },
    body: trimmedPassword ? { password: trimmedPassword } : undefined,
  });

  const unwrappedResponse = await unwrap<GroupChatRoomResp>(response);

  if (!unwrappedResponse) {
    throw new Error("Failed to join group chat room: No data received.");
  }
  return unwrappedResponse;
};

export const useJoinGroupChat = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<GroupChatRoomResp, Error, JoinGroupChatVariables>({
    mutationFn: joinGroupChat,
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["chatRooms", "group"] }),
        queryClient.invalidateQueries({ queryKey: ["chatRooms", "group", "public"] })
      ]);

      if (data && data.id) {
        router.push(`/chat/group/${data.id}`);
      }
    },
    onError: (error) => {
      console.error("Failed to join group chat room:", error);
      alert(`그룹 채팅방 참가에 실패했습니다: ${error.message}`);
    },
  });
};

interface LeaveChatRoomVariables {
  roomId: number;
  chatRoomType: string;
}

const leaveChatRoom = async ({ roomId, chatRoomType }: LeaveChatRoomVariables): Promise<void> => {
  const response = await apiClient.DELETE("/api/v1/chats/rooms/{roomId}", {
    params: {
      path: { roomId },
      query: { chatRoomType: chatRoomType.toUpperCase() as "DIRECT" | "GROUP" | "AI" },
    },
  });

  await unwrap(response);
};

export const useLeaveChatRoom = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<void, Error, LeaveChatRoomVariables>({
    mutationFn: leaveChatRoom,
    onSuccess: (_, variables) => {
      // Invalidate the specific chat room type query
      queryClient.invalidateQueries({ queryKey: ["chatRooms", variables.chatRoomType.toLowerCase()] });
      // Also invalidate general chatRooms queries if needed
      queryClient.invalidateQueries({ queryKey: ["chatRooms"] });

      alert("채팅방을 나갔습니다.");
      router.push("/chat/user"); // Redirect to the user's chat list
    },
    onError: (error) => {
      console.error("Failed to leave chat room:", error);
      alert(`채팅방을 나가는 데 실패했습니다: ${error.message}`);
    },
  });
};
