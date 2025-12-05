"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getStompClient } from "@/global/stomp/stompClient";

export default function useRoomClosedRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const client = getStompClient();
    if (!client || !client.connected) return;

    const subscription = client.subscribe("/topic/room-events", (msg) => {
      const body = JSON.parse(msg.body);

      if (body.type !== "ROOM_CLOSED") return;

      const closedRoomId = body.roomId;
      const roomName = body.roomName;
      const reason = body.reasonLabel;

      // 현재 보고 있는 방이면 강제퇴출
      if (pathname === `/chat/group/${closedRoomId}`) {
        alert(`'${roomName}' 채팅방이 폐쇄되었습니다.\n사유: ${reason}`);
        window.location.reload();
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);
}