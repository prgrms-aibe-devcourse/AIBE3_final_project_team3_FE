"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useChatMessagesQuery, useGetDirectChatRoomsQuery, useGetGroupChatRoomsQuery, useGetAiChatRoomsQuery } from "@/global/api/useChatQuery";
import { useQueryClient } from "@tanstack/react-query";
import { getStompClient, connect } from "@/global/stomp/stompClient";
import { useLoginStore } from "@/global/stores/useLoginStore";
import { MessageResp, DirectChatRoomResp, GroupChatRoomResp, AIChatRoomResp, ReadStatusUpdateEvent, SubscriberCountUpdateResp, UnreadCountUpdateEvent } from "@/global/types/chat.types";
import type { IMessage, ISubscription } from "@stomp/stompjs";
import ChatWindow from "../../_components/ChatWindow";

// 번역 완료 및 피드백을 포함하는 메시지 업데이트 타입
type MessageUpdatePayload = {
  messageId: string;
  translatedContent: string;
  feedback: any[]; // feedback 구조는 나중에 더 구체화할 수 있습니다.
};

export default function ChatRoomPage() {
  const params = useParams();
  const chatRoomType = params.type as string;
  const roomId = Number(params.id);

  const member = useLoginStore((state) => state.member);
  const { accessToken } = useLoginStore.getState();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatMessagesQuery(roomId, chatRoomType);

  // 채팅방 목록 데이터를 가져와서 현재 방의 상세 정보를 찾기 위함
  const { data: directRoomsData } = useGetDirectChatRoomsQuery();
  const { data: groupRoomsData } = useGetGroupChatRoomsQuery();
  const { data: aiRoomsData } = useGetAiChatRoomsQuery();

  const [messages, setMessages] = useState<MessageResp[]>([]);
  const [subscriberCount, setSubscriberCount] = useState<number>(0);
  const [totalMemberCount, setTotalMemberCount] = useState<number>(0);

  useEffect(() => {
    if (data) {
      queryClient.invalidateQueries({ queryKey: ['chatRooms', chatRoomType] });
    }
  }, [data, chatRoomType, queryClient]);

  const roomDetails = useMemo(() => {
    if (!member) return null;
    let room;
    if (chatRoomType === 'direct' && directRoomsData) {
      room = directRoomsData.find((r: DirectChatRoomResp) => r.id === roomId);
      if (room) {
        const partner = room.user1.id === member.memberId ? room.user2 : room.user1;
        return { id: roomId, name: partner.nickname, type: chatRoomType, avatar: '👤', members: [room.user1, room.user2] };
      }
    } else if (chatRoomType === 'group' && groupRoomsData) {
      room = groupRoomsData.find((r: GroupChatRoomResp) => r.id === roomId);
      if (room) return { id: roomId, name: room.name, type: chatRoomType, avatar: '👥', members: room.members, ownerId: room.ownerId };
    } else if (chatRoomType === 'ai' && aiRoomsData) {
      room = aiRoomsData.find((r: AIChatRoomResp) => r.id === roomId);
      if (room) return { id: roomId, name: room.name, type: chatRoomType, avatar: '🤖', members: [] };
    }
    return null;
  }, [chatRoomType, roomId, directRoomsData, groupRoomsData, aiRoomsData, member]);

  // roomDetails가 로드되면 총 멤버 수를 설정
  useEffect(() => {
    if (roomDetails?.members) {
      setTotalMemberCount(roomDetails.members.length);
    }
  }, [roomDetails]);

  useEffect(() => {
    setMessages([]);
  }, [roomId, chatRoomType]);

  useEffect(() => {
    if (data?.pages) {
      const allMessages = data.pages.filter(page => page?.messages).flatMap(page => page.messages);
      setMessages(allMessages);
    }
  }, [data]);

  useEffect(() => {
    if (!roomId || !member || !chatRoomType || !accessToken) return;

    const subscriptions: ISubscription[] = [];
    let isCleanedUp = false;

    const setupSubscriptions = () => {
      if (isCleanedUp) return;
      
      const client = getStompClient();
      
      // 1. 일반 메시지 및 이벤트 구독
      const mainDestination = `/topic/${chatRoomType}/rooms/${roomId}`;
      console.log(`[WebSocket] Subscribing to: ${mainDestination}`);
      subscriptions.push(client.subscribe(mainDestination, (message: IMessage) => {
        const payload = JSON.parse(message.body);
        if (payload.subscriberCount !== undefined) {
          setSubscriberCount(payload.subscriberCount);
          setTotalMemberCount(payload.totalMemberCount);
        } else if (payload.updates !== undefined) {
          const updateEvent = payload as UnreadCountUpdateEvent;
          setMessages(prev => {
            const updateMap = new Map(updateEvent.updates.map(u => [u.messageId, u.unreadCount]));
            return prev.map(msg => updateMap.has(msg.id) ? { ...msg, unreadCount: updateMap.get(msg.id)! } : msg);
          });
        } else {
          setMessages(prev => [...prev, payload as MessageResp]);
        }
      }));

      // 2. 번역 완료 메시지 구독
      const updateDestination = `/topic/${chatRoomType}/rooms/${roomId}/message-update`;
      console.log(`[WebSocket] Subscribing to: ${updateDestination}`);
      subscriptions.push(client.subscribe(updateDestination, (message: IMessage) => {
        const payload = JSON.parse(message.body) as MessageUpdatePayload;
        console.log(`[WebSocket] Received message update:`, payload);
        setMessages(prev => prev.map(msg => 
          msg.id === payload.messageId 
            ? { ...msg, translatedContent: payload.translatedContent, feedback: payload.feedback } 
            : msg
        ));
      }));
      
      console.log(`[WebSocket] ${subscriptions.length} subscriptions created for room ${roomId}`);
    };

    connect(accessToken, setupSubscriptions);

    return () => {
      console.log(`[WebSocket Cleanup] Cleaning up for room ${roomId}`);
      isCleanedUp = true;
      subscriptions.forEach(sub => {
        console.log(`[WebSocket Cleanup] Unsubscribing from subscriptionId=${sub.id}`);
        sub.unsubscribe();
      });
    };
  }, [roomId, member, chatRoomType, accessToken]);

  const handleSendMessage = (message: { text: string; isTranslateEnabled: boolean }) => {
    if (message.text.trim() === "" || !member) return;

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
      console.error("Client is not connected.");
      alert("웹소켓 연결이 활성화되지 않았습니다. 페이지를 새로고침 해주세요.");
    }
  };

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
