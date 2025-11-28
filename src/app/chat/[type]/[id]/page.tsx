"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useChatMessagesQuery, useGetDirectChatRoomsQuery, useGetGroupChatRoomsQuery, useGetAiChatRoomsQuery } from "@/global/api/useChatQuery";
import { useQueryClient } from "@tanstack/react-query";
import { getStompClient, connect } from "@/global/stomp/stompClient";
import { useLoginStore } from "@/global/stores/useLoginStore";
import { MessageResp, DirectChatRoomResp, GroupChatRoomResp, AIChatRoomResp, ReadStatusUpdateEvent, SubscriberCountUpdateResp, UnreadCountUpdateEvent } from "@/global/types/chat.types";
import type { IMessage } from "@stomp/stompjs";
import ChatWindow from "../../_components/ChatWindow"; // Import the new component

export default function ChatRoomPage() {
  const params = useParams();
  const chatRoomType = params.type as string;
  const roomId = Number(params.id);

  const member = useLoginStore((state) => state.member);
  const { accessToken } = useLoginStore.getState();
  const queryClient = useQueryClient();

  // Fetch room lists directly
  const { data: directRoomsData } = useGetDirectChatRoomsQuery();
  const { data: groupRoomsData } = useGetGroupChatRoomsQuery();
  const { data: aiRoomsData } = useGetAiChatRoomsQuery();

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatMessagesQuery(roomId, chatRoomType);
  const [messages, setMessages] = useState<MessageResp[]>([]);
  const [subscriberCount, setSubscriberCount] = useState<number>(0);
  const [totalMemberCount, setTotalMemberCount] = useState<number>(0);

  // When message data is successfully loaded, it means markAsReadOnEnter was called on the backend.
  // We can now invalidate the room list query to update the unread count badge.
  useEffect(() => {
    if (data) {
      console.log('[Query Invalidation] Messages loaded, invalidating chatRooms query to update unread count.');
      queryClient.invalidateQueries({ queryKey: ['chatRooms', chatRoomType] });
    }
  }, [data, chatRoomType, queryClient]);

  // Find room details from API data
  const roomDetails = useMemo(() => {
    if (!member) return null;

    if (chatRoomType === 'direct' && directRoomsData) {
      const room = directRoomsData.find((r: DirectChatRoomResp) => r.id === roomId);
      if (room) {
        const partner = room.user1.id === member.memberId ? room.user2 : room.user1;
        return {
          id: roomId,
          name: partner.nickname,
          type: chatRoomType,
          avatar: '👤',
          members: [room.user1, room.user2],
        };
      }
    } else if (chatRoomType === 'group' && groupRoomsData) {
      const room = groupRoomsData.find((r: GroupChatRoomResp) => r.id === roomId);
      if (room) {
        return {
          id: roomId,
          name: room.name,
          type: chatRoomType,
          avatar: '👥',
          members: room.members,
          ownerId: room.ownerId,
        };
      }
    } else if (chatRoomType === 'ai' && aiRoomsData) {
      const room = aiRoomsData.find((r: AIChatRoomResp) => r.id === roomId);
      if (room) {
        return {
          id: roomId,
          name: room.name,
          type: chatRoomType,
          avatar: '🤖',
          members: [],
        };
      }
    }

    return null;
  }, [chatRoomType, roomId, directRoomsData, groupRoomsData, aiRoomsData, member]);

  // Reset when room changes
  useEffect(() => {
    console.log(`[Data] Room changed, resetting messages for roomId=${roomId}`);
    setMessages([]);
  }, [roomId, chatRoomType]);

  // Load messages from API (flatten all pages from infinite query)
  useEffect(() => {
    if (data?.pages) {
      const allMessages = data.pages
        .filter(page => page?.messages)
        .flatMap(page => page.messages);
      console.log(`[Data] Loaded ${allMessages.length} messages from ${data.pages.length} pages`);
      setMessages(allMessages);
    }
  }, [data]);

  useEffect(() => {
    if (!roomId || !member || !chatRoomType || !accessToken) return;

    console.log(`[WebSocket Setup] Starting for roomId=${roomId}, memberId=${member.memberId}, type=${chatRoomType}`);

    let subscription: any = null;
    let isCleanedUp = false;

    const setupSubscription = () => {
      const client = getStompClient();
      const destination = `/topic/${chatRoomType}/rooms/${roomId}`;
      console.log(`[WebSocket] Subscribing to: ${destination}`);
      console.log(`[WebSocket] Client connected: ${client.connected}, Session ID (internal): ${client.webSocket ? 'connected' : 'not connected'}`);

      // 이미 cleanup되었으면 구독하지 않음
      if (isCleanedUp) {
        console.log(`[WebSocket] Component unmounted, skipping subscription`);
        return;
      }

      subscription = client.subscribe(
        destination,
        (message: IMessage) => {
          const payload = JSON.parse(message.body);

          // 구독자 수 업데이트 이벤트 처리
          if (payload.subscriberCount !== undefined && payload.totalMemberCount !== undefined) {
            const countEvent = payload as SubscriberCountUpdateResp;
            console.log(`[WebSocket] Received subscriber count event:`, countEvent);
            setSubscriberCount(countEvent.subscriberCount);
            setTotalMemberCount(countEvent.totalMemberCount);
          }
          // UnreadCount 업데이트 이벤트 처리 (서버가 정확한 값 계산해서 전송)
          else if (payload.updates !== undefined) {
            const updateEvent = payload as UnreadCountUpdateEvent;
            console.log(`🔔 [WebSocket UNREAD UPDATE] Received ${updateEvent.updates.length} updates`);

            setMessages((prevMessages) => {
              // Map을 만들어서 빠른 조회
              const updateMap = new Map(updateEvent.updates.map(u => [u.messageId, u.unreadCount]));

              return prevMessages.map((msg) => {
                const newCount = updateMap.get(msg.id);
                if (newCount !== undefined) {
                  console.log(`✅ [UNREAD UPDATE] msg ${msg.id} (seq=${msg.sequence}): ${msg.unreadCount} → ${newCount}`);
                  return { ...msg, unreadCount: newCount };
                }
                return msg;
              });
            });
          } else {
            // 일반 메시지 처리
            const receivedMessage = payload as MessageResp;
            console.log(`[WebSocket] Received message:`, receivedMessage);
            setMessages((prevMessages) => [...prevMessages, receivedMessage]);
          }
        }
      );
      console.log(`[WebSocket] Subscription created for room ${roomId}, subscriptionId=${subscription?.id}`);
    };

    connect(accessToken, setupSubscription);

    return () => {
      console.log(`[WebSocket Cleanup] Starting cleanup for roomId=${roomId}, memberId=${member.memberId}`);
      isCleanedUp = true;
      if (subscription) {
        console.log(`[WebSocket Cleanup] Unsubscribing from room ${roomId}, subscriptionId=${subscription.id}`);
        subscription.unsubscribe();
        subscription = null;
        console.log(`[WebSocket Cleanup] Unsubscribed successfully from room ${roomId}`);
      } else {
        console.log(`[WebSocket Cleanup] No subscription to unsubscribe from room ${roomId}`);
      }
    };
  }, [roomId, member, chatRoomType, accessToken]);

  const handleSendMessage = (text: string) => {
    if (text.trim() === "" || !member) {
      return;
    }

    const client = getStompClient();

    if (client.connected) {
      const messagePayload = {
        roomId: roomId,
        content: text,
        messageType: "TEXT",
        chatRoomType: chatRoomType.toUpperCase(),
      };
      console.log(`[WebSocket] Sending message:`, messagePayload);
      client.publish({
        destination: "/app/chats/sendMessage",
        body: JSON.stringify(messagePayload),
      });
    } else {
      console.error("Client is not connected.");
      alert("웹소켓 연결이 활성화되지 않았습니다. 페이지를 새로고침 해주세요.");
    }
  };

  // The page now only handles logic and passes everything to the ChatWindow component
  return (
    <ChatWindow
      messages={messages}
      member={member}
      onSendMessage={handleSendMessage}
      isLoading={isLoading}
      error={error}
      roomDetails={roomDetails ? { ...roomDetails, id: roomId, type: chatRoomType } : null}
      subscriberCount={subscriberCount}
      totalMemberCount={totalMemberCount}
      onLoadMore={fetchNextPage}
      hasMore={hasNextPage}
      isLoadingMore={isFetchingNextPage}
    />
  );
}