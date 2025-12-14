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
  const userQueueSubscriptionRef = useRef<any>(null);
  const activeRoomIdRef = useRef<string | null>(selectedRoomId);

  // 인증 체크: Hydration 완료 후 토큰이 없으면 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (hasHydrated && !accessToken) {
      router.replace("/auth/login");
    }
  }, [accessToken, hasHydrated, router]);

  useEffect(() => {
    activeRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  useEffect(() => {
    const parts = pathname.split('/');
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

  // 개인 큐 구독 (채팅방 리스트 업데이트용)
  useEffect(() => {
    if (!member || !accessToken) return;

    let subscription: any = null;

    function subscribeToUserQueue() {
      const client = getStompClient();
      const myId = currentMemberId ?? resolveStoreMemberId(useLoginStore.getState().member);

      if (!client || !client.connected || !myId) {
        console.warn('[Layout User Queue] Client not connected or Member ID missing, cannot subscribe yet.');
        return;
      }

      // Fallback Topic Destination (Reliable)
      const topicDestination = `/topic/users.${myId}.rooms.update`;
      // Standard User Destination (May have Broker/Config issues)
      const userDestination = '/user/queue/rooms.update';

      console.log(`[Layout User Queue] Subscribing to ${topicDestination} (primary) and ${userDestination} (backup)`);

      const handleMessage = (message: IMessage) => {
        try {
          const payload = JSON.parse(message.body);
          console.log(`[Layout User Queue] Received message from ${message.headers.destination}:`, payload);

          // RoomLastMessageUpdateResp 처리
            if (payload.chatRoomType && payload.latestSequence !== undefined) {
              const update = payload as RoomLastMessageUpdateResp;
              const roomType = update.chatRoomType.toLowerCase();
              const cacheKey = ['chatRooms', roomType];
              const activeRoomKey = `${roomType}-${update.roomId}`;
              const isRoomCurrentlyOpen = activeRoomIdRef.current === activeRoomKey;

            console.log(`[Layout User Queue Update] Processing update for room ${update.roomId} (${roomType}), sender=${update.senderId}, seq=${update.latestSequence}`);

            queryClient.setQueryData<any[]>(cacheKey, (prevRooms) => {
              if (!prevRooms) {
                console.warn(`[Layout User Queue Update] No cached rooms found for ${roomType}. Triggering refetch.`);
                queryClient.invalidateQueries({ queryKey: cacheKey });
                return prevRooms;
              }

              // Check if room exists in cache
              const exists = prevRooms.some((r: any) => r.id === update.roomId);
              
              if (!exists) {
                console.log(`[Layout User Queue Update] Room ${update.roomId} not found in ${roomType} cache. It might be a new room. Invalidating cache to fetch fresh list.`);
                // Force refetch to get the new room
                queryClient.invalidateQueries({ queryKey: cacheKey });
                return prevRooms;
              }

              const updated = prevRooms.map((room: any) => {
                if (room.id !== update.roomId) return room;

                let unreadCount = room.unreadCount || 0;
                // currentMemberId가 undefined이면(로딩중) 계산이 부정확할 수 있으나, 보통 로딩 후 구독됨.
                const currentMyId = currentMemberId ?? resolveStoreMemberId(useLoginStore.getState().member);

                // 타입 안전한 비교 (String 변환)
                const isOwnMessage = String(update.senderId) === String(currentMyId);
                let lastReadSequence = room.lastReadSequence ?? 0;

                if (isOwnMessage) {
                  unreadCount = 0;
                  // 내가 보낸 메시지라면, 내 lastReadSequence도 최신으로 업데이트해야 함
                  lastReadSequence = update.latestSequence;
                  console.log(`[Layout User Queue Update] Room ${update.roomId} - own message, unreadCount=0, updating lastReadSeq to ${lastReadSequence}`);
                } else if (isRoomCurrentlyOpen) {
                  unreadCount = 0;
                  // 방이 열려있으면 바로 읽은 것으로 처리
                  lastReadSequence = update.latestSequence;
                  console.log(`[Layout User Queue Update] Room ${update.roomId} is currently open; keeping unreadCount=0, updating lastReadSeq to ${lastReadSequence}`);
                } else {
                  unreadCount = Math.max(0, update.latestSequence - lastReadSequence);
                  console.log(`[Layout User Queue Update] Room ${update.roomId} unreadCount: ${unreadCount} (latestSeq=${update.latestSequence}, lastReadSeq=${lastReadSequence})`);
                }

                return {
                  ...room,
                  lastMessageAt: update.lastMessageAt,
                  lastMessageContent: update.lastMessageContent,
                  unreadCount: unreadCount,
                  lastReadSequence: lastReadSequence
                };
              });

              const sorted = updated.sort((a: any, b: any) => {
                const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
                const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
                return timeB - timeA;
              });

              console.log(`[Layout User Queue Update] Sorted ${roomType} top room ID:`, sorted.length > 0 ? sorted[0].id : 'none');
              return sorted;
            });
          }
        } catch (err) {
          console.error('[Layout User Queue] Error processing message:', err);
        }
      };

      // Subscribe to BOTH destinations to be safe
      const topicSub = client.subscribe(topicDestination, handleMessage);
      const userSub = client.subscribe(userDestination, handleMessage);

      // Store unsubscription logic
      subscription = {
        unsubscribe: () => {
          topicSub.unsubscribe();
          userSub.unsubscribe();
        }
      };
      
      userQueueSubscriptionRef.current = subscription;
    }

    // STOMP 연결 후 구독
    connect(accessToken, () => {
      // Clean up previous subscription if exists (though useEffect cleanup handles this usually)
      if (userQueueSubscriptionRef.current) {
        userQueueSubscriptionRef.current.unsubscribe();
        userQueueSubscriptionRef.current = null;
      }
      subscribeToUserQueue();
    });

    return () => {
      if (userQueueSubscriptionRef.current) {
        console.log('[Layout User Queue] Unsubscribing from user queue');
        userQueueSubscriptionRef.current.unsubscribe();
        userQueueSubscriptionRef.current = null;
      }
    };

  }, [member, accessToken, queryClient, currentMemberId]);

  const rooms = useMemo(() => {
    if (!member) {
      return { direct: [], group: [], ai: [] };
    }

    const directRooms: ChatRoom[] = (directRoomsData || []).map((room: DirectChatRoomResp) => {
      const partner = currentMemberId && room.user1.id === currentMemberId ? room.user2 : room.user1;
      return {
        id: `direct-${room.id}`,
        name: partner.nickname,
        avatar: (partner as any).profileImageUrl,
        type: 'direct',
        unreadCount: room.unreadCount,
        lastMessage: room.lastMessageContent || '채팅을 시작해보세요.',
        lastMessageTime: room.lastMessageAt ?? '',
      };
    });

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
        avatar: "🤖",
        type: 'ai',
        unreadCount: 0,
        lastMessage: 'AI 튜터와 대화해보세요.',
        lastMessageTime: '',
      };
    });

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
