"use client";

import { useGetAiChatRoomsQuery, useGetDirectChatRoomsQuery, useGetGroupChatRoomsQuery } from '@/global/api/useChatQuery';
import { connect, getStompClient } from "@/global/stomp/stompClient";
import { ChatRoom, useChatStore } from "@/global/stores/useChatStore";
import { useLoginStore } from '@/global/stores/useLoginStore';
import { AIChatRoomResp, DirectChatRoomResp, GroupChatRoomSummaryResp, RoomLastMessageUpdateResp } from '@/global/types/chat.types';
import type { IMessage } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import ChatSidebar from "./_components/ChatSidebar";

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
  const { accessToken, hasHydrated } = useLoginStore();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const roomSubscriptionsRef = useRef<Map<string, any>>(new Map());

  // 인증 체크: Hydration 완료 후 토큰이 없으면 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (hasHydrated && !accessToken) {
      router.replace("/auth/login");
    }
  }, [accessToken, hasHydrated, router]);

  useEffect(() => {
    const parts = pathname.split('/');
    // pathname format: /chat/[type]/[id] or /chat
    // parts: ["", "chat", "type", "id", ...]

    const type = parts[2] as 'direct' | 'group' | 'ai' | undefined;
    const id = parts[3];

    if (type && ['direct', 'group', 'ai'].includes(type)) {
      setActiveTab(type);
      if (id) {
        setSelectedRoomId(`${type}-${id}`);
      }
    }
  }, [pathname, setActiveTab, setSelectedRoomId]);

  const { data: directRoomsData } = useGetDirectChatRoomsQuery();
  const { data: groupRoomsData } = useGetGroupChatRoomsQuery();
  const { data: aiRoomsData } = useGetAiChatRoomsQuery();

  // 모든 채팅방 구독 (백그라운드 업데이트용)
  useEffect(() => {
    if (!member || !accessToken) return;

    const allRooms = [
      ...(directRoomsData || []).map(r => ({ id: r.id, type: 'direct' })),
      ...(groupRoomsData || []).map(r => ({ id: r.id, type: 'group' })),
    ];

    console.log(`[Layout Background Subscription] Attempting to subscribe to ${allRooms.length} rooms`);

    const client = getStompClient();
    if (!client.connected) {
      console.warn('[Layout Background Subscription] Client not connected yet, waiting for connection...');

      // WebSocket 연결 후 구독 재시도
      const retryTimer = setTimeout(() => {
        const retryClient = getStompClient();
        if (retryClient.connected) {
          console.log('[Layout Background Subscription] Retry: Client now connected, subscribing...');
          // useEffect를 강제로 다시 실행하기 위해 상태 변경은 없지만,
          // 여기서 직접 구독 로직을 실행
          setupBackgroundSubscriptions(allRooms, retryClient);
        }
      }, 1000);

      return () => clearTimeout(retryTimer);
    }

    setupBackgroundSubscriptions(allRooms, client);

    // 제거된 방 구독 해제
    roomSubscriptionsRef.current.forEach((sub, key) => {
      const exists = allRooms.some(r => `${r.type}-${r.id}` === key);
      if (!exists) {
        console.log(`[Layout Background Subscription] Unsubscribing from removed room: ${key}`);
        sub.unsubscribe();
        roomSubscriptionsRef.current.delete(key);
      }
    });

    function setupBackgroundSubscriptions(rooms: { id: number; type: string }[], stompClient: any) {
      rooms.forEach(({ id, type }) => {
        const key = `${type}-${id}`;
        if (roomSubscriptionsRef.current.has(key)) {
          console.log(`[Layout Background Subscription] Already subscribed to ${key}`);
          return;
        }

        const destination = `/topic/${type}.rooms.${id}`;
        console.log(`[Layout Background Subscription] Subscribing to ${destination}`);

        const subscription = stompClient.subscribe(destination, (message: IMessage) => {
          const payload = JSON.parse(message.body);

          console.log(`[Layout Background Subscription] Received message on ${destination}:`, payload);

          // RoomLastMessageUpdateResp 처리
          if (payload.chatRoomType && payload.latestSequence) {
            const update = payload as RoomLastMessageUpdateResp;
            const roomType = update.chatRoomType.toLowerCase();
            const cacheKey = ['chatRooms', roomType];

            console.log(`[Layout Background Update] Processing RoomLastMessageUpdate for room ${update.roomId}, type=${roomType}, sequence=${update.latestSequence}`);

            queryClient.setQueryData<any[]>(cacheKey, (prevRooms) => {
              if (!prevRooms) {
                console.warn(`[Layout Background Update] No cached rooms found for ${roomType}`);
                return prevRooms;
              }

              const updated = prevRooms.map((room: any) => {
                if (room.id !== update.roomId) return room;

                let unreadCount = room.unreadCount || 0;
                if (update.senderId !== currentMemberId) {
                  const lastReadSequence = room.lastReadSequence ?? 0;
                  unreadCount = Math.max(0, update.latestSequence - lastReadSequence);
                  console.log(`[Layout Background Update] Room ${update.roomId} unreadCount: ${unreadCount} (latestSeq=${update.latestSequence}, lastReadSeq=${lastReadSequence})`);
                } else {
                  unreadCount = 0;
                  console.log(`[Layout Background Update] Room ${update.roomId} - own message, unreadCount=0`);
                }

                return {
                  ...room,
                  lastMessageAt: update.lastMessageAt,
                  lastMessageContent: update.lastMessageContent,
                  unreadCount: unreadCount
                };
              });

              const sorted = updated.sort((a: any, b: any) => {
                const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
                const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
                return timeB - timeA;
              });

              console.log(`[Layout Background Update] Updated and sorted ${roomType} rooms:`, sorted.map(r => ({ id: r.id, lastMessageAt: r.lastMessageAt, unreadCount: r.unreadCount })));
              return sorted;
            });
          }
        });

        roomSubscriptionsRef.current.set(key, subscription);
        console.log(`[Layout Background Subscription] Successfully subscribed to ${key}, total subscriptions: ${roomSubscriptionsRef.current.size}`);
      });
    }

    // Cleanup function - 절대 구독 해제하지 않음 (다음 렌더링에서 중복 체크로 처리)
    return () => {
      console.log(`[Layout Background Subscription] useEffect cleanup called - keeping subscriptions alive`);
    };

  }, [directRoomsData, groupRoomsData, member, accessToken]);

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

    // [Plan C] 최적화: Summary DTO 사용
    const groupRooms: ChatRoom[] = (groupRoomsData || []).map((room: GroupChatRoomSummaryResp) => {
      return {
        id: `group-${room.id}`,
        name: room.name,
        topic: room.topic,
        avatar: '/img/group-chat-fallback.png',
        type: 'group',
        unreadCount: room.unreadCount,
        lastMessage: room.lastMessageContent || '',
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

    // sort by last message time descending; rooms without valid timestamp go last
    const parseTime = (value?: string) => {
      if (!value) return 0;
      const t = new Date(value).getTime();
      return Number.isFinite(t) ? t : 0;
    };

    const sortByLastMessage = (list: ChatRoom[]) =>
      [...list].sort((a, b) => parseTime(b.lastMessageTime) - parseTime(a.lastMessageTime));

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

  // Hydration 중이거나 토큰이 없는 동안에는 아무것도 렌더링하지 않음
  if (!hasHydrated || !accessToken) {
    return null;
  }

  return (
    <div className="h-[calc(100vh-4rem)] w-full lg:w-3/5 lg:mx-auto">
      <div
        className="flex h-full rounded-xl shadow-2xl overflow-hidden"
        style={{
          background: "var(--surface-panel)",
          border: "1px solid var(--surface-border)",
          color: "var(--page-text)",
        }}
      >
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
