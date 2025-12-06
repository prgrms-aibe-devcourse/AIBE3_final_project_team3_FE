"use client";

import { useGetAiChatRoomsQuery, useGetDirectChatRoomsQuery, useGetGroupChatRoomsQuery } from '@/global/api/useChatQuery';
import { ChatRoom, useChatStore } from "@/global/stores/useChatStore";
import { useLoginStore } from '@/global/stores/useLoginStore';
import { AIChatRoomResp, DirectChatRoomResp, GroupChatRoomResp, RoomLastMessageUpdateResp } from '@/global/types/chat.types';
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import ChatSidebar from "./_components/ChatSidebar";
import { connect, getStompClient } from "@/global/stomp/stompClient";
import type { IMessage } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";

type CachedRoomSummary = {
  id: string | number;
  lastMessageAt?: string | null;
  unreadCount?: number;
  lastMessageContent?: string | null;
  [key: string]: unknown;
};

const resolveStoreMemberId = (value: unknown): number | undefined => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const candidates = [record.memberId, record.id];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }
  }

  return undefined;
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { activeTab, setActiveTab, setSelectedRoomId, selectedRoomId } = useChatStore();
  const router = useRouter();
  const member = useLoginStore((state) => state.member);
  const currentMemberId = resolveStoreMemberId(member);
  const { accessToken } = useLoginStore();
  const queryClient = useQueryClient();

  const { data: directRoomsData } = useGetDirectChatRoomsQuery();
  const { data: groupRoomsData } = useGetGroupChatRoomsQuery();
  const { data: aiRoomsData } = useGetAiChatRoomsQuery();

  // WebSocket 구독: 채팅방 리스트 실시간 업데이트
  useEffect(() => {
    if (!member || !accessToken) return;

    let subscription: any = null;

    const setupSubscription = () => {
      const client = getStompClient();
      const destination = `/user/topic/rooms/update`;

      subscription = client.subscribe(
        destination,
        (message: IMessage) => {
          const payload: RoomLastMessageUpdateResp = JSON.parse(message.body);

          // 캐시에서 해당 방의 lastMessageAt, unreadCount, lastMessage 업데이트 (API 재조회 없이)
          const roomType = payload.chatRoomType.toLowerCase();
          const cacheKey: (string | number)[] = ['chatRooms', roomType];

          queryClient.setQueryData<CachedRoomSummary[] | undefined>(cacheKey, (prevRooms) => {
            if (!prevRooms) return prevRooms;
            return prevRooms.map((room) =>
              room.id === payload.roomId
                ? {
                    ...room,
                    lastMessageAt: payload.lastMessageAt,
                    unreadCount: payload.unreadCount,
                    lastMessageContent: payload.lastMessageContent
                  }
                : room
            );
          });
        }
      );
    };

    connect(accessToken, setupSubscription);

    return () => {
      if (subscription) {
        subscription.unsubscribe();
        subscription = null;
      }
    };
  }, [member, accessToken, queryClient]);

  const rooms = useMemo(() => {
    if (!member) {
      return { direct: [], group: [], ai: [] };
    }

    const directRooms: ChatRoom[] = (directRoomsData || []).map((room: DirectChatRoomResp) => {
      const partner = currentMemberId && room.user1.id === currentMemberId ? room.user2 : room.user1;
      return {
        id: `direct-${room.id}`,
        name: partner.nickname,
        // TODO: Backend should provide profileImageUrl in the DirectChatRoomResp > ChatRoomMember type.
        avatar: (partner as any).profileImageUrl,
        type: 'direct',
        unreadCount: room.unreadCount,
        lastMessage: room.lastMessageContent || '채팅을 시작해보세요.',
        lastMessageTime: room.lastMessageAt ?? '',
      };
    });

    const groupRooms: ChatRoom[] = (groupRoomsData || []).map((room: GroupChatRoomResp) => {
      return {
        id: `group-${room.id}`,
        name: room.name,
        avatar: '/img/group-chat-fallback.png',
        type: 'group',
        unreadCount: room.unreadCount,
        lastMessage: room.lastMessageContent || '그룹 채팅방입니다.',
        lastMessageTime: room.lastMessageAt ?? '',
      };
    });

    const aiRooms: ChatRoom[] = (aiRoomsData || []).map((room: AIChatRoomResp) => {
      return {
        id: `ai-${room.id}`,
        name: room.name,
        // TODO: Backend should provide a representative image URL for AI chats.
        avatar: "🤖",
        type: 'ai',
        unreadCount: 0,
        lastMessage: 'AI 튜터와 대화해보세요.',
        lastMessageTime: '',
      };
    });

    // sort by last message time descending; rooms without timestamp go last
    const sortByLastMessage = (list: ChatRoom[]) =>
      [...list].sort((a, b) => {
        const ta = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const tb = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return tb - ta;
      });

    return {
      direct: sortByLastMessage(directRooms),
      group: sortByLastMessage(groupRooms),
      ai: sortByLastMessage(aiRooms),
    };
  }, [directRoomsData, groupRoomsData, aiRoomsData, member, currentMemberId]);

  const handleSetSelectedRoom = (roomId: string | null) => {
    setSelectedRoomId(roomId);
    if (roomId) {
      const [type, actualId] = roomId.split('-');
      router.push(`/chat/${type}/${actualId}`);
    } else {
      router.push('/chat');
    }
  };

  const handleSetActiveTab = (tab: "direct" | "group" | "ai") => {
    setActiveTab(tab);
    setSelectedRoomId(null);
    router.push('/chat');
  };

  return (
    <div className="h-[calc(100vh-4rem)] w-full lg:w-3/5 lg:mx-auto">
      <div className="flex h-full bg-gray-900 text-white rounded-xl shadow-2xl overflow-hidden">
        <ChatSidebar
          activeTab={activeTab}
          setActiveTab={handleSetActiveTab}
          rooms={rooms[activeTab]}
          selectedRoomId={selectedRoomId}
          setSelectedRoomId={handleSetSelectedRoom}
        />
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}
