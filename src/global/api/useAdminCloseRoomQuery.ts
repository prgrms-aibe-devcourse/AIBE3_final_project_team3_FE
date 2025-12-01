// /global/api/useAdminChatRoom.ts
import apiClient from "../backend/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function closeRoom(roomId: number, reasonCode: number) {
  return apiClient.DELETE(
    `/api/v1/admin/chat-rooms/${roomId}?reasonCode=${reasonCode}`
  );
}

export function useCloseRoomMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ roomId, reasonCode }: { roomId: number; reasonCode: number }) =>
      closeRoom(roomId, reasonCode),

    onSuccess() {
      qc.invalidateQueries(["publicGroupChatRooms"]);
    },
  });
}
