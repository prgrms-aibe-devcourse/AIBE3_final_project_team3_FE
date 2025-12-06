import apiClient from "@/global/backend/client";
import { unwrap } from "@/global/backend/unwrap";
import { API_BASE_URL } from "../consts";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useLoginStore } from "../stores/useLoginStore";
import {
  AIChatRoomResp,
  AiFeedbackReq,
  AiFeedbackResp,
  ChatRoomPageDataResp,
  ChatRoomResp,
  CreateAIChatReq,
  CreateGroupChatReq,
  DirectChatRoomResp,
  GroupChatRoomResp,
  MessageResp,
} from "../types/chat.types";

// --- Type Definitions ---
// Types are now imported from chat.types.ts

// --- Fetch Functions ---

const fetchChatMessages = async (
  roomId: number,
  chatRoomType: string,
  cursor?: number,
  size?: number
): Promise<ChatRoomPageDataResp> => {
  if (!roomId || !chatRoomType) {
    return {
      chatRoomType: "DIRECT",
      messages: [],
      nextCursor: null,
      hasMore: false
    };
  }

  const queryParams: any = {
    chatRoomType: chatRoomType.toUpperCase() as "DIRECT" | "GROUP" | "AI"
  };

  if (cursor !== undefined) {
    queryParams.cursor = cursor;
  }

  if (size !== undefined) {
    queryParams.size = size;
  }

  const response = await apiClient.GET("/api/v1/chats/rooms/{roomId}/messages", {
    params: {
      path: { roomId },
      query: queryParams,
    },
  });

  const chatData = await unwrap<ChatRoomPageDataResp>(response);

  console.log('[API] fetchChatMessages response:', {
    cursor,
    hasData: !!chatData,
    messageCount: chatData?.messages?.length,
    nextCursor: chatData?.nextCursor,
    hasMore: chatData?.hasMore
  });

  return chatData || {
    chatRoomType: "DIRECT",
    messages: [],
    nextCursor: null,
    hasMore: false
  };
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
  chatRoomType: string,
  pageSize: number = 25
) => {
  const { accessToken } = useLoginStore();

  return useInfiniteQuery<ChatRoomPageDataResp, Error>({
    queryKey: ["chatMessages", roomId, chatRoomType],
    queryFn: ({ pageParam }) =>
      fetchChatMessages(roomId, chatRoomType, pageParam as number | undefined, pageSize),
    enabled: !!accessToken && !!roomId && !!chatRoomType,
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      // Return the nextCursor if there are more messages, otherwise undefined
      if (!lastPage) {
        return undefined;
      }
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
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

const createAiChat = async (variables: CreateAIChatReq): Promise<AIChatRoomResp> => {
  const response = await apiClient.POST("/api/v1/chats/rooms/ai", {
    body: variables,
  });

  const unwrappedResponse = await unwrap<AIChatRoomResp>(response);

  if (!unwrappedResponse) {
    throw new Error("Failed to create AI chat room: No data received.");
  }

  return unwrappedResponse;
};

export const useCreateAiChat = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<AIChatRoomResp, Error, CreateAIChatReq>({
    mutationFn: createAiChat,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["chatRooms", "ai"] });

      if (data && data.id) {
        router.push(`/chat/ai/${data.id}`);
      }
    },
    onError: (error) => {
      console.error("Failed to create AI chat room:", error);
      alert(`AI 채팅방을 만드는 데 실패했습니다: ${error.message}`);
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

// --- File Upload Mutation ---

interface UploadFileVariables {
  roomId: number;
  chatRoomType: string;
  file: File;
  messageType: 'IMAGE' | 'FILE';
}

const uploadFile = async (variables: UploadFileVariables): Promise<MessageResp> => {
  const formData = new FormData();
  formData.append('file', variables.file);
  const { accessToken } = useLoginStore.getState();

  const url = new URL(`${API_BASE_URL}/api/v1/chats/rooms/${variables.roomId}/files`);
  url.searchParams.append('chatRoomType', variables.chatRoomType.toUpperCase());
  url.searchParams.append('messageType', variables.messageType);

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // Content-Type header must be omitted for FormData to set boundary correctly
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.msg || 'File upload failed');
  }

  const jsonResponse = await response.json();
  return jsonResponse.data;
};

export const useUploadFileMutation = () => {
  return useMutation<MessageResp, Error, UploadFileVariables>({
    mutationFn: uploadFile,
    onSuccess: (data) => {
      console.log('File uploaded successfully, message sent via WebSocket:', data);
    },
    onError: (error) => {
      console.error("Failed to upload file:", error);
      alert(`파일 업로드에 실패했습니다: ${error.message}`);
    },
  });
};

// --- Member Management Mutations ---

interface KickMemberVariables {
  roomId: number;
  memberId: number;
}

const kickMember = async ({ roomId, memberId }: KickMemberVariables): Promise<void> => {
  const response = await apiClient.DELETE("/api/v1/chats/rooms/{roomId}/members/{memberId}", {
    params: {
      path: { roomId, memberId },
    },
  });
  await unwrap(response);
};

export const useKickMemberMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, KickMemberVariables>({
    mutationFn: kickMember,
    onSuccess: (_, variables) => {
      // Invalidate queries related to group chat rooms to refetch member lists
      queryClient.invalidateQueries({ queryKey: ["chatRooms", "group"] });
      // Optionally, you can also invalidate the specific room's messages if needed
      // queryClient.invalidateQueries({ queryKey: ["chatMessages", variables.roomId] });
      alert("멤버를 강퇴했습니다.");
    },
    onError: (error) => {
      console.error("Failed to kick member:", error);
      alert(`멤버 강퇴에 실패했습니다: ${error.message}`);
    },
  });
};

interface TransferOwnershipVariables {
  roomId: number;
  newOwnerId: number;
}

const transferOwnership = async ({ roomId, newOwnerId }: TransferOwnershipVariables): Promise<void> => {
  const response = await apiClient.PATCH("/api/v1/chats/rooms/{roomId}/owner", {
    params: {
      path: { roomId },
    },
    body: { newOwnerId },
  });
  await unwrap(response);
};

export const useTransferOwnershipMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, TransferOwnershipVariables>({
    mutationFn: transferOwnership,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatRooms", "group"] });
      alert("방장을 위임했습니다.");
    },
    onError: (error) => {
      console.error("Failed to transfer ownership:", error);
      alert(`방장 위임에 실패했습니다: ${error.message}`);
    },
  });
};

// --- AI Feedback Mutation ---

const fetchAiFeedback = async (req: AiFeedbackReq): Promise<AiFeedbackResp> => {
  const response = await apiClient.POST("/api/v1/chats/feedback", {
    body: req,
  });
  const feedback = await unwrap<AiFeedbackResp>(response);
  if (!feedback) {
    throw new Error("Failed to analyze feedback: No data received.");
  }
  return feedback;
};

export const useAiFeedbackMutation = () => {
  return useMutation<AiFeedbackResp, Error, AiFeedbackReq>({
    mutationFn: fetchAiFeedback,
    onError: (error) => {
      console.error("AI Analysis failed:", error);
      alert(`AI 분석에 실패했습니다: ${error.message}`);
    },
  });
};
