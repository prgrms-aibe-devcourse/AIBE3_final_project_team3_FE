// /global/api/useAdminChatRoom.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../backend/client";

export function closeRoom(roomId: number, reasonCode: number) {
  return apiClient.DELETE("/api/v1/admin/chat-rooms/{roomId}", {
    params: {
      path: { roomId },
      query: { reasonCode },
    },
  });
}

export function useCloseRoomMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ roomId, reasonCode }: { roomId: number; reasonCode: number }) =>
      closeRoom(roomId, reasonCode),

    onSuccess() {
      qc.invalidateQueries({ queryKey: ["publicGroupChatRooms"] });
    },
  });
}
