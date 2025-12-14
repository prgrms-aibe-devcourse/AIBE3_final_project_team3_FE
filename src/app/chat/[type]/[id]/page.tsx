"use client";

import { useChatMessagesQuery, useGetAiChatRoomsQuery, useGetDirectChatRoomsQuery, useGetGroupChatRoomsQuery } from "@/global/api/useChatQuery";
import { connect, getStompClient } from "@/global/stomp/stompClient";
import { useLoginStore } from "@/global/stores/useLoginStore";
import { AIChatRoomResp, DirectChatRoomResp, GroupChatRoomResp, MessageResp, SubscriberCountUpdateResp, UnreadCountUpdateEvent } from "@/global/types/chat.types";
import type { IMessage } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
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

  // useRoomClosedRedirect();

  // When message data is successfully loaded, it means markAsReadOnEnter was called on the backend.
  // We optimistically update the unread count and lastReadSequence for the current room.
  useEffect(() => {
    if (data && data.pages.length > 0) {
      // The most recent page (first fetched) contains the updated lastReadSequence
      const latestPage = data.pages[0];
      const updatedLastReadSequence = latestPage.lastReadSequence;

      console.log(`[Optimistic Update] Messages loaded for room ${roomId}. Setting unreadCount=0, lastReadSequence=${updatedLastReadSequence}`);
      
      queryClient.setQueryData(['chatRooms', chatRoomType], (oldData: any[]) => {
        if (!oldData) return oldData;
        
        return oldData.map((room) => {
          if (room.id === roomId) {
            return { 
              ...room, 
              unreadCount: 0,
              // Update lastReadSequence if provided by the backend
              ...(updatedLastReadSequence !== undefined && { lastReadSequence: updatedLastReadSequence })
            };
          }
          return room;
        });
      });
    }
  }, [data, chatRoomType, roomId, queryClient]);

  // Find room details from API data
  const roomDetails = useMemo(() => {
    if (!member) return null;

    if (chatRoomType === 'direct' && directRoomsData) {
      const room = directRoomsData.find((r: DirectChatRoomResp) => r.id === roomId);
      if (room) {
        const partner = room.user1.id === member.id ? room.user2 : room.user1;
        return {
          id: roomId,
          name: partner.nickname,
          type: chatRoomType,
          avatar: '👤',
          members: [room.user1, room.user2],
        };
      }
    } else if (chatRoomType === 'group' && groupRoomsData) {
      const room = groupRoomsData.find((r) => r.id === roomId);
      if (room) {
        return {
          id: roomId,
          name: room.name,
          type: chatRoomType,
          avatar: '👥',
          topic: room.topic,
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

      // Deduplicate by ID
      const uniqueMessages = Array.from(
        new Map(allMessages.map((msg) => [msg.id, msg])).values()
      );

      // 전체를 한번 정렬해서 순서 뒤섞임 방지 (오래된 → 최신)
      uniqueMessages.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

      console.log(`[Data] Loaded ${uniqueMessages.length} messages from ${data.pages.length} pages`);
      setMessages(uniqueMessages);
    }
  }, [data]);

  const subscriptionRef = useRef<any>(null);

  const setupSubscription = useCallback(() => {
    const client = getStompClient();
    const destination = `/topic/${chatRoomType}.rooms.${roomId}`;

    console.log(`[WebSocket] Subscribing to: ${destination}`);

    if (subscriptionRef.current) {
      console.log(`[WebSocket] Already subscribed to ${destination}`);
      return;
    }

    // 1. 통합 구독 (일반 메시지 + 번역 업데이트 + 상태 업데이트)
    subscriptionRef.current = client.subscribe(
      destination,
      (message: IMessage) => {
        const payload = JSON.parse(message.body);

        // 0. 읽음 카운트 업데이트 (배열 형태로 옴)
        if (Array.isArray(payload)) {
           console.log(`[WebSocket] Received unread count updates:`, payload);
           setMessages((prevMessages) => {
             const updateMap = new Map(payload.map((u: any) => [u.messageId, u.unreadCount]));
             return prevMessages.map((msg) => {
               const newCount = updateMap.get(msg.id);
               return newCount !== undefined ? { ...msg, unreadCount: newCount } : msg;
             });
           });
           return;
        }
        
        // 방 폐쇄 이벤트 처리
        if (payload.type === "ROOM_CLOSED") {
          console.log("[WebSocket] Room closed event received", payload);

          alert(`'${payload.roomName}' 채팅방이 폐쇄되었습니다.\n사유: ${payload.reasonLabel}`);
          window.location.reload();
          return;
        }
        // 1. 번역 업데이트 이벤트 처리
        if (payload.type === 'TRANSLATION_UPDATE') {
           console.log(`[WebSocket] Received translation update:`, payload);
           if (payload.messageId && payload.translatedContent) {
              setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                  msg.id === payload.messageId
                    ? { ...msg, translatedContent: payload.translatedContent }
                    : msg
                )
              );
           }
        }
        // 2. 멤버 업데이트 이벤트 처리 (JOIN, LEAVE, KICK)
        else if (['JOIN', 'LEAVE', 'KICK'].includes(payload.type)) {
           console.log(`[WebSocket] Received member update:`, payload);
           if (payload.subscriberCount !== undefined) setSubscriberCount(payload.subscriberCount);
           if (payload.totalMemberCount !== undefined) setTotalMemberCount(payload.totalMemberCount);
           
           // 멤버 목록 갱신
           if (chatRoomType === 'group') {
                queryClient.invalidateQueries({ queryKey: ['chatRooms', 'group'] });
           }
        }
        // 3. 구독자 수 업데이트 이벤트 처리
        else if (payload.subscriberCount !== undefined && payload.totalMemberCount !== undefined) {
          const countEvent = payload as SubscriberCountUpdateResp;
          console.log(`[WebSocket] Received subscriber count event:`, countEvent);
          setSubscriberCount(countEvent.subscriberCount);
          setTotalMemberCount(countEvent.totalMemberCount);
        }
        // 3. UnreadCount 업데이트 이벤트 처리
        else if (payload.updates !== undefined) {
          const updateEvent = payload as UnreadCountUpdateEvent;
          console.log(`🔔 [WebSocket UNREAD UPDATE] Received ${updateEvent.updates.length} updates`);

          setMessages((prevMessages) => {
            const updateMap = new Map(updateEvent.updates.map(u => [u.messageId, u.unreadCount]));
            return prevMessages.map((msg) => {
              const newCount = updateMap.get(msg.id);
              if (newCount !== undefined) {
                return { ...msg, unreadCount: newCount };
              }
              return msg;
            });
          });
        }
        // 4. 일반 메시지 처리
        else {
          // RoomLastMessageUpdateResp 등이 같은 토픽으로 올 수 있으므로 id가 없으면 무시
          if (!payload.id) {
             console.log('[WebSocket] Ignoring non-message payload (likely RoomLastMessageUpdateResp):', payload);
             return;
          }

          const receivedMessage = payload as MessageResp;
          console.log(`[WebSocket] Received message:`, receivedMessage);
          setMessages((prevMessages) => {
            // Prevent duplicate messages
            if (prevMessages.some(m => m.id === receivedMessage.id)) {
              return prevMessages;
            }
            return [...prevMessages, receivedMessage].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
          });

          // 채팅방 리스트 캐시 업데이트 (실시간 정렬용)
          const roomType = chatRoomType;
          const cacheKey = ['chatRooms', roomType];
          queryClient.setQueryData<any[]>(cacheKey, (prevRooms) => {
            if (!prevRooms) return prevRooms;

            const updated = prevRooms.map((room: any) => {
              if (room.id !== Number(roomId)) return room;

              return {
                ...room,
                lastMessageAt: receivedMessage.createdAt,
                lastMessageContent: receivedMessage.content,
                // 본인이 보낸 메시지면 unreadCount = 0
                unreadCount: receivedMessage.senderId === member?.id ? 0 : (room.unreadCount || 0)
              };
            });

            // lastMessageAt 기준으로 재정렬
            return updated.sort((a: any, b: any) => {
              const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
              const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
              return timeB - timeA;
            });
          });

          // 방장 위임 시스템 메시지인 경우 채팅방 정보 업데이트
          if (receivedMessage.messageType === 'SYSTEM' && receivedMessage.content) {
            try {
              const systemMsg = JSON.parse(receivedMessage.content);
              if (systemMsg.type === 'OWNER_CHANGED') {
                console.log('[WebSocket] Owner changed, refetching room info');
                queryClient.invalidateQueries({ queryKey: ['chatRooms', chatRoomType] });
              }
            } catch (e) {
              // Not a JSON system message, ignore
            }
          }
          // Note: 방 리스트 업데이트는 layout.tsx의 /user/{userId}/queue/rooms/update 구독에서 처리됨
        }
      }
    );

    console.log(`[WebSocket] Subscription created for room ${roomId}`);
  }, [chatRoomType, roomId, queryClient]);

  useEffect(() => {
    if (!roomId || !member || !chatRoomType || !accessToken) return;

    console.log(`[WebSocket Setup] Starting for roomId=${roomId}, memberId=${member.id}, type=${chatRoomType}`);

    connect(accessToken, setupSubscription);

    // 안전장치: 1초 후에도 구독이 안 되어 있다면 재시도 (새로고침 직후 연결 불안정 해결)
    const retryTimer = setTimeout(() => {
      if (!subscriptionRef.current) {
        console.warn(`[WebSocket] Subscription not established after 1s. Retrying...`);
        connect(accessToken, setupSubscription);
      }
    }, 1000);

    return () => {
      clearTimeout(retryTimer);
      console.log(`[WebSocket Cleanup] Starting cleanup for roomId=${roomId}, memberId=${member.id}`);
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      console.log(`[WebSocket Cleanup] Unsubscribed successfully from room ${roomId}`);
    };
  }, [roomId, member, chatRoomType, accessToken, setupSubscription]);

  const handleSendMessage = (message: { text: string; isTranslateEnabled: boolean }) => {
    if (message.text.trim() === "" || !member) {
      return;
    }

    const client = getStompClient();

    if (client.connected) {
      const messagePayload = {
        roomId: roomId,
        content: message.text,
        messageType: "TEXT",
        chatRoomType: chatRoomType.toUpperCase(),
        isTranslateEnabled: message.isTranslateEnabled,
      };
      console.log(`[WebSocket] Sending message:`, messagePayload);
      client.publish({
        destination: "/app/chats/sendMessage",
        body: JSON.stringify(messagePayload),
      });
    } else {
      console.error("Client is not connected. Attempting to reconnect...");
      if (accessToken) {
        connect(accessToken, () => {
          setupSubscription();
          alert("채팅 서버와 다시 연결되었습니다. 메시지를 다시 전송해주세요.");
        });
      } else {
        console.error("Cannot reconnect: No access token available");
      }
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
