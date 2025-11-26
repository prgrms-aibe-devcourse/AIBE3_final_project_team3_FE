"use client";

import ChatSidebar from "./_components/ChatSidebar";
import { ChatRoom, useChatStore } from "@/global/stores/useChatStore";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useGetDirectChatRoomsQuery, useGetGroupChatRoomsQuery, useGetAiChatRoomsQuery } from '@/global/api/useChatQuery';
import { useLoginStore } from '@/global/stores/useLoginStore';
import { DirectChatRoomResp, GroupChatRoomResp, AIChatRoomResp } from '@/global/types/chat.types';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { activeTab, setActiveTab, setSelectedRoomId, selectedRoomId } = useChatStore();
  const router = useRouter();
  const member = useLoginStore((state) => state.member);
  console.log("Layout Debug - Current member:", member);

  const { data: directRoomsData } = useGetDirectChatRoomsQuery();
  const { data: groupRoomsData } = useGetGroupChatRoomsQuery();
  const { data: aiRoomsData } = useGetAiChatRoomsQuery();
  console.log("Layout Debug - directRoomsData:", directRoomsData);

  const rooms = useMemo(() => {
    if (!member) {
      console.log("Layout Debug - Member is null, returning empty rooms.");
      return { direct: [], group: [], ai: [] };
    }

    const directRooms: ChatRoom[] = (directRoomsData || []).map((room: DirectChatRoomResp) => {
      const partner = room.user1.id === member.memberId ? room.user2 : room.user1;
      console.log("Layout Debug - Direct Room Transformation:", {
        roomId: room.id,
        user1Id: room.user1.id,
        user2Id: room.user2.id,
        currentMemberId: member.memberId,
        partnerNickname: partner.nickname,
      });
      return {
        id: `direct-${room.id}`,
        name: partner.nickname,
        avatar: partner.profileImageUrl || '/img/profile-fallback.png',
        type: 'direct',
        unreadCount: 0,
        lastMessage: '대화를 시작해보세요.',
        lastMessageTime: '',
      };
    });

    const groupRooms: ChatRoom[] = (groupRoomsData || []).map((room: GroupChatRoomResp) => {
      return {
        id: `group-${room.id}`,
        name: room.name,
        avatar: '/img/group-chat-fallback.png',
        type: 'group',
        unreadCount: 0,
        lastMessage: room.description || '그룹 채팅방입니다.',
        lastMessageTime: '',
      };
    });

    const aiRooms: ChatRoom[] = (aiRoomsData || []).map((room: AIChatRoomResp) => {
      return {
        id: `ai-${room.id}`,
        name: room.name,
        avatar: '/img/ai-chat-fallback.png',
        type: 'ai',
        unreadCount: 0,
        lastMessage: room.aiPersona || 'AI 튜터와 대화해보세요.',
        lastMessageTime: '',
      };
    });
    console.log("Layout Debug - Transformed rooms:", { direct: directRooms, group: groupRooms, ai: aiRooms });
    return {
      direct: directRooms,
      group: groupRooms,
      ai: aiRooms,
    };
  }, [directRoomsData, groupRoomsData, aiRoomsData, member]);

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
    const firstRoomInTab = rooms[tab][0];
    if (firstRoomInTab) {
      handleSetSelectedRoom(firstRoomInTab.id);
    } else {
      handleSetSelectedRoom(null);
    }
  };
  
  // Ensure a room is selected on initial load if there isn't one
  useEffect(() => {
    if (!selectedRoomId && rooms[activeTab].length > 0) {
      const firstRoomId = rooms[activeTab][0].id;
      const [type, actualId] = firstRoomId.split('-'); // Split here
      setSelectedRoomId(firstRoomId);
      router.replace(`/chat/${type}/${actualId}`); // Use split parts
    }
  }, [activeTab, rooms, selectedRoomId, setSelectedRoomId, router]);


  return (
    <div className="h-screen w-full lg:w-3/5 lg:mx-auto">
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
